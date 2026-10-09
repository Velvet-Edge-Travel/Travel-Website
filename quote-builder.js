const form = document.querySelector("#quote-builder");
const status = document.querySelector("[data-builder-status]");
const lists = {
  flight: document.querySelector('[data-list="flight"]'),
  transfer: document.querySelector('[data-list="transfer"]'),
  experience: document.querySelector('[data-list="experience"]'),
  extra: document.querySelector('[data-list="extra"]'),
  day: document.querySelector('[data-list="day"]'),
  stay: document.querySelector('[data-list="stay"]'),
  golf: document.querySelector('[data-list="golf"]'),
};

const htmlEscape = (value = "") =>
  String(value).replace(
    /[&<>"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character],
  );

const attributeEscape = (value = "") =>
  htmlEscape(value).replace(/'/g, "&#39;");

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
};

const shortDate = (value) => {
  if (!value) return { day: "", month: "" };
  const date = new Date(`${value}T00:00:00Z`);
  return {
    day: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      timeZone: "UTC",
    }).format(date),
    month: new Intl.DateTimeFormat("en-GB", {
      month: "short",
      timeZone: "UTC",
    }).format(date),
  };
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "client-quote";

const setStatus = (message, isError = false) => {
  status.textContent = message;
  status.classList.toggle("is-error", isError);
};

// Keep image data in the existing image field so HTML exports and JSON drafts
// remain self-contained, including when an older draft is loaded.
let imageControlId = 0;
const prepareImage = async (file) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Please choose a JPG, PNG or WebP image.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Please choose an image smaller than 20 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable in this browser.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const setupImageUpload = (item) => {
  const field = item.querySelector('[data-key="image"]');
  if (!field) return;
  const container = field.parentElement;
  const urlLabel = container.querySelector("label");
  const id = `stay-image-${++imageControlId}`;
  field.id = `${id}-url`;
  urlLabel.htmlFor = field.id;
  urlLabel.textContent = "Or use an image URL";

  const uploadLabel = document.createElement("label");
  uploadLabel.htmlFor = id;
  uploadLabel.textContent = "Upload image";
  const upload = document.createElement("input");
  upload.type = "file";
  upload.id = id;
  upload.accept = "image/jpeg,image/png,image/webp";
  const help = document.createElement("small");
  help.id = `${id}-help`;
  help.textContent = "JPG, PNG or WebP, up to 20 MB. Photos are resized and embedded in your quote and editable draft.";
  upload.setAttribute("aria-describedby", help.id);
  const message = document.createElement("small");
  message.setAttribute("role", "status");
  const preview = document.createElement("img");
  preview.alt = "Selected accommodation image";
  preview.style.cssText = "display:block;max-width:100%;max-height:180px;object-fit:contain;margin:10px 0;border-radius:8px";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "builder-secondary";
  remove.textContent = "Remove image";
  container.prepend(uploadLabel, upload, help);
  container.append(message, preview, remove);

  let revision = 0;
  const refresh = () => {
    const embedded = /^data:image\//i.test(field.value);
    field.type = embedded ? "hidden" : "url";
    urlLabel.style.display = embedded ? "none" : "";
    // Only show local embedded previews; existing URL-based quotes still work.
    preview.style.display = embedded ? "block" : "none";
    if (embedded) preview.src = field.value;
    else preview.removeAttribute("src");
    remove.style.display = field.value ? "" : "none";
    message.textContent = embedded ? "Image embedded — ready to include in your quote." : "";
  };
  field.addEventListener("input", refresh);
  remove.addEventListener("click", () => {
    revision++;
    delete item.dataset.imagePending;
    upload.disabled = false;
    field.disabled = false;
    upload.value = "";
    field.value = "";
    refresh();
  });
  upload.addEventListener("change", async () => {
    const file = upload.files[0];
    if (!file) return;
    const currentRevision = ++revision;
    item.dataset.imagePending = "true";
    upload.disabled = true;
    field.disabled = true;
    message.textContent = "Preparing image…";
    try {
      const image = await prepareImage(file);
      if (currentRevision !== revision || !item.isConnected) return;
      field.value = image;
      refresh();
    } catch (error) {
      if (currentRevision !== revision || !item.isConnected) return;
      message.textContent = error.message || "This image could not be read. Please choose another photo.";
    } finally {
      if (currentRevision === revision) {
        delete item.dataset.imagePending;
        upload.disabled = false;
        field.disabled = false;
        upload.value = "";
      }
    }
  });
  refresh();
};

const imagesReady = () => {
  if (!form.querySelector('[data-image-pending="true"]')) return true;
  setStatus("Please wait for your image to finish preparing.", true);
  return false;
};

const addItem = (type, values = {}) => {
  const template = document.querySelector(`#${type}-template`);
  const item = template.content.firstElementChild.cloneNode(true);
  item.querySelectorAll("[data-key]").forEach((field) => {
    const defaults={costBasis:'group',costQuantity:'1',pricingTreatment:['day','extra'].includes(type)?'information':'included'};
    field.value = values[field.dataset.key] ?? defaults[field.dataset.key] ?? "";
  });
  item
    .querySelector("[data-remove]")
    .addEventListener("click", () => {item.remove(); refreshJourneySummary();});
  lists[type].append(item);
  if (type === "stay") setupImageUpload(item);
  item.querySelectorAll("[data-key]").forEach((field,index)=>{if(!field.id) field.id = `entry-${++imageControlId}-${index}`; const label=field.parentElement.querySelector("label"); if(label) label.htmlFor=field.id;});
  syncSections();
};

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => addItem(button.dataset.add));
});

const readItems = (type) =>
  [...lists[type].querySelectorAll(`[data-item="${type}"]`)].map((item) =>
    Object.fromEntries(
      [...item.querySelectorAll("[data-key]")].map((field) => [
        field.dataset.key,
        field.value.trim(),
      ]),
    ),
  );

const itemKeys = {day:"days", stay:"stays", golf:"golf", flight:"flights", transfer:"transfers", experience:"experiences", extra:"extras"};
const pricingLabels={flight:'Flights',stay:'Hotels',transfer:'Transfers',experience:'Excursions and itinerary',day:'Day-to-day itinerary',golf:'Golf itinerary',extra:'Additional holiday information'};
const priceTreatment=(item,type)=>{
 if(type==='transfer'||type==='experience') return ({'Included in holiday price':'included','Optional extra — not included':'optional','Pay locally — not included':'local'})[item.priceStatus] || 'unknown';
 return item.pricingTreatment || (['day','extra'].includes(type)?'information':'included');
};
const priceMoney=(cents,currency='GBP')=>new Intl.NumberFormat('en-GB',{style:'currency',currency:['GBP','EUR','USD'].includes(currency)?currency:'GBP'}).format(cents/100);
const calculateQuotePricing=data=>{
 const travellers=Number(data.payingTravellers);
 const errors=[];const sections=[];
 if(!Number.isInteger(travellers)||travellers<1||travellers>100000) errors.push('Enter the number of paying travellers to calculate prices.');
 const number=(value,fallback=0)=>value===''||value===undefined ? fallback : Number(value);
 const round=value=>Math.round(value+1e-8);
 for(const [type,key] of Object.entries(itemKeys)){
  if(!sectionEnabled(data,type))continue;
  const section={type,label:pricingLabels[type],included:0,optional:0,local:0,rows:[]};
  (data[key]||[]).forEach((item,index)=>{
   const treatment=priceTreatment(item,type);const prefix=section.label+' entry '+(index+1)+': ';
   const entered=item.baseCost!==undefined && String(item.baseCost).trim()!=='';
   const row={index,treatment,entered,cents:0};section.rows.push(row);
   if(treatment==='information')return;
   if(treatment==='unknown'){errors.push(prefix+'choose a price treatment.');return;}
   if(!entered){errors.push(prefix+'enter a base cost (0 for free), or use information-only where available.');return;}
   const base=number(item.baseCost),percent=number(item.markupPercent),fixed=number(item.markupAmount);
   const basis=item.costBasis||'group';
   const quantity=basis==='person'?travellers:basis==='unit'?number(item.costQuantity,1):1;
   if(!['group','person','unit'].includes(basis)||![base,percent,fixed,quantity].every(Number.isFinite)||base<0||base>10000000||percent<0||percent>10000||fixed<0||fixed>10000000||!Number.isInteger(quantity)||quantity<1||quantity>100000){errors.push(prefix+'check cost, quantity and markup values.');return;}
   const extended=round(base*100)*quantity;
   row.cents=extended+round(extended*percent/100)+round(fixed*100);
   if(!Number.isSafeInteger(row.cents)){errors.push(prefix+'amount is too large.');return;}
   section[treatment]+=row.cents;
  });
  sections.push(section);
 }
 sections.sort((a,b)=>Object.keys(pricingLabels).indexOf(a.type)-Object.keys(pricingLabels).indexOf(b.type));
 const total=sections.reduce((sum,s)=>sum+s.included,0);
 if(!Number.isSafeInteger(total))errors.push('The quote total is too large.');
 return {sections,total,perPerson:travellers>0?round(total/travellers):0,errors};
};
const renderPricingTable=(pricing,currency)=>'<table class="pricing-breakdown"><thead><tr><th scope="col">Section</th><th scope="col">Included total</th></tr></thead><tbody>'+pricing.sections.filter(section=>section.rows.some(row=>row.treatment==='included'&&row.entered)).map(section=>'<tr><td>'+htmlEscape(section.label)+'</td><td>'+priceMoney(section.included,currency)+'</td></tr>').join('')+'</tbody></table>';
const refreshPricing=()=>{
 const automatic=form.elements.pricingMode.value==='automatic';
 form.elements.payingTravellers.required=automatic;
 form.elements.payingTravellers.disabled=!automatic;
 for(const name of ['perPerson','totalPrice'])form.elements[name].readOnly=automatic;
 const data=getData();const pricing=calculateQuotePricing(data);
 document.querySelectorAll('[data-item]').forEach(item=>{
  const type=item.dataset.item;const rowIndex=[...lists[type].children].indexOf(item);
  const row=pricing.sections.find(section=>section.type===type)?.rows[rowIndex];
  const output=item.querySelector('[data-entry-price]');
  if(output)output.textContent=!automatic?'Automatic calculation is off.':row?.treatment==='information'?'Information only — excluded from price.':row?.entered?'Entry selling price: '+priceMoney(row.cents,data.currency)+' ('+({included:'included',optional:'optional extra',local:'pay locally',unknown:'choose price treatment'})[row.treatment]+')':'Enter a base cost to calculate this entry.';
 });
 const totals=document.querySelector('[data-pricing-totals]');
 if(!automatic){totals.textContent='Manual pricing: enter the total and per-person price yourself. Entry costs and markups are retained.';return;}
 form.elements.totalPrice.value=pricing.errors.length?'':priceMoney(pricing.total,data.currency);
 form.elements.perPerson.value=pricing.errors.length?'':priceMoney(pricing.perPerson,data.currency);
 totals.innerHTML=renderPricingTable(pricing,data.currency)+(pricing.errors.length?'<p class="pricing-warning">'+htmlEscape(pricing.errors[0])+' Totals are incomplete until all selected entries are priced.</p>':'<p><strong>Total: '+priceMoney(pricing.total,data.currency)+' · Average per person: '+priceMoney(pricing.perPerson,data.currency)+'</strong></p>')+pricing.sections.filter(s=>s.optional||s.local).map(s=>'<p>'+htmlEscape(s.label)+' — excluded from total: optional '+priceMoney(s.optional,data.currency)+', pay locally '+priceMoney(s.local,data.currency)+'</p>').join('');
};
const priceQuoteForClient=data=>{
 if(data.pricingMode!=='automatic')return data;
 const pricing=calculateQuotePricing(data);
 if(pricing.errors.length)throw new Error(pricing.errors[0]);
 const result={...data,totalPrice:priceMoney(pricing.total,data.currency),perPerson:priceMoney(pricing.perPerson,data.currency)};
 for(const section of pricing.sections){
  const key=itemKeys[section.type];
  result[key]=(data[key]||[]).map((item,index)=>{
   const row=section.rows[index];
   if(!row.entered||row.treatment==='information')return item;
   const price=priceMoney(row.cents,data.currency)+' for the group';
   return {...item,price,clientSellingPrice:price,clientPriceTreatment:({included:'Included in holiday price',optional:'Optional extra — not included',local:'Pay locally — not included'})[row.treatment]};
  });
 }
 return result;
};
const renderSellingPrice=item=>item.clientSellingPrice?'<p class="quote-selling-price">'+htmlEscape(item.clientSellingPrice)+'<br>'+htmlEscape(item.clientPriceTreatment)+'</p>':'';

const getData = () => {
  const fields = Object.fromEntries([...form.querySelectorAll('[name]')].map(field => [field.name,field.value.trim()]));
  return {...fields, schemaVersion:3, enabledSections:Object.fromEntries([...document.querySelectorAll('[data-enable]')].map(el=>[el.dataset.enable,el.checked])), ...Object.fromEntries(Object.entries(itemKeys).map(([type,key])=>[key,readItems(type)]))};
};
const syncSections = () => {
 document.querySelectorAll('[data-section]').forEach(section=>{
  const enabled=document.querySelector('[data-enable="'+section.dataset.section+'"]').checked;
  section.hidden=!enabled;
  section.querySelectorAll('input,select,textarea,button').forEach(field=>{field.disabled=!enabled || Boolean(field.closest('[data-image-pending="true"]'));});
 });
 [...document.querySelectorAll('.builder-panel')].filter(panel=>!panel.hidden).forEach((panel,index)=>{panel.querySelector('.builder-panel__heading > span').textContent=String(index+1).padStart(2,'0');});
 refreshJourneySummary();
};
const applyPreset = () => {
 const presets={package:['flight','stay'],touring:['flight','stay','transfer','experience','day'],golf:['flight','stay','transfer','day','golf'],hotel:['stay'],custom:['stay','extra']};
 document.querySelectorAll('[data-enable]').forEach(el=>{el.checked=(presets[form.elements.quoteType.value]||[]).includes(el.dataset.enable);});
 syncSections();
};
form.elements.quoteType.addEventListener('change',applyPreset);
document.querySelectorAll('[data-enable]').forEach(el=>el.addEventListener('change',syncSections));
const validate = () => {
 refreshPricing();
 const pricing=calculateQuotePricing(getData());
 if(form.elements.pricingMode.value==="automatic" && pricing.errors.length){setStatus(pricing.errors[0],true);return false;}
 if (!imagesReady() || !form.reportValidity()) return false;
 for(const type of ['flight','stay','transfer','experience','day','golf','extra']) {
  if(document.querySelector('[data-enable="'+type+'"]').checked && !lists[type].children.length){setStatus('Add an entry to '+{"stay":"Hotels","day":"Day-to-day itinerary","flight":"Flights","transfer":"Transfers","experience":"Excursions & activities","golf":"Golf itinerary","extra":"Additional holiday information"}[type]+' or switch that section off.',true);return false;}
 }
 return true;
};

// Only allow ordinary web links, including links restored from older drafts.
const renderWebsiteLink = (item, type) => {
  const value = String(item.websiteUrl || '').trim();
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { return ''; }
  if (!['https:', 'http:'].includes(url.protocol)) return '';
  const labels = {stay:'Visit hotel website', golf:'Visit golf course website', flight:'View flight website', transfer:'View transfer website', experience:'View excursion website', day:'View itinerary information', extra:'View more information'};
  return '<a class="quote-website-link" href="'+attributeEscape(url.href)+'" target="_blank" rel="noopener noreferrer">'+htmlEscape(item.websiteLabel || labels[type] || 'View website')+'</a>';
};

const renderDays = (days) =>
  days
    .map(
      (item) => `<div class="quote-day">
        <div><span>Day ${htmlEscape(item.day)}</span><strong>${htmlEscape(formatDate(item.date))}</strong></div>
        <div><h3>${htmlEscape(item.title)}</h3><p>${htmlEscape(item.details)}</p>${renderWebsiteLink(item,"day")}${renderSellingPrice(item)}</div>
      </div>`,
    )
    .join("");

const renderStays = (stays) =>
  stays
    .map(
      (
        item,
      ) => `<div class="quote-stay${item.image ? "" : " quote-stay--text-only"}">
        ${item.image ? `<div class="quote-stay__image"><img src="${attributeEscape(item.image)}" alt="${attributeEscape(item.hotel)}" width="1400" height="900" loading="lazy"></div>` : ""}
        <div>
          <p class="eyebrow">${htmlEscape(item.nights)} nights · ${htmlEscape(item.location)}</p>
          <h3>${htmlEscape(item.hotel)}</h3>
          <p>${htmlEscape(item.description)}</p>${renderWebsiteLink(item,"stay")}${renderSellingPrice(item)}
          <dl class="quote-list">
            <div><dt>Room</dt><dd>${htmlEscape(item.room)}</dd></div>
            <div><dt>Board</dt><dd>${htmlEscape(item.board)}</dd></div>
            ${item.checkIn ? `<div><dt>Check-in</dt><dd>${htmlEscape(item.checkIn)}</dd></div>` : ""}
            ${item.checkOut ? `<div><dt>Check-out</dt><dd>${htmlEscape(item.checkOut)}</dd></div>` : ""}
            ${item.address ? `<div><dt>Address</dt><dd>${htmlEscape(item.address)}</dd></div>` : ""}
          </dl>
        </div>
      </div>`,
    )
    .join("");

const renderGolf = (rounds) =>
  rounds
    .map((item) => {
      const date = shortDate(item.date);
      return `<div class="golf-round">
        <div class="golf-round__date"><span>${date.day}</span>${date.month}</div>
        <div><h3>${htmlEscape(item.course)}</h3><p>${htmlEscape(item.courseDetails)}</p>${renderWebsiteLink(item,"golf")}${renderSellingPrice(item)}</div>
        <dl><div><dt>Tee time</dt><dd>${htmlEscape(item.teeTime)}</dd></div><div><dt>Included</dt><dd>${htmlEscape(item.included)}</dd></div></dl>
      </div>`;
    })
    .join("");

const loadQuoteAssets = async () => {
 const assets=JSON.parse(document.querySelector('#quote-assets').textContent);
 return {styleMarkup:'<style>'+assets.css+'\n'+document.querySelector('#package-styles').textContent+'</style>',logoMarkup:assets.logo.replace(/<\?xml[^>]*>\s*/i,'').replace('<svg ','<svg class="brand__mark" aria-hidden="true" focusable="false" ')};
};
const sectionEnabled=(data,type)=>type==='stay' && data.enabledSections?.stay===undefined ? true : data.enabledSections ? data.enabledSections[type]===true : type==='day'||type==='golf';
const packageSchemas={"flight":[["direction","Journey","text",["Outbound","Return","Connecting","Internal"]],["airline","Airline","text",null,true],["flightNumber","Flight number"],["from","Departure airport / terminal","text",null,true],["to","Arrival airport / terminal","text",null,true],["departureDate","Departure date","date"],["departureTime","Departure time (local)","time"],["arrivalDate","Arrival date","date"],["arrivalTime","Arrival time (local)","time"],["cabin","Cabin","text",["Economy","Premium economy","Business","First"]],["baggage","Baggage allowance"],["notes","Flight notes / connections","textarea"]],"transfer":[["purpose","Transfer type","text",["Airport arrival","Airport departure","Return airport transfer","Hotel to hotel","Station transfer","Port transfer","Excursion transfer","Other"]],["transport","Transport","text",["Private car","Private executive car","Private minivan","Shared shuttle","Coach","Train","Bullet train","Ferry / boat","Domestic flight","Car hire","Other"],true],["customTransport","Other transport / vehicle details"],["from","Pick-up location","text",null,true],["to","Drop-off location","text",null,true],["date","Date","date"],["time","Pick-up time (local)","time"],["duration","Estimated journey time"],["passengers","Passengers / luggage"],["priceStatus","Price treatment","text",["Included in holiday price","Optional extra — not included","Pay locally — not included"],true],["price","Extra price / currency / per person or vehicle"],["notes","Meeting point / return details / accessibility","textarea"]],"experience":[["title","Excursion / activity name","text",null,true],["category","Experience type","text",["Sightseeing tour","Cultural / heritage","Food / wine","Boat trip / cruise","Adventure / outdoors","Wildlife / nature","Theme park / attraction","Wellness / spa","Sport / water sports","Shopping","Other"],true],["customType","Other type / further detail"],["service","Service","text",["Private guided","Shared / group guided","Self-guided","Admission only"]],["location","Location"],["date","Date","date"],["time","Start time (local)","time"],["duration","Duration"],["priceStatus","Price treatment","text",["Included in holiday price","Optional extra — not included","Pay locally — not included"],true],["price","Extra price / currency / per person or group"],["included","What is included","textarea"],["notes","Description / pick-up / restrictions","textarea"]],"extra":[["title","Section heading","text",null,true],["details","Holiday information","textarea",null,true]]};
const renderPackageItems=(type,items)=>items.map(item=>'<article class="package-card"><h3>'+htmlEscape(item.title || (type==='flight' ? [item.direction,item.airline,item.flightNumber].filter(Boolean).join(' · ') : type==='transfer' ? [item.purpose,item.transport].filter(Boolean).join(' · ') : 'Holiday information'))+'</h3><dl>'+packageSchemas[type].filter(([key])=>item[key] && key!=='title' && !(key==='price' && item.clientSellingPrice)).map(([key,label,format])=>'<div><dt>'+htmlEscape(label)+'</dt><dd>'+htmlEscape(format==='date'?formatDate(item[key]):item[key])+'</dd></div>').join('')+'</dl>'+renderWebsiteLink(item,type)+renderSellingPrice(item)+'</article>').join('');
const renderSections=data=>{
 const sections=[];
 if(sectionEnabled(data,'flight')&&data.flights.length) sections.push(['Getting there','Flights',renderPackageItems('flight',data.flights)]);
 if(sectionEnabled(data,'stay')&&data.stays.length) sections.push(['Your stay','Hotels',renderStays(data.stays)]);
 if(sectionEnabled(data,'transfer')&&data.transfers.length) sections.push(['On the move','Transfers',renderPackageItems('transfer',data.transfers)]);
 if(sectionEnabled(data,'experience')&&data.experiences.length) sections.push(['Discover more','Excursions and itinerary',renderPackageItems('experience',data.experiences)]);
 if(sectionEnabled(data,'day')&&data.days.length) sections.push(['Day by day','Day-to-day itinerary',renderDays(data.days)]);
 if(sectionEnabled(data,'golf')&&(data.golf.length||data.golfNote)) sections.push(['Your rounds','Golf itinerary',renderGolf(data.golf)+(data.golfNote?'<p class="quote-note">'+htmlEscape(data.golfNote)+'</p>':'')]);
 if(sectionEnabled(data,'extra')&&data.extras.length) sections.push(['Made for you','Additional holiday information',renderPackageItems('extra',data.extras)]);
 const notes=[['exclusions','Not included'],['paymentTerms','Deposit and payment schedule'],['bookingTerms','Booking and cancellation conditions'],['travelNotes','Travel requirements and other notes']].filter(([key])=>data[key]).map(([key,label])=>'<article class="package-card"><h3>'+label+'</h3><p>'+htmlEscape(data[key])+'</p></article>').join('');
 if(notes) sections.push(['Before you book','Important information',notes]);
 return sections.map(([label,title,content],i)=>'<details class="quote-accordion"'+(i===0?' open':'')+'><summary><span class="quote-accordion__number">'+String(i+1).padStart(2,'0')+'</span><span><small>'+label+'</small>'+title+'</span><i aria-hidden="true"></i></summary><div class="quote-accordion__content">'+content+'</div></details>').join('');
};

const journeySummaryFacts = (data) => {
 const facts=[];
 const add=(label,value)=>{if(value) facts.push({label,value:String(value)});};
 const join=values=>[...new Set(values.filter(Boolean))].join(' · ');
 const items=key=>Array.isArray(data[key])?data[key]:[];
 const pricedSummary=(rows,describe)=>rows.map(item=>{
   const detail=describe(item);
   return [detail,item.priceStatus||'Price inclusion to be confirmed',item.price].filter(Boolean).join(' — ');
 }).join('\n');
 add('Destination',data.location);
 add('Arrival date',data.arrival?formatDate(data.arrival):'');
 add('Duration',data.nights?data.nights+' nights':'');
 add('Total guests',data.guests);
 if(sectionEnabled(data,'flight')) add('Flights',data.flightSummary||items('flights').map(item=>join([item.direction,item.airline,[item.from,item.to].filter(Boolean).join(' → ')])).filter(Boolean).join('\n')||'To be confirmed');
 if(sectionEnabled(data,'stay')){
   add('Hotels',data.hotel||join(items('stays').map(item=>item.hotel))||'To be confirmed');
   add('Rooms',data.room||join(items('stays').map(item=>item.room)));
   add('Board basis',data.board||join(items('stays').map(item=>item.board)));
 }
 if(sectionEnabled(data,'transfer')) add('Transfers',data.transferSummary||pricedSummary(items('transfers'),item=>join([item.transport,[item.from,item.to].filter(Boolean).join(' → ')]))||'To be confirmed');
 if(sectionEnabled(data,'experience')) add('Excursions and itinerary',data.experienceSummary||pricedSummary(items('experiences'),item=>item.title||item.category)||'To be confirmed');
 if(sectionEnabled(data,'day')) add('Day-to-day itinerary',data.daySummary||items('days').map(item=>[item.day?'Day '+item.day:'',item.title].filter(Boolean).join(': ')).filter(Boolean).join('\n')||'To be confirmed');
 if(sectionEnabled(data,'golf')) add('Golf courses',data.golfSummary||join(items('golf').map(item=>item.course))||'To be confirmed');
 if(sectionEnabled(data,'extra')) add('Additional holiday information',data.extraSummary||join(items('extras').map(item=>item.title))||'See full details below');
 return facts;
};
const renderJourneySummary=data=>journeySummaryFacts(data).map(({label,value})=>'<div class="quote-fact"><span>'+htmlEscape(label)+'</span><strong>'+htmlEscape(value)+'</strong></div>').join('');
const refreshJourneySummary=()=>{
 refreshPricing();
 const preview=document.querySelector('[data-summary-preview]');
 if(preview) {
  const data=getData();
  const ready=data.pricingMode==='automatic' && !calculateQuotePricing(data).errors.length;
  preview.innerHTML=renderJourneySummary(ready?priceQuoteForClient(data):data);
 }
};
form.addEventListener('input',refreshJourneySummary);
form.addEventListener('change',refreshJourneySummary);

const generateHtml = (data, assets) => {
  data = priceQuoteForClient(data);
  const inclusions = data.inclusions
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<li>${htmlEscape(item)}</li>`)
    .join("");
  const safeReference = htmlEscape(data.reference);
  const mailSubject = encodeURIComponent(`Proposal ${data.reference}`);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="Private travel proposal from Velvet Edge Travel">
  <title>${htmlEscape(data.title)} | Velvet Edge Travel</title>
  ${assets.styleMarkup}
</head>
<body class="quote-page">
  <header class="quote-header"><div class="container quote-header__inner">
    <div class="brand">${assets.logoMarkup}<span class="brand__name">Velvet Edge Travel</span></div>
    <div class="quote-header__ref"><span>Proposal reference</span><strong>${safeReference}</strong></div>
  </div></header>
  <main>
    <section class="quote-intro"><div class="container quote-intro__grid"><div><p class="eyebrow">Your private travel proposal</p><h1>${htmlEscape(data.title)}</h1><p class="quote-intro__copy">${htmlEscape(data.intro)}</p></div><div class="quote-intro__aside"><span>Prepared especially for</span><strong>${htmlEscape(data.clientName)}</strong><span>Prepared on</span><strong>${htmlEscape(formatDate(data.preparedDate))}</strong><span>Proposal valid until</span><strong>${htmlEscape(formatDate(data.validUntil))}</strong></div></div></section>
    <section class="quote-summary section--tight"><div class="container">
      <div class="quote-section-heading"><div><p class="eyebrow">At a glance</p><h2>Your journey</h2></div><button class="quote-print" type="button" data-print-quote>Print or save as PDF</button></div>
      <div class="quote-facts">${renderJourneySummary(data)}</div>
      <div class="quote-price"><div><span>Price per person</span><strong>${htmlEscape(data.perPerson)}</strong><small>Per person, based on the stated occupancy</small></div><div class="quote-price__total"><span>Total holiday price</span><strong>${htmlEscape(data.totalPrice)}</strong><small>Includes stated inclusions; excludes optional extras and local payments</small></div></div>
      ${data.pricingMode === "automatic" ? `<div class="quote-inclusions"><p class="eyebrow">Included section totals</p>${renderPricingTable(calculateQuotePricing(data), data.currency)}</div>` : ""}
      ${inclusions ? `<div class="quote-inclusions"><p class="eyebrow">Included in your proposal</p><ul>${inclusions}</ul></div>` : ""}
    </div></section>
    <section class="quote-details section"><div class="container"><div class="quote-section-heading"><div><p class="eyebrow">The complete proposal</p><h2>Explore every detail</h2></div><p>Select each section to view the full arrangements.</p></div>
      <div class="quote-accordions">
        ${renderSections(data)}
      </div>
    </div></section>
    <section class="quote-next"><div class="container quote-next__inner"><div><p class="eyebrow">Your next step</p><h2>Ready when you are</h2><p>Your arrangements remain subject to availability until confirmed. Contact your travel designer to reserve this journey or request a change.</p></div><div class="quote-next__actions"><a class="btn btn--gold" href="mailto:${attributeEscape(data.agentEmail)}?subject=Accept%20${mailSubject}">Accept this proposal</a><a class="btn btn--light" href="mailto:${attributeEscape(data.agentEmail)}?subject=Changes%20to%20${mailSubject}">Request a change</a></div></div></section>
  </main>
  <footer class="quote-footer"><div class="container"><div><strong>Velvet Edge Travel</strong><span>Exceptional travel, designed around you.</span></div><div><a href="tel:${attributeEscape(data.agentPhone.replace(/[^+\d]/g, ""))}">${htmlEscape(data.agentPhone)}</a><a href="mailto:${attributeEscape(data.agentEmail)}">${htmlEscape(data.agentEmail)}</a></div></div></footer>
  <script>document.querySelector("[data-print-quote]")?.addEventListener("click",()=>{document.querySelectorAll(".quote-accordion").forEach(section=>{section.open=true});window.print()});</script>
</body>
</html>`;
};

const download = (content, filename, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const updateExpectedLink = () => {
  const siteUrl = form.elements.siteUrl.value.trim().replace(/\/$/, "");
  const reference = slugify(form.elements.reference.value);
  const output = document.querySelector("[data-expected-link]");
  const copy = document.querySelector("[data-copy-link]");
  if (!siteUrl || !form.elements.reference.value.trim()) {
    output.textContent = "Enter your site address and reference";
    copy.disabled = true;
    return;
  }
  output.textContent = `${siteUrl}/quote-${reference}.html`;
  copy.disabled = false;
};

form.elements.siteUrl.addEventListener("input", updateExpectedLink);
form.elements.reference.addEventListener("input", updateExpectedLink);

document
  .querySelector("[data-copy-link]")
  .addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(
      document.querySelector("[data-expected-link]").textContent,
    );
    setStatus(
      "Client link copied. It will work after the generated file is uploaded.",
    );
    } catch { setStatus("Your browser could not copy the link. Select the expected client link above and copy it manually.", true); }
  });

document.querySelector("[data-preview]").addEventListener("click", async () => {
  if (!validate()) return;
  const data = getData();
  setStatus("Preparing preview...");
  try {
  const assets = await loadQuoteAssets(data);
  const url = URL.createObjectURL(
    new Blob([generateHtml(data, assets)], { type: "text/html" }),
  );
  window.open(url, "_blank", "noopener");
  setStatus("Preview opened in a new tab.");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch { setStatus("The preview could not be prepared. Check that you are using the matching quote template and builder files.", true); }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validate()) return;
  const data = getData();
  const filename = `quote-${slugify(data.reference)}.html`;
  setStatus("Building the complete styled quote...");
  try {
  const assets = await loadQuoteAssets(data);
  download(generateHtml(data, assets), filename, "text/html");
  setStatus(
    `${filename} downloaded. Upload it to GitHub to activate the client link.`,
  );
  } catch { setStatus("The quote could not be exported. Check that you are using the matching quote template and builder files.", true); }
});

document.querySelector("[data-save-draft]").addEventListener("click", () => {
  if (!imagesReady()) return;
  const data = getData();
  download(
    JSON.stringify(data, null, 2),
    `quote-${slugify(data.reference)}-draft.json`,
    "application/json",
  );
  setStatus("Editable draft downloaded.");
});

document
  .querySelector("[data-load-draft]")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if(!data || typeof data!=='object' || Array.isArray(data) || !('stays' in data || 'stay' in data)) throw new Error('Invalid draft');
      Object.entries(itemKeys).forEach(([type,key])=>{const items=data[key]||data[type]||[];if(!Array.isArray(items)||items.some(item=>!item||typeof item!=='object'||Object.values(item).some(value=>typeof value!=='string'&&typeof value!=='number')))throw new Error('Invalid entries');});
      form.reset();
      // Preserve older manually priced drafts until the agent opts into calculation.
      if(!data.pricingMode) form.elements.pricingMode.value='manual';
      form.querySelectorAll('[name]').forEach(field=>{if(typeof data[field.name]==='string') field.value=data[field.name];});
      if(!data.quoteType) form.elements.quoteType.value=data.golf?.length||data.golfSummary?'golf':'custom';
      document.querySelectorAll('[data-enable]').forEach(el=>{const type=el.dataset.enable;el.checked=type==='stay' && data.enabledSections?.stay===undefined ? true : data.enabledSections ? data.enabledSections[type]===true : Boolean((data[itemKeys[type]]||data[type]||[]).length || type==='golf'&&(data.golfNote||data.golfSummary));});
      Object.entries(itemKeys).forEach(([type,key])=>{lists[type].replaceChildren();(data[key]||data[type]||[]).forEach(item=>addItem(type,item));});
      syncSections();
      updateExpectedLink();
      setStatus("Editable draft loaded.");
    } catch {
      setStatus("This draft file could not be read.", true);
    }
    event.target.value = "";
  });

const today = new Date();
const validUntil = new Date(today);
validUntil.setDate(validUntil.getDate() + 14);
form.elements.preparedDate.value = today.toISOString().slice(0, 10);
form.elements.validUntil.value = validUntil.toISOString().slice(0, 10);
applyPreset();
addItem("stay");
updateExpectedLink();
