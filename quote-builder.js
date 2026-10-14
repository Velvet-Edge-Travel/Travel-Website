const form = document.querySelector("#quote-builder");
const status = document.querySelector("[data-builder-status]");
const lists = {
  advice: document.querySelector('[data-list="advice"]'),
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
const prepareImage = async (file, maxDimension = 1600) => {
  const supportedType = /^(?:image\/(?:jpeg|pjpeg|png|webp|gif|avif|bmp|x-ms-bmp))$/i.test(file.type);
  const supportedName = /\.(?:jpe?g|jfif|png|webp|gif|avif|bmp)$/i.test(file.name || "");
  if (!supportedType && !supportedName) {
    throw new Error("Please choose a JPG, PNG, WebP, GIF, AVIF or BMP image. Convert HEIC/HEIF photos to JPG first.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Please choose an image smaller than 20 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { throw new Error("This image could not be opened. Save or convert it to JPG or PNG, then try again."); }
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
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
  upload.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,.jpg,.jpeg,.jfif,.png,.webp,.gif,.avif,.bmp";
  const help = document.createElement("small");
  help.id = `${id}-help`;
  help.textContent = "JPG, PNG, WebP, GIF, AVIF or BMP, up to 20 MB. Photos are embedded in your quote; animated images use a still frame.";
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
  upload.addEventListener("click", () => { upload.value = ""; });
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
      }
    }
  });
  refresh();
};

let coverRevision=0;
const validCoverImage=value=>/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value||'');
const refreshCover=()=>{
 const show=form.elements.coverStyle.value==='photo';
 document.querySelector('[data-cover-upload]').hidden=!show;
 const preview=document.querySelector('[data-cover-preview]');
 preview.hidden=!validCoverImage(form.elements.coverImage.value);
 if(!preview.hidden)preview.src=form.elements.coverImage.value;else preview.removeAttribute('src');
 preview.style.objectPosition=form.elements.coverPosition.value||'center';
};
const setupCover=()=>{
 const upload=document.querySelector('#cover-file');
 const container=document.querySelector('[data-cover-controls]');
 const message=document.querySelector('[data-cover-status]');
 form.elements.coverStyle.addEventListener('change',refreshCover);
 form.elements.coverPosition.addEventListener('change',refreshCover);
 document.querySelector('[data-remove-cover]').addEventListener('click',()=>{
  coverRevision++;delete container.dataset.imagePending;upload.disabled=false;upload.value='';form.elements.coverImage.value='';form.elements.coverStyle.value='logo';message.textContent='';refreshCover();
 });
 upload.addEventListener('click',()=>{upload.value='';});
 upload.addEventListener('change',async()=>{
  const file=upload.files[0];if(!file)return;
  const revision=++coverRevision;container.dataset.imagePending='true';upload.disabled=true;message.textContent='Preparing cover image…';
  try{const value=await prepareImage(file,2400);if(revision!==coverRevision)return;form.elements.coverImage.value=value;message.textContent='Cover image embedded in your quote and draft.';refreshCover();}
  catch(error){if(revision===coverRevision)message.textContent=error.message||'The image could not be loaded.';}
  finally{if(revision===coverRevision){delete container.dataset.imagePending;upload.disabled=false;}}
 });
 refreshCover();
};
const renderCover=data=>{
 if(data.coverStyle==='photo'&&validCoverImage(data.coverImage)){
  const position=['top','bottom','center'].includes(data.coverPosition)?data.coverPosition:'center';
  return '<img class="quote-cover" src="'+attributeEscape(data.coverImage)+'" alt="" style="object-position:'+position+'">';
 }
 const logo=JSON.parse(document.querySelector('#quote-assets').textContent).logo;
 return '<img class="quote-cover quote-cover--logo" src="'+attributeEscape('data:image/svg+xml,'+encodeURIComponent(logo))+'" alt="">';
};

const imagesReady = () => {
  if (!form.querySelector('[data-image-pending="true"]')) return true;
  setStatus("Please wait for your image to finish preparing.", true);
  return false;
};

const parseFlightStops=value=>{
 if(!value)return [];
 try {
  const stops=JSON.parse(value);
  if(!Array.isArray(stops))return [];
  return stops.filter(stop=>stop&&typeof stop==='object'&&!Array.isArray(stop)).map(stop=>Object.fromEntries(Object.entries(stop).filter(([key,value])=>['kind','airport','arrivalDate','arrivalTime','departureDate','departureTime','duration','airline','flightNumber','terminal','notes'].includes(key)&&typeof value==='string')));
 }catch{return [];}
};
const setupFlightStops=item=>{
 const list=item.querySelector('[data-stop-list]');
 const field=item.querySelector('[data-key="flightStops"]');
 const save=()=>{
  const stops=[...list.children].map((stop,index)=>{
   stop.querySelector('[data-stop-heading]').textContent='Stop '+(index+1);
   return Object.fromEntries([...stop.querySelectorAll('[data-stop-key]')].map(input=>[input.dataset.stopKey,input.value.trim()]));
  });
  field.value=stops.length?JSON.stringify(stops):'';
 };
 const addStop=(values={})=>{
  const stop=document.querySelector('#flight-stop-template').content.firstElementChild.cloneNode(true);
  stop.querySelectorAll('[data-stop-key]').forEach(input=>{
   input.value=values[input.dataset.stopKey]??(input.dataset.stopKey==='kind'?'Transit / connection':'');
   input.id='flight-stop-'+(++imageControlId);
   input.parentElement.querySelector('label').htmlFor=input.id;
  });
  stop.querySelector('[data-remove-stop]').addEventListener('click',()=>{stop.remove();save();refreshJourneySummary();});
  list.append(stop);save();
 };
 const restored=parseFlightStops(field.value);
 restored.forEach(addStop);
 item.querySelector('[data-add-stop]').addEventListener('click',()=>{addStop();syncSections();});
 list.addEventListener('input',save);
 list.addEventListener('change',save);
};
const renderFlightStops=item=>{
 const stops=parseFlightStops(item.flightStops);
 if(!stops.length)return '';
 const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!Number.isNaN(Date.parse(value))?formatDate(value):value||'';
 return '<div><h4>Stops / transit</h4><ol class="quote-flight-stops">'+stops.map(stop=>{
  const details=[['Type',stop.kind],['Arrival (local)',[date(stop.arrivalDate),stop.arrivalTime].filter(Boolean).join(' · ')],['Onward departure (local)',[date(stop.departureDate),stop.departureTime].filter(Boolean).join(' · ')],['Stop duration',stop.duration],['Onward flight',[stop.airline,stop.flightNumber].filter(Boolean).join(' · ')],['Terminal / airport change',stop.terminal],['Notes',stop.notes]];
  return '<li><h4>'+htmlEscape(stop.airport)+'</h4><dl>'+details.filter(([,value])=>value).map(([label,value])=>'<div><dt>'+htmlEscape(label)+'</dt><dd>'+htmlEscape(value)+'</dd></div>').join('')+'</dl></li>';
 }).join('')+'</ol></div>';
};

const quoteOrderLabels={intro:'Introduction / cover',summary:'Journey summary, prices & inclusions',journey:'Individual journey items',flight:'Flights',stay:'Hotels',transfer:'Transfers',experience:'Excursions and itinerary',day:'Day-to-day itinerary',golf:'Golf itinerary',extra:'Additional holiday information',advice:'Travel planning & tips',notes:'Important information',next:'Next steps'};
const normaliseQuoteOrder=value=>{let order;try{order=JSON.parse(value||'[]');}catch{order=[];}if(!Array.isArray(order))order=[];if(!order.length)order=Object.keys(quoteOrderLabels);if(!order.includes('journey')){const i=order.findIndex(key=>['flight','stay','transfer','experience','day','golf','extra','advice'].includes(key));order.splice(i<0?2:i,0,'journey');}return [...new Set([...order,...Object.keys(quoteOrderLabels)])].filter(key=>Object.hasOwn(quoteOrderLabels,key));};
const moveInList=(node,delta)=>{const other=delta<0?node.previousElementSibling:node.nextElementSibling;if(!other)return;if(delta<0)node.parentElement.insertBefore(node,other);else node.parentElement.insertBefore(other,node);};
function refreshQuoteOrder(){const host=document.querySelector('[data-quote-order]');if(!host)return;const all=normaliseQuoteOrder(form.elements.quoteOrder.value);const journeyMode=form.elements.quoteLayout?.value==='journey';const order=all.filter(key=>journeyMode?!['flight','stay','transfer','experience','day','golf','extra','advice'].includes(key):key!=='journey');const omitted=all.filter(key=>!order.includes(key));form.elements.quoteOrder.value=JSON.stringify(all);host.replaceChildren();order.forEach((key,index)=>{const row=document.createElement('div');row.className='quote-order-row';row.dataset.orderKey=key;const text=document.createElement('span');text.textContent=quoteOrderLabels[key];row.append(text);for(const [label,delta] of [['Move up',-1],['Move down',1]]){const b=document.createElement('button');b.type='button';b.className='builder-secondary';b.textContent=label;b.disabled=delta<0?index===0:index===order.length-1;b.setAttribute('aria-label',label+' '+quoteOrderLabels[key]);b.onclick=()=>{[order[index],order[index+delta]]=[order[index+delta],order[index]];let cursor=0;form.elements.quoteOrder.value=JSON.stringify(all.map(key=>omitted.includes(key)?key:order[cursor++]));refreshQuoteOrder();document.querySelector('[data-order-key="'+key+'"] button:nth-of-type('+(delta<0?1:2)+')')?.focus();};row.append(b);}host.append(row);});}
function setupQuoteOrder(){const host=document.createElement('div');host.className='quote-order-editor';host.innerHTML='<h3>Order of the client quote</h3><p>Move any section up or down. Unselected or empty sections are skipped in the finished quote. Contact details remain at the end.</p><input type="hidden" name="quoteOrder"><div data-quote-order></div>';form.querySelector('.builder-panel').append(host);refreshQuoteOrder();}
function setupItemOrder(item){const tools=document.createElement('div');tools.className='entry-order';tools.innerHTML='<span>Entry order</span><button type="button" class="builder-secondary" data-entry-up>Move up</button><button type="button" class="builder-secondary" data-entry-down>Move down</button>';for(const [selector,delta] of [['[data-entry-up]',-1],['[data-entry-down]',1]])tools.querySelector(selector).onclick=()=>{if(form.elements.quoteLayout.value==='journey')moveJourneyEntry(item.querySelector('[data-key=entryId]').value,delta);else moveInList(item,delta);refreshJourneySummary();};item.prepend(tools);}
const parseGallery=value=>{try{const a=JSON.parse(value||'[]');return Array.isArray(a)?a.filter(x=>x&&typeof x.src==='string'&&(/^(?:https?:\/\/)/i.test(x.src)||validCoverImage(x.src))).map(x=>({src:x.src,caption:typeof x.caption==='string'?x.caption:''})):[];}catch{return [];}};
const renderGallery=item=>{const images=parseGallery(item.gallery);return images.length?'<div class="quote-gallery">'+images.map(img=>'<figure><img src="'+attributeEscape(img.src)+'" alt="'+attributeEscape(img.caption||'Holiday photograph')+'" loading="lazy">'+(img.caption?'<figcaption>'+htmlEscape(img.caption)+'</figcaption>':'')+'</figure>').join('')+'</div>':'';};
function setupGallery(item,values){const host=document.createElement('div');host.className='entry-gallery';host.innerHTML='<h4>Itinerary images</h4><p>Add one or several photos. You can reorder images, add captions, or remove them.</p><input type="hidden" data-key="gallery"><label>Upload itinerary images<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,.jpg,.jpeg,.jfif,.png,.webp,.gif,.avif,.bmp" data-gallery-upload></label><small>Up to 20 MB per photo. Images are resized and embedded; animated images use a still frame.</small><p role="status" data-gallery-status></p><div class="gallery-editor"></div>';
const field=host.querySelector('[data-key=gallery]'),upload=host.querySelector('[data-gallery-upload]'),message=host.querySelector('[data-gallery-status]'),grid=host.querySelector('.gallery-editor');let photos=parseGallery(values.gallery);const save=()=>{field.value=JSON.stringify(photos);};
const draw=()=>{save();grid.replaceChildren();photos.forEach((photo,index)=>{const row=document.createElement('div');row.className='gallery-photo';row.innerHTML='<img alt="Uploaded itinerary photo"><label>Caption<input type="text"></label><div class="entry-order"><button type="button" class="builder-secondary">Move up</button><button type="button" class="builder-secondary">Move down</button><button type="button" class="builder-secondary">Remove image</button></div>';row.querySelector('img').src=photo.src;const caption=row.querySelector('input');caption.value=photo.caption;caption.oninput=()=>{photo.caption=caption.value;save();};const buttons=row.querySelectorAll('button');buttons[0].disabled=index===0;buttons[1].disabled=index===photos.length-1;buttons[0].onclick=()=>{if(index===0)return;[photos[index-1],photos[index]]=[photos[index],photos[index-1]];draw();};buttons[1].onclick=()=>{if(index===photos.length-1)return;[photos[index+1],photos[index]]=[photos[index],photos[index+1]];draw();};buttons[2].onclick=()=>{photos.splice(index,1);draw();};grid.append(row);});};
upload.onclick=()=>{upload.value='';};upload.onchange=async()=>{const files=[...upload.files];if(!files.length)return;host.dataset.imagePending='true';upload.disabled=true;let added=0;const failures=[];try{for(const file of files){message.textContent='Preparing image '+(added+failures.length+1)+' of '+files.length+'…';try{const src=await prepareImage(file);if(!item.isConnected)return;photos.push({src,caption:''});added++;}catch(error){failures.push(file.name+': '+error.message);}}draw();message.textContent=added+' image(s) added.'+(failures.length?' '+failures.join(' '):'');}finally{delete host.dataset.imagePending;upload.disabled=false;syncSections();}};item.append(host);draw();}
function arrangeQuoteHtml(html,data){const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');const blocks={intro:main.querySelector('.quote-intro'),summary:main.querySelector('.quote-summary'),next:main.querySelector('.quote-next')};main.querySelectorAll('[data-quote-section]').forEach(el=>blocks[el.dataset.quoteSection]=el);const output=[];let group=null;let number=0;for(const key of normaliseQuoteOrder(data.quoteOrder)){const block=blocks[key];if(!block)continue;if(block.matches('details')){if(!group){const section=doc.createElement('section');section.className='quote-details section';section.innerHTML='<div class="container"><div class="quote-accordions"></div></div>';output.push(section);group=section.querySelector('.quote-accordions');}block.querySelector('.quote-accordion__number').textContent=String(++number).padStart(2,'0');block.open=number===1;group.append(block);}else{group=null;if(key==='journey')block.querySelectorAll('.quote-accordion').forEach(el=>{el.querySelector('.quote-accordion__number').textContent=String(++number).padStart(2,'0');el.open=number===1;});output.push(block);}}main.replaceChildren(...output);return '<!doctype html>\n'+doc.documentElement.outerHTML;}


const journeyTypes={flight:'Flight',transfer:'Transfer',stay:'Hotel',experience:'Excursion / activity',day:'Day itinerary',golf:'Golf',extra:'Holiday information',advice:'Travel tip / suggested journey'};
const sequenceIds=value=>{try{const a=JSON.parse(value||'[]');return Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'))]:[];}catch{return [];}};
function orderedJourneyItems(data){const rows=Object.entries(itemKeys).flatMap(([type,key])=>(data[key]||[]).map(item=>({type,item})));const map=new Map(rows.map(row=>[row.item.entryId,row]));const ids=sequenceIds(data.journeyOrder);return [...ids.map(id=>map.get(id)).filter(Boolean),...rows.filter(row=>!ids.includes(row.item.entryId))];}
const journeyTitle=(type,item)=>item.journeyHeading||item.title||item.hotel||item.course||[item.direction,item.airline,item.flightNumber].filter(Boolean).join(' · ')||[item.from,item.to].filter(Boolean).join(' → ')||journeyTypes[type];
function setupJourneyItem(item,values){const id=document.createElement('input');id.type='hidden';id.dataset.key='entryId';id.value=values.entryId||('entry-'+crypto.randomUUID());item.append(id);const heading=document.createElement('div');heading.className='builder-field';heading.innerHTML='<label>Journey heading (optional)</label><input type="text" data-key="journeyHeading" placeholder="e.g. Transfer to your Kyoto hotel">';heading.querySelector('input').value=values.journeyHeading||'';item.prepend(heading);}
function moveJourneyEntry(id,delta){const data=getData(),rows=orderedJourneyItems(data),index=rows.findIndex(row=>row.item.entryId===id);if(index<0||index+delta<0||index+delta>=rows.length)return;[rows[index],rows[index+delta]]=[rows[index+delta],rows[index]];form.elements.journeyOrder.value=JSON.stringify(rows.map(row=>row.item.entryId));refreshJourneySequence();}
function refreshJourneySequence(){const host=document.querySelector('[data-journey-sequence]');if(!host)return;const active=form.elements.quoteLayout.value==='journey';host.hidden=!active;document.querySelector('[data-journey-add]').hidden=!active;document.querySelectorAll('[data-order-key]').forEach(row=>{const key=row.dataset.orderKey;row.hidden=active?Object.hasOwn(journeyTypes,key):key==='journey';});const data=getData(),rows=orderedJourneyItems(data);form.elements.journeyOrder.value=JSON.stringify([...new Set([...sequenceIds(data.journeyOrder),...rows.map(row=>row.item.entryId)])]);host.replaceChildren();rows.forEach(({type,item},index)=>{const row=document.createElement('div');row.className='journey-order-row';row.dataset.journeyId=item.entryId;const title=document.createElement('span');title.textContent=(index+1)+'. '+journeyTypes[type]+' — '+journeyTitle(type,item)+(item.clientVisibility==='internal'?' (internal only)':'')+(!sectionEnabled(data,type)?' (section switched off)':'');row.append(title);for(const [label,delta] of [['Move up',-1],['Move down',1]]){const button=document.createElement('button');button.type='button';button.className='builder-secondary';button.textContent=label;button.disabled=index+delta<0||index+delta>=rows.length;button.onclick=()=>{moveJourneyEntry(item.entryId,delta);};row.append(button);}const position=document.createElement('select');position.setAttribute('aria-label','Position for '+journeyTitle(type,item));rows.forEach((_,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent='Position '+(i+1);position.append(option);});position.value=String(index);position.onchange=()=>{const reordered=rows.slice();reordered.splice(Number(position.value),0,reordered.splice(index,1)[0]);form.elements.journeyOrder.value=JSON.stringify(reordered.map(row=>row.item.entryId));refreshJourneySequence();};row.append(position);const edit=document.createElement('button');edit.type='button';edit.className='builder-secondary';edit.textContent='Edit item';edit.onclick=()=>{const card=[...document.querySelectorAll('[data-item]')].find(el=>el.querySelector('[data-key=entryId]')?.value===item.entryId);if(!sectionEnabled(getData(),type)){document.querySelector('[data-enable="'+type+'"]').checked=true;syncSections();}card.scrollIntoView({behavior:'smooth',block:'start'});card.querySelector('[data-key=journeyHeading]').focus({preventScroll:true});};row.append(edit);host.append(row);});if(!rows.length)host.textContent='Add an item to start building the journey.';}
function setupJourneySequence(){const host=document.createElement('div');host.className='quote-order-editor';host.innerHTML='<h3>Client journey sequence</h3><div class="builder-field"><label>Quote layout<select name="quoteLayout"><option value="journey">Journey sequence — mix individual items</option><option value="grouped">Group items by type</option></select></label></div><p>Arrange individual services in travel order, for example Flight → Transfer → Hotel → Transfer → Excursion. Use Edit item for details, costs and images.</p><input type="hidden" name="journeyOrder"><div class="entry-order" data-journey-add><label>Add to the journey<select data-journey-type></select></label><button type="button" class="builder-secondary" data-journey-add-button>Add item</button></div><div data-journey-sequence></div><div class="builder-field"><label>Grouped totals in the client summary<select name="showSectionTotals"><option value="show">Show included totals by type</option><option value="hide">Hide grouped totals</option></select></label><small>Uses automatic pricing and the existing price treatment. Private included costs still hide the breakdown. Optional extras and local payments stay outside included totals.</small></div>';form.querySelector('.builder-panel').append(host);const select=host.querySelector('[data-journey-type]');for(const [type,label] of Object.entries(journeyTypes)){const option=document.createElement('option');option.value=type;option.textContent=label;select.append(option);}host.querySelector('[data-journey-add-button]').onclick=()=>{const type=select.value;document.querySelector('[data-enable="'+type+'"]').checked=true;addItem(type);refreshJourneySequence();const card=lists[type].lastElementChild;card.scrollIntoView({behavior:'smooth',block:'start'});card.querySelector('[data-key=journeyHeading]').focus({preventScroll:true});};form.elements.quoteLayout.onchange=()=>{refreshQuoteOrder();refreshJourneySequence();};refreshJourneySequence();}
// Journey accordions already carry the item heading in their summary.
// Keep distinct service names as details when an agent supplies a custom heading.
function journeyContentWithoutHeading(content,type,item){
 const doc=new DOMParser().parseFromString(content,'text/html');
 const heading=doc.querySelector('h3');
 if(heading){
  const name=heading.textContent.trim();
  const same=name.toLocaleLowerCase()===journeyTitle(type,item).trim().toLocaleLowerCase();
  if(same||['flight','transfer'].includes(type))heading.remove();
  else{const detail=doc.createElement('p');detail.className='quote-item-name';detail.textContent=({stay:'Hotel',golf:'Course',experience:'Activity',day:'Itinerary',extra:'Information',advice:'Guidance'}[type]||'Service')+': '+name;heading.replaceWith(detail);}
 }
 return doc.body.innerHTML;
}
function renderJourneySections(data){const rows=orderedJourneyItems(data).filter(({type,item})=>sectionEnabled(data,type)&&item.clientVisibility!=='internal');const cards=rows.map(({type,item},index)=>{const content=type==='stay'?renderStays([item]):type==='day'?renderDays([item]):type==='golf'?renderGolf([item]):renderPackageItems(type,[item]);const advice=type==='advice'?'<p class="advice-note">Planning suggestion — not a confirmed booking.</p>':'';return '<details class="quote-accordion" data-journey-entry="'+attributeEscape(item.entryId||String(index))+'"><summary><span class="quote-accordion__number">'+String(index+1).padStart(2,'0')+'</span><span>'+((journeyTypes[type]||'').toLocaleLowerCase()===journeyTitle(type,item).trim().toLocaleLowerCase()?'':'<small>'+htmlEscape(journeyTypes[type])+'</small>')+htmlEscape(journeyTitle(type,item))+'</span><i aria-hidden="true"></i></summary><div class="quote-accordion__content">'+advice+journeyContentWithoutHeading(content,type,item)+'</div></details>';}).join('');return cards?'<section class="quote-details section" data-quote-section="journey"><div class="container"><div class="quote-section-heading"><div><p class="eyebrow">Your journey, step by step</p><h2>Your travel arrangements</h2></div></div><div class="quote-accordions">'+cards+'</div>'+(sectionEnabled(data,'golf')&&data.golfNote?'<p class="quote-note">'+htmlEscape(data.golfNote)+'</p>':'')+'</div></section>':'';}

const addItem = (type, values = {}) => {
  const template = document.querySelector(`#${type}-template`);
  const item = template.content.firstElementChild.cloneNode(true);
  if(values.clientSellingPrice){
    const recovered=document.createElement('div');recovered.className='builder-grid';recovered.dataset.recoveredPrice='true';
    recovered.innerHTML='<div class="builder-field"><label>Recovered client price (manual pricing)</label><input data-key="clientSellingPrice"></div><div class="builder-field"><label>Recovered price note</label><input data-key="clientPriceTreatment"></div>';
    item.append(recovered);
  }
  item.querySelectorAll("[data-key]").forEach((field) => {
    const defaults={clientVisibility:'client',costBasis:'group',costQuantity:'1',pricingTreatment:['day','extra','advice'].includes(type)?'information':'included'};
    field.value = values[field.dataset.key] ?? defaults[field.dataset.key] ?? "";
  });
  item
    .querySelector("[data-remove]")
    .addEventListener("click", () => {item.remove(); refreshJourneySummary();});
  setupJourneyItem(item,values);
  lists[type].append(item);
  setupItemOrder(item);
  setupGallery(item,values);
  if (type === "stay") setupImageUpload(item);
  if (type === "flight") setupFlightStops(item);
  item.querySelectorAll("[data-key]").forEach((field,index)=>{if(field.type==="hidden")return;if(!field.id) field.id = `entry-${++imageControlId}-${index}`; const label=[...field.parentElement.children].find(el=>el.tagName==="LABEL" && (!el.htmlFor || el.htmlFor===field.id)); if(label) label.htmlFor=field.id;});
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

const itemKeys = {day:"days", stay:"stays", golf:"golf", flight:"flights", transfer:"transfers", experience:"experiences", extra:"extras", advice:"advice"};
const pricingLabels={flight:'Flights',stay:'Hotels',transfer:'Transfers',experience:'Excursions and itinerary',day:'Day-to-day itinerary',golf:'Golf itinerary',extra:'Additional holiday information',advice:'Travel planning & tips'};
const priceTreatment=(item,type)=>{
 if(type==='transfer'||type==='experience') return ({'Included in holiday price':'included','Optional extra — not included':'optional','Pay locally — not included':'local'})[item.priceStatus] || 'unknown';
 return item.pricingTreatment || (['day','extra','advice'].includes(type)?'information':'included');
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
  return {...fields, schemaVersion:6, enabledSections:Object.fromEntries([...document.querySelectorAll('[data-enable]')].map(el=>[el.dataset.enable,el.checked])), ...Object.fromEntries(Object.entries(itemKeys).map(([type,key])=>[key,readItems(type)]))};
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
 syncItemVisibility();
 if(form.elements.coverStyle.value==='photo' && !validCoverImage(form.elements.coverImage.value)){setStatus("Upload a cover image or choose the Velvet Edge Travel logo background.",true);return false;}
 refreshPricing();
 const pricing=calculateQuotePricing(getData());
 if(form.elements.pricingMode.value==="automatic" && pricing.errors.length){setStatus(pricing.errors[0],true);return false;}
 if (!imagesReady() || !form.reportValidity()) return false;
 for(const type of ['flight','stay','transfer','experience','day','golf','extra','advice']) {
  if(document.querySelector('[data-enable="'+type+'"]').checked && !lists[type].children.length){setStatus('Add an entry to '+{"stay":"Hotels","day":"Day-to-day itinerary","flight":"Flights","transfer":"Transfers","experience":"Excursions & activities","golf":"Golf itinerary","extra":"Additional holiday information","advice":"Travel planning & tips"}[type]+' or switch that section off.',true);return false;}
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
        <div><h3>${htmlEscape(item.title)}</h3><p>${htmlEscape(item.details)}</p>${renderWebsiteLink(item,"day")}${renderSellingPrice(item)}${renderGallery(item)}</div>
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
          <p>${htmlEscape(item.description)}</p>${renderWebsiteLink(item,"stay")}${renderSellingPrice(item)}${renderGallery(item)}
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
        <div><h3>${htmlEscape(item.course)}</h3><p>${htmlEscape(item.courseDetails)}</p>${renderWebsiteLink(item,"golf")}${renderSellingPrice(item)}${renderGallery(item)}</div>
        <dl><div><dt>Tee time</dt><dd>${htmlEscape(item.teeTime)}</dd></div><div><dt>Included</dt><dd>${htmlEscape(item.included)}</dd></div></dl>
      </div>`;
    })
    .join("");

const loadQuoteAssets = async () => {
 const assets=JSON.parse(document.querySelector('#quote-assets').textContent);
 return {styleMarkup:'<style>'+assets.css+'\n'+document.querySelector('#package-styles').textContent+'</style>',logoMarkup:'<img class="brand__mark" src="'+attributeEscape('data:image/svg+xml,'+encodeURIComponent(assets.logo))+'" width="473" height="297" alt="">'};
};
const sectionEnabled=(data,type)=>type==='stay' && data.enabledSections?.stay===undefined ? true : data.enabledSections ? data.enabledSections[type]===true : type==='day'||type==='golf';
const packageSchemas={"flight":[["direction","Journey","text",["Outbound","Return","Connecting","Internal"]],["airline","Airline","text",null,true],["flightNumber","Flight number"],["from","Departure airport / terminal","text",null,true],["to","Arrival airport / terminal","text",null,true],["departureDate","Departure date","date"],["departureTime","Departure time (local)","time"],["arrivalDate","Arrival date","date"],["arrivalTime","Arrival time (local)","time"],["cabin","Cabin","text",["Economy","Premium economy","Business","First"]],["baggage","Baggage allowance"],["notes","Flight notes / connections","textarea"]],"transfer":[["purpose","Transfer type","text",["Airport arrival","Airport departure","Return airport transfer","Hotel to hotel","Station transfer","Port transfer","Excursion transfer","Other"]],["transport","Transport","text",["Private car","Private executive car","Private minivan","Shared shuttle","Coach","Train","Bullet train","Ferry / boat","Domestic flight","Car hire","Other"],true],["customTransport","Other transport / vehicle details"],["from","Pick-up location","text",null,true],["to","Drop-off location","text",null,true],["date","Date","date"],["time","Pick-up time (local)","time"],["duration","Estimated journey time"],["passengers","Passengers / luggage"],["priceStatus","Price treatment","text",["Included in holiday price","Optional extra — not included","Pay locally — not included"],true],["price","Extra price / currency / per person or vehicle"],["notes","Meeting point / return details / accessibility","textarea"]],"experience":[["title","Excursion / activity name","text",null,true],["category","Experience type","text",["Sightseeing tour","Cultural / heritage","Food / wine","Boat trip / cruise","Adventure / outdoors","Wildlife / nature","Theme park / attraction","Wellness / spa","Sport / water sports","Shopping","Other"],true],["customType","Other type / further detail"],["service","Service","text",["Private guided","Shared / group guided","Self-guided","Admission only"]],["location","Location"],["date","Date","date"],["time","Start time (local)","time"],["duration","Duration"],["priceStatus","Price treatment","text",["Included in holiday price","Optional extra — not included","Pay locally — not included"],true],["price","Extra price / currency / per person or group"],["included","What is included","textarea"],["notes","Description / pick-up / restrictions","textarea"]],"extra":[["title","Section heading","text",null,true],["details","Holiday information","textarea",null,true]]};
packageSchemas.advice=[["category","Type of guidance","text"],["title","Title","text"],["from","From / starting point","text"],["to","To / destination","text"],["transport","Suggested transport","text"],["duration","Estimated travel / activity time","text"],["when","Suggested day / time","text"],["details","Route, directions, practical advice or alternatives","textarea"],["budget","Indicative spend / booking advice (optional, not added to totals)","text"]];
const renderPackageItems=(type,items)=>items.map(item=>'<article class="package-card"><h3>'+htmlEscape(item.title || (type==='flight' ? [item.direction,item.airline,item.flightNumber].filter(Boolean).join(' · ') : type==='transfer' ? [item.purpose,item.transport].filter(Boolean).join(' · ') : 'Holiday information'))+'</h3><dl>'+packageSchemas[type].filter(([key])=>item[key] && key!=='title' && !(key==='price' && item.clientSellingPrice)).map(([key,label,format])=>'<div><dt>'+htmlEscape(label)+'</dt><dd>'+htmlEscape(format==='date'?formatDate(item[key]):item[key])+'</dd></div>').join('')+'</dl>'+(type==='flight'?renderFlightStops(item):'')+renderWebsiteLink(item,type)+renderSellingPrice(item)+renderGallery(item)+'</article>').join('');
const renderSections=data=>{
 const sections=[];
 if(sectionEnabled(data,'flight')&&data.flights.length) sections.push(['flight','Getting there','Flights',renderPackageItems('flight',data.flights)]);
 if(sectionEnabled(data,'stay')&&data.stays.length) sections.push(['stay','Your stay','Hotels',renderStays(data.stays)]);
 if(sectionEnabled(data,'transfer')&&data.transfers.length) sections.push(['transfer','On the move','Transfers',renderPackageItems('transfer',data.transfers)]);
 if(sectionEnabled(data,'experience')&&data.experiences.length) sections.push(['experience','Discover more','Excursions and itinerary',renderPackageItems('experience',data.experiences)]);
 if(sectionEnabled(data,'day')&&data.days.length) sections.push(['day','Day by day','Day-to-day itinerary',renderDays(data.days)]);
 if(sectionEnabled(data,'golf')&&(data.golf.length||data.golfNote)) sections.push(['golf','Your rounds','Golf itinerary',renderGolf(data.golf)+(data.golfNote?'<p class="quote-note">'+htmlEscape(data.golfNote)+'</p>':'')]);
 if(sectionEnabled(data,'extra')&&data.extras.length) sections.push(['extra','Made for you','Additional holiday information',renderPackageItems('extra',data.extras)]);
 if(sectionEnabled(data,'advice')&&data.advice?.length) sections.push(['advice','Velvet Edge Travel recommendations','Travel planning & tips','<p class="advice-note">Suggested routes, activities and practical guidance. These are planning suggestions, not confirmed bookings. Check current timings, availability and any stated costs before travelling.</p>'+renderPackageItems('advice',data.advice)]);
 const notes=[['exclusions','Not included'],['paymentTerms','Deposit and payment schedule'],['bookingTerms','Booking and cancellation conditions'],['travelNotes','Travel requirements and other notes']].filter(([key])=>data[key]).map(([key,label])=>'<article class="package-card"><h3>'+label+'</h3><p>'+htmlEscape(data[key])+'</p></article>').join('');
 if(notes) sections.push(['notes','Before you book','Important information',notes]);
 return (data.quoteLayout==='journey'?renderJourneySections(data):'')+sections.filter(([key])=>data.quoteLayout!=='journey'||key==='notes').map(([key,label,title,content],i)=>'<details data-quote-section="'+key+'" class="quote-accordion"'+(i===0?' open':'')+'><summary><span class="quote-accordion__number">'+String(i+1).padStart(2,'0')+'</span><span><small>'+label+'</small>'+title+'</span><i aria-hidden="true"></i></summary><div class="quote-accordion__content">'+content+'</div></details>').join('');
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
 if(sectionEnabled(data,'flight')) add('Flights',data.flightSummary||items('flights').map(item=>join([item.direction,item.airline,[item.from,...parseFlightStops(item.flightStops).map(stop=>stop.airport),item.to].filter(Boolean).join(' → ')])).filter(Boolean).join('\n')||'To be confirmed');
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
const hasPrivateIncludedCosts=data=>Object.entries(itemKeys).some(([type,key])=>sectionEnabled(data,type)&&(data[key]||[]).some(item=>['internal','details'].includes(item.clientVisibility)&&priceTreatment(item,type)==='included'));
const syncItemVisibility=()=>{
 document.querySelectorAll('[data-item]').forEach(item=>{
  const internal=item.querySelector('[data-key="clientVisibility"]')?.value==='internal';
  item.classList.toggle('is-internal',internal);
  item.querySelectorAll('input,select,textarea').forEach(field=>{
   if(field.dataset.originalRequired===undefined)field.dataset.originalRequired=String(field.required);
   // Internal costs need pricing fields, but not client-facing descriptive details.
   if(!field.closest('.entry-pricing')&&field.dataset.key!=='priceStatus')field.required=!internal&&field.dataset.originalRequired==='true';
  });
 });
};
const clientVisibleData=data=>{
 const result={...data,enabledSections:{...data.enabledSections}};
 const overrides={flight:['flightSummary'],stay:['hotel','room','board'],transfer:['transferSummary'],experience:['experienceSummary'],day:['daySummary'],golf:['golfSummary','golfNote'],extra:['extraSummary']};
 const privateCosts=hasPrivateIncludedCosts(data);
 for(const [type,key] of Object.entries(itemKeys)){
  const rows=data[key]||[];
  const hidden=rows.some(item=>item.clientVisibility==='internal');
  result[key]=rows.filter(item=>item.clientVisibility!=='internal').map(item=>{
   if(item.clientVisibility==='details'||privateCosts&&priceTreatment(item,type)==='included'){
    const visible={...item};delete visible.clientSellingPrice;delete visible.clientPriceTreatment;delete visible.price;if(item.clientVisibility==='details')delete visible.budget;return visible;
   }
   return item;
  });
  // Rebuild affected summaries only from visible entries; old overrides may mention hidden items.
  if(rows.some(item=>['internal','details'].includes(item.clientVisibility)))(overrides[type]||[]).forEach(name=>{result[name]='';});
  result.enabledSections[type]=sectionEnabled(data,type)&&(!hidden||result[key].length>0);
 }
 return result;
};

const renderJourneySummary=data=>journeySummaryFacts(data).map(({label,value})=>'<div class="quote-fact"><span>'+htmlEscape(label)+'</span><strong>'+htmlEscape(value)+'</strong></div>').join('');
const refreshJourneySummary=()=>{
 refreshJourneySequence();
 syncItemVisibility();
 refreshPricing();
 const preview=document.querySelector('[data-summary-preview]');
 if(preview) {
  const data=getData();
  const ready=data.pricingMode==='automatic' && !calculateQuotePricing(data).errors.length;
  preview.innerHTML=renderJourneySummary(clientVisibleData(ready?priceQuoteForClient(data):data));
 }
};
form.addEventListener('input',refreshJourneySummary);
form.addEventListener('change',refreshJourneySummary);

// Export only client-visible information, never internal pricing or disabled sections.
const quoteImportSnapshot=data=>{
 const names=['siteUrl','reference','clientName','preparedDate','validUntil','title','intro','location','arrival','nights','guests','hotel','room','board','perPerson','totalPrice','inclusions','golfSummary','golfNote','flightSummary','transferSummary','experienceSummary','daySummary','extraSummary','exclusions','paymentTerms','bookingTerms','travelNotes','agentEmail','agentPhone','quoteType','currency','payingTravellers','coverStyle','coverPosition','quoteOrder','quoteLayout','journeyOrder','showSectionTotals'];
 const result=Object.fromEntries(names.filter(key=>typeof data[key]==='string').map(key=>[key,data[key]]));
 result.format='velvet-edge-client-quote';result.schemaVersion=1;result.pricingMode='manual';result.enabledSections={...data.enabledSections};
 if(data.coverStyle==='photo')result.coverImage=data.coverImage;
 const pricingKeys=['baseCost','markupPercent','markupAmount','costBasis','costQuantity'];
 for(const [type,key] of Object.entries(itemKeys))result[key]=sectionEnabled(data,type)?(data[key]||[]).filter(item=>item.clientVisibility!=='internal').map(item=>Object.fromEntries(Object.entries(item).filter(([name])=>!pricingKeys.includes(name)))):[];
 result.journeyOrder=JSON.stringify(orderedJourneyItems(result).map(row=>row.item.entryId).filter(Boolean));
 return JSON.stringify(result).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
};
const importQuoteHtml=source=>{
 const doc=new DOMParser().parseFromString(source,'text/html');
 const embedded=doc.querySelector('#velvet-quote-data');
 if(embedded){const data=JSON.parse(embedded.textContent);if(data.format!=='velvet-edge-client-quote')throw new Error('Not a quote');return {...data,pricingMode:'manual'};}
 if(!doc.querySelector('.quote-intro h1')||!doc.querySelector('.quote-header__ref'))throw new Error('Not a Velvet Edge quote');
 const text=(selector,root=doc)=>root.querySelector(selector)?.textContent.trim()||'';
 const date=value=>{if(!value)return '';const parsed=new Date(value);return Number.isNaN(parsed.getTime())?'':parsed.toISOString().slice(0,10);};
 const pairs=root=>Object.fromEntries([...root.querySelectorAll('dl > div')].map(el=>[text('dt',el),text('dd',el)]));
 const link=root=>{const a=root.querySelector('a.quote-website-link');return a?{websiteUrl:a.getAttribute('href')||'',websiteLabel:a.textContent.trim()}:{};};
 const data={pricingMode:'manual',quoteType:'custom',title:text('.quote-intro h1'),intro:text('.quote-intro__copy'),reference:text('.quote-header__ref strong'),stays:[],days:[],golf:[],flights:[],transfers:[],experiences:[],extras:[],advice:[],enabledSections:{}};
 const aside=[...doc.querySelectorAll('.quote-intro__aside strong')].map(el=>el.textContent.trim());
 [data.clientName,data.preparedDate,data.validUntil]=[aside[0]||'',date(aside[1]),date(aside[2])];
 const facts=Object.fromEntries([...doc.querySelectorAll('.quote-fact')].map(el=>[text('span',el),text('strong',el)]));
 Object.assign(data,{hotel:facts.Hotels||facts.Hotel||'',room:facts.Rooms||facts.Room||'',location:facts.Destination||text('.quote-fact--wide small'),arrival:date(facts['Arrival date']),nights:(facts.Duration||'').match(/\d+/)?.[0]||'',board:facts['Board basis']||'',guests:facts['Total guests']||'',golfSummary:facts['Golf courses']||'',perPerson:text('.quote-price > div:first-child strong'),totalPrice:text('.quote-price__total strong'),inclusions:[...doc.querySelectorAll('.quote-inclusions li')].map(el=>el.textContent.trim()).join('\n'),agentEmail:text('.quote-footer a[href^="mailto:"]'),agentPhone:text('.quote-footer a[href^="tel:"]')});
 const cover=doc.querySelector('img.quote-cover:not(.quote-cover--logo)');
 if(cover&&validCoverImage(cover.getAttribute('src'))){data.coverStyle='photo';data.coverImage=cover.getAttribute('src');data.coverPosition=['top','bottom'].includes(cover.style.objectPosition)?cover.style.objectPosition:'center';}
 const scalarNotes={'Not included':'exclusions','Deposit and payment schedule':'paymentTerms','Booking and cancellation conditions':'bookingTerms','Travel requirements and other notes':'travelNotes'};
 for(const section of doc.querySelectorAll('.quote-accordion')){
  const heading=text('summary',section).toLowerCase();
  if(section.querySelector('.quote-stay'))data.stays=[...section.querySelectorAll('.quote-stay')].map(el=>{const p=pairs(el);const eyebrow=text('.eyebrow',el);return {hotel:text('h3',el),location:eyebrow.split('·').slice(1).join('·').trim(),nights:eyebrow.match(/\d+/)?.[0]||'',description:text('h3 + p',el),room:p.Room||'',board:p.Board||'',checkIn:p['Check-in']||'',checkOut:p['Check-out']||'',address:p.Address||'',image:el.querySelector('img')?.getAttribute('src')||'',...link(el)};});
  if(section.querySelector('.quote-day'))data.days=[...section.querySelectorAll('.quote-day')].map(el=>({day:text('span',el).replace(/^Day\s*/i,''),date:date(text('strong',el)),title:text('h3',el),details:text('h3 + p',el),...link(el)}));
  if(section.querySelector('.golf-round')){data.golf=[...section.querySelectorAll('.golf-round')].map(el=>{const p=pairs(el);return {date:'',course:text('h3',el),courseDetails:text('h3 + p',el),teeTime:p['Tee time']||'',included:p.Included||'',...link(el)};});data.golfNote=text('.quote-note',section);}
  let type=heading.includes('travel planning')?'advice':heading.includes('flight')?'flight':heading.includes('transfer')?'transfer':heading.includes('excursion')?'experience':heading.includes('additional holiday')?'extra':null;
  for(const card of section.querySelectorAll('.package-card')){
   if(!type){const key=scalarNotes[text('h3',card)];if(key)data[key]=text('p',card);continue;}
   const values=pairs(card);const item={...link(card)};
   for(const [key,label,format] of packageSchemas[type])if(values[label])item[key]=format==='date'?date(values[label]):values[label];
   if(['experience','extra','advice'].includes(type))item.title=text('h3',card);
   if(type==='flight'){
    const stops=[...card.querySelectorAll('.quote-flight-stops li')].map(el=>{const p=pairs(el);return {airport:text('h4',el),kind:p.Type||'',duration:p['Stop duration']||'',notes:[p['Arrival (local)']?'Arrival: '+p['Arrival (local)']:'',p['Onward departure (local)']?'Departure: '+p['Onward departure (local)']:'',p['Onward flight']?'Onward flight: '+p['Onward flight']:'',p.Notes||''].filter(Boolean).join('\n'),terminal:p['Terminal / airport change']||''};});
    if(stops.length)item.flightStops=JSON.stringify(stops);
   }
   data[itemKeys[type]].push(item);
  }
 }
 for(const [type,key] of Object.entries(itemKeys))data.enabledSections[type]=data[key].length>0;
 return data;
};

const generateHtml = (data, assets) => {
  const originalData = data;
  data = clientVisibleData(priceQuoteForClient(data));
  const inclusions = data.inclusions
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<li>${htmlEscape(item)}</li>`)
    .join("");
  const safeReference = htmlEscape(data.reference);
  const mailSubject = encodeURIComponent(`Proposal ${data.reference}`);

  const output = `<!doctype html>
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
    <section class="quote-intro">${renderCover(data)}<div class="container quote-intro__grid"><div><p class="eyebrow">Your private travel proposal</p><h1>${htmlEscape(data.title)}</h1><p class="quote-intro__copy">${htmlEscape(data.intro)}</p></div><div class="quote-intro__aside"><span>Prepared especially for</span><strong>${htmlEscape(data.clientName)}</strong><span>Prepared on</span><strong>${htmlEscape(formatDate(data.preparedDate))}</strong><span>Proposal valid until</span><strong>${htmlEscape(formatDate(data.validUntil))}</strong></div></div></section>
    <section class="quote-summary section--tight"><div class="container">
      <div class="quote-section-heading"><div><p class="eyebrow">At a glance</p><h2>Your journey</h2></div><button class="quote-print" type="button" data-print-quote>Print or save as PDF</button></div>
      <div class="quote-facts">${renderJourneySummary(data)}</div>
      <div class="quote-price"><div><span>Price per person</span><strong>${htmlEscape(data.perPerson)}</strong><small>Per person, based on the stated occupancy</small></div><div class="quote-price__total"><span>Total holiday price</span><strong>${htmlEscape(data.totalPrice)}</strong><small>Includes stated inclusions; excludes optional extras and local payments</small></div></div>
      ${data.pricingMode === "automatic" && data.showSectionTotals !== "hide" && !hasPrivateIncludedCosts(originalData) ? `<div class="quote-inclusions"><p class="eyebrow">Included section totals</p>${renderPricingTable(calculateQuotePricing(originalData), data.currency)}</div>` : ""}
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
  <script type="application/json" id="velvet-quote-data">${quoteImportSnapshot(data)}</script>
  <script>document.querySelector("[data-print-quote]")?.addEventListener("click",()=>{document.querySelectorAll(".quote-accordion").forEach(section=>{section.open=true});window.print()});</script>
</body>
</html>`;
  return arrangeQuoteHtml(output,data);
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
    if (!imagesReady()) { event.target.value = ""; return; }
    try {
      const source=await file.text();
      const isHtml=/^\s*</.test(source);
      const data=isHtml?importQuoteHtml(source):JSON.parse(source);
      if(!data || typeof data!=='object' || Array.isArray(data) || !('stays' in data || 'stay' in data)) throw new Error('Invalid draft');
      Object.entries(itemKeys).forEach(([type,key])=>{const items=data[key]||data[type]||[];if(!Array.isArray(items)||items.some(item=>!item||typeof item!=='object'||Object.values(item).some(value=>typeof value!=='string'&&typeof value!=='number')))throw new Error('Invalid entries');});
      coverRevision++;
      form.reset();
      if(!data.quoteLayout)form.elements.quoteLayout.value='grouped';
      // Preserve older manually priced drafts until the agent opts into calculation.
      if(!data.pricingMode) form.elements.pricingMode.value='manual';
      form.querySelectorAll('[name]').forEach(field=>{if(typeof data[field.name]==='string') field.value=data[field.name];});
      if(!data.quoteType) form.elements.quoteType.value=data.golf?.length||data.golfSummary?'golf':'custom';
      document.querySelectorAll('[data-enable]').forEach(el=>{const type=el.dataset.enable;el.checked=type==='stay' && data.enabledSections?.stay===undefined ? true : data.enabledSections ? data.enabledSections[type]===true : Boolean((data[itemKeys[type]]||data[type]||[]).length || type==='golf'&&(data.golfNote||data.golfSummary));});
      Object.entries(itemKeys).forEach(([type,key])=>{lists[type].replaceChildren();(data[key]||data[type]||[]).forEach(item=>addItem(type,item));});
      syncSections();
      refreshCover();
      refreshQuoteOrder();
      refreshJourneySequence();
      updateExpectedLink();
      setStatus(isHtml?"HTML quote loaded in manual pricing mode. Review all entries and dates before exporting. Internal items, original costs and markups cannot be recovered from client HTML.":"Editable draft loaded.");
    } catch {
      setStatus("This draft file could not be read. Choose an editable JSON draft or a Velvet Edge client quote HTML file.", true);
    }
    event.target.value = "";
  });

const today = new Date();
const validUntil = new Date(today);
validUntil.setDate(validUntil.getDate() + 14);
form.elements.preparedDate.value = today.toISOString().slice(0, 10);
form.elements.validUntil.value = validUntil.toISOString().slice(0, 10);
setupCover();
setupQuoteOrder();
setupJourneySequence();
refreshQuoteOrder();
applyPreset();
addItem("stay");
updateExpectedLink();
