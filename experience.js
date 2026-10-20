/* Client experience. Personal enquiry data is not stored in browser storage. */
(() => {
  "use strict";
  const trips = window.VELVET_HOLIDAYS || [];
  const config = window.VELVET_CONFIG || {};
  const params = new URLSearchParams(location.search);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const key = "velvet-saved-journeys-v1";
  let saved = [];
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); saved = Array.isArray(value) ? value.filter(id => trips.some(t => t.id === id)) : []; } catch {}
  const toast = document.createElement("div");
  toast.className = "experience-toast"; toast.setAttribute("role", "status"); document.body.append(toast);
  let timer;
  function announce(text) { toast.textContent = text; toast.classList.add("show"); clearTimeout(timer); timer = setTimeout(() => toast.classList.remove("show"), 4000); }
  function updateSaved() {
    document.querySelectorAll("[data-saved-count]").forEach(el => el.textContent = saved.length);
    document.querySelectorAll("[data-save-journey]").forEach(el => {
      const yes = saved.includes(el.dataset.saveJourney);
      el.setAttribute("aria-pressed", String(yes)); el.textContent = yes ? "♥ Saved" : "♡ Save journey";
      el.setAttribute("aria-label", `${yes ? "Remove" : "Save"} ${trips.find(t => t.id === el.dataset.saveJourney)?.title || "journey"}${yes ? " from saved journeys" : ""}`);
    });
  }
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-save-journey]");
    if (!button) return;
    const id = button.dataset.saveJourney;
    saved = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
    let persisted = true;
    try { localStorage.setItem(key, JSON.stringify(saved)); } catch { persisted = false; }
    updateSaved();
    if (filterForm) renderCollection();
    announce(persisted ? (saved.includes(id) ? "Journey saved on this device." : "Journey removed from your saved list.") : "Saved for this page only. Browser storage is unavailable.");
  });
  function card(t) {
    return `<article class="holiday-card"><div class="holiday-card__image"><a href="holiday.html?id=${t.id}" tabindex="-1" aria-hidden="true"><img src="${escape(t.image)}" alt="" loading="lazy" width="640" height="480"></a><button class="save-journey" type="button" data-save-journey="${t.id}">♡ Save journey</button><span class="holiday-category">${escape(t.style)}</span></div><div class="holiday-card__body"><p class="eyebrow">${escape(t.destination)} · ${t.nights} nights</p><h3><a href="holiday.html?id=${t.id}">${escape(t.title)}</a></h3><p>${escape(t.description)}</p><div class="holiday-card__bottom"><div><small>Made around you</small><strong>Tailored quotation</strong></div><a class="text-link" href="holiday.html?id=${t.id}" aria-label="Explore ${escape(t.title)}">Explore</a></div></div></article>`;
  }
  const filterForm = document.querySelector("[data-holiday-filters]");
  function renderCollection() {
    const data = new FormData(filterForm), q = (data.get("q") || "").trim().toLowerCase();
    let found = trips.filter(t => (!q || `${t.title} ${t.destination} ${t.region} ${t.style} ${t.description}`.toLowerCase().includes(q)) &&
      (!data.get("region") || t.region === data.get("region")) && (!data.get("style") || t.style === data.get("style")) &&
      (!data.has("saved") || saved.includes(t.id)) &&
      (!data.get("duration") || (data.get("duration") === "short" ? t.nights <= 7 : data.get("duration") === "medium" ? t.nights >= 8 && t.nights <= 14 : t.nights >= 15)));
    if (data.get("sort") === "duration") found.sort((a,b) => a.nights - b.nights);
    document.querySelector("[data-results-status]").textContent = `${found.length} ${found.length === 1 ? "journey" : "journeys"}${data.has("saved") ? " in your saved collection" : " to explore"}`;
    document.querySelector("[data-holiday-grid]").innerHTML = found.length ? found.map(card).join("") :
      `<div class="empty-collection"><h3>${data.has("saved") ? "Your next adventure is waiting." : "Let's make something just for you."}</h3><p>${data.has("saved") ? "Save a journey with the heart button to keep your favourite ideas together on this device." : "We don't have a listed journey matching these filters. Broaden your search or tell us what you have in mind."}</p><button type="button" class="btn btn--dark" data-clear-filters>See all journeys</button> <a class="text-link" href="contact.html?destination=${encodeURIComponent(data.get("region") || data.get("q") || "")}">Ask about a bespoke holiday</a></div>`;
    const url = new URL(location.href); url.search = "";
    for (const [k,v] of data) if (v && !(k === "sort" && v === "recommended")) url.searchParams.set(k, k === "saved" ? "1" : v);
    history.replaceState(null, "", url); updateSaved();
  }
  if (filterForm) {
    for (const name of ["q","region","style","duration","sort"]) if (params.has(name)) filterForm.elements[name].value = params.get(name);
    filterForm.elements.saved.checked = params.get("saved") === "1";
    filterForm.addEventListener("input", renderCollection);
    filterForm.addEventListener("submit", e => {e.preventDefault(); renderCollection();});
    filterForm.addEventListener("reset", () => setTimeout(renderCollection, 0));
    document.addEventListener("click", e => { if (e.target.closest("[data-clear-filters]")) filterForm.reset(); });
    renderCollection();
  }
  const detail = document.querySelector("[data-holiday-detail]");
  if (detail) {
    const t = trips.find(t => t.id === params.get("id"));
    if (!t) detail.innerHTML = `<section class="section detail-loading"><div class="container"><p class="eyebrow">Let's find your journey</p><h1>Another adventure awaits.</h1><p>This journey could not be found. Browse our collection to choose your next escape.</p><a class="btn btn--dark" href="holidays.html">Explore all holidays</a></div></section>`;
    else {
      document.title = `${t.title} | Velvet Edge Travel`;
      detail.innerHTML = `<section class="hero page-hero journey-hero" style="--hero:url('${escape(t.image)}')"><div class="hero__content container"><a class="breadcrumb" href="holidays.html">← Back to the collection</a><p class="eyebrow">${escape(t.destination)} · ${escape(t.style)}</p><h1>${escape(t.title)}</h1><p class="hero__copy">${escape(t.description)}</p></div></section>
      <section class="section"><div class="container journey-layout"><div><p class="eyebrow">A starting point, made personal</p><h2>Your journey. Your rhythm.</h2><p class="lead">${escape(t.description)}</p><div class="journey-facts"><div><span>Suggested duration</span><strong>${t.nights} nights</strong></div><div><span>Travel style</span><strong>${escape(t.style)}</strong></div><div><span>When to go</span><strong>${escape(t.season)}</strong></div></div>
      ${t.highlights ? `<h3>Collection highlights</h3><ul>${t.highlights.map(x=>`<li>${escape(x)}</li>`).join("")}</ul>` : ""}
      <h3>Make it your own</h3><p>Tell us your preferred dates, who is travelling and the experiences that matter to you. Ask about extending your stay, changing the pace or combining this journey with somewhere else.</p>
      <details class="journey-question" open><summary>What will my quotation include?</summary><p>Your personal proposal should confirm the accommodation, travel arrangements, experiences, inclusions, exclusions, availability and total price for your dates. The collection description is inspiration, not a confirmed itinerary.</p></details>
      <details class="journey-question"><summary>Can I travel on different dates?</summary><p>Yes, you can request your preferred dates in the enquiry. Availability and seasonal arrangements will be checked before a quotation is confirmed.</p></details>
      <details class="journey-question"><summary>Is this a booking?</summary><p>No. Sending an enquiry does not reserve accommodation, flights or tee times, and no payment is taken on this website.</p></details></div>
      <aside class="journey-enquire"><p class="eyebrow">Begin the conversation</p><span>Created exclusively for you</span><p class="journey-price">Your tailored quote</p><p>Share your preferred dates, travelling party and ideas. We will prepare a personalised quotation around your requirements.</p><a class="btn btn--dark" href="contact.html?holiday=${t.id}#enquiry">Enquire about this journey</a><button type="button" class="quiet-button" data-save-journey="${t.id}">♡ Save journey</button><p class="form__note">Personal advice. No online payment or reservation.</p></aside></div></section><section class="section section--sand"><div class="container"><div class="section-heading"><div><p class="eyebrow">Keep dreaming</p><h2>You might also love</h2></div><a class="text-link" href="holidays.html">See the collection</a></div><div class="holiday-grid">${trips.filter(x=>x.id !== t.id).sort((a,b)=>Number(b.region === t.region)-Number(a.region === t.region)).slice(0,3).map(card).join("")}</div></div></section>`;
    }
  }
  const form = document.querySelector("[data-enquiry-form]");
  if (form) {
    form.id = "enquiry"; form.noValidate = true;
    const steps = [...form.querySelectorAll("[data-form-step]")];
    const back = form.querySelector("[data-step-back]"), next = form.querySelector("[data-step-next]"), send = form.querySelector("[data-send-enquiry]");
    const download = form.querySelector("[data-download-enquiry]"), status = form.querySelector(".form-status");
    let step = 0, sending = false;
    const endpoint = /^https:\/\//.test(config.enquiryEndpoint || "") ? config.enquiryEndpoint : "";
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.enquiryEmail || "") ? config.enquiryEmail : "";
    send.textContent = endpoint ? "Send enquiry" : email ? "Open email to send" : "Download enquiry";
    form.querySelector("[data-delivery-note]").textContent = endpoint ? "Your enquiry is sent securely to our enquiry service when you select Send enquiry." : email ? `Your email app will open with your enquiry addressed to ${email}. Please press Send there to deliver it. You can also download your brief.` : "You can prepare and download your enquiry. Online delivery is not connected yet.";
    const selected = trips.find(t => t.id === params.get("holiday"));
    if (selected) {
      form.elements.holiday.value = selected.title; form.elements.destination.value = selected.destination;
      form.elements.travelType.value = selected.type;
      const box = form.querySelector("[data-selected-journey]"); box.hidden = false;
      box.innerHTML = `<span class="eyebrow">Your selected journey</span><h3>${escape(selected.title)}</h3><p>${escape(selected.destination)} · ${selected.nights} suggested nights</p><a href="holiday.html?id=${selected.id}" class="text-link">View journey</a>`;
    } else {
      if (params.get("type") === "golf") form.elements.travelType.value = "golf";
      form.elements.destination.value = (params.get("destination") || "").slice(0,200);
    }
    function golf() {
      const active = form.elements.travelType.value === "golf";
      const fields = form.querySelector("[data-golf-fields]"); fields.hidden = !active;
      fields.closest("details").hidden = !active;
      fields.querySelectorAll("input,select,textarea").forEach(el => el.disabled = !active);
    }
    form.elements.travelType.addEventListener("change", golf); golf();
    const labels = {};
    form.querySelectorAll("label[for]").forEach(label => { const input = form.querySelector(`#${label.htmlFor}`); if (input?.name) labels[input.name] = label.textContent.replace(/\s*\*\s*$/, "").trim(); });
    function entries() {
      return [...new FormData(form)].filter(([k,v])=>String(v).trim() && k !== "permissionToReply").map(([k,v]) => {
        const field = form.elements.namedItem(k);
        return [k, field?.tagName === "SELECT" ? field.selectedOptions[0]?.textContent || v : v];
      });
    }
    function brief() { return "VELVET EDGE TRAVEL — HOLIDAY ENQUIRY\n\n" + entries().map(([k,v])=>`${labels[k] || (k === "holiday" ? "Selected journey" : k)}: ${v}`).join("\n\n") + "\n\nPlease contact me about this enquiry. This is not a booking."; }
    function review() {
      form.querySelector("[data-enquiry-review]").innerHTML = `<dl class="enquiry-review">${entries().map(([k,v])=>`<div><dt>${escape(labels[k] || (k === "holiday" ? "Selected journey" : k))}</dt><dd>${escape(v)}</dd></div>`).join("")}</dl>`;
    }
    function showStep(focus = true) {
      steps.forEach((el,i) => el.hidden = i !== step);
      form.querySelectorAll("[data-step-label]").forEach((el,i) => { if(i===step) el.setAttribute("aria-current","step"); else el.removeAttribute("aria-current"); });
      back.hidden = step === 0; next.hidden = step === 2; send.hidden = step !== 2; download.hidden = step !== 2;
      status.classList.remove("visible"); if(step===2) review();
      if(focus) { const heading = steps[step].querySelector("h3"); heading.tabIndex=-1; heading.focus(); }
    }
    function validate() {
      form.elements.phone.required = form.elements.contactMethod.value === "Telephone";
      for(const input of steps[step].querySelectorAll("input,select,textarea")) if(!input.disabled && !input.checkValidity()) { input.reportValidity(); return false; }
      return true;
    }
    next.addEventListener("click", () => { if(validate()) {step++;showStep();} });
    back.addEventListener("click", () => {step--;showStep();});
    function saveBrief() {
      const url = URL.createObjectURL(new Blob([brief()],{type:"text/plain;charset=utf-8"}));
      const a = document.createElement("a");a.href=url;a.download="Velvet-Edge-holiday-enquiry.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    download.addEventListener("click",saveBrief);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if(sending) return;
      if(step<2) {if(validate()){step++;showStep();}return;}
      if(!validate()) return;
      status.classList.add("visible");
      if(!endpoint) {
        if(email) {
          const href=`mailto:${email}?subject=${encodeURIComponent("Holiday enquiry"+(selected ? " — "+selected.title : ""))}&body=${encodeURIComponent(brief())}`;
          if(href.length>7000) { saveBrief(); location.href=`mailto:${email}?subject=Holiday%20enquiry`; status.textContent="Your detailed brief has downloaded. Attach it to an email to "+email+" and press Send. Nothing has been sent by this website."; }
          else { location.href=href;status.textContent="Your email app has been requested. Press Send there to deliver your enquiry. If no app opens, download your brief and email it to "+email+". Nothing has been sent by this website."; }
        } else {saveBrief();status.textContent="Your enquiry has downloaded. It has not been sent.";}
        status.focus();return;
      }
      sending=true;send.disabled=true;send.textContent="Sending…";
      const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),20000);
      try {
        const result=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({...Object.fromEntries(new FormData(form)),subject:"Velvet Edge holiday enquiry"}),signal:controller.signal});
        if(!result.ok) throw Error("Delivery failed");
        status.textContent="Thank you. Your enquiry has been submitted successfully. Keep a copy of your brief using the download button.";
        send.textContent="Enquiry submitted";back.disabled=true;form.querySelectorAll("input,select,textarea").forEach(el=>el.readOnly=true);
      } catch {
        status.textContent="We could not confirm delivery. Your details are still here. Please try again or download your brief"+(email ? " and email it to "+email : "")+".";
        sending=false;send.disabled=false;send.textContent="Try again";
      } finally {clearTimeout(timeout);status.focus();}
    });
    showStep(false);
  }
  // Accessible navigation: hidden mobile items cannot receive keyboard focus.
  const nav=document.querySelector(".nav__links"), toggle=document.querySelector(".nav-toggle");
  const mobile=matchMedia("(max-width: 1000px)");
  function navState() {
    if(nav) nav.inert=mobile.matches && !document.body.classList.contains("menu-open");
    if(!mobile.matches) {document.body.classList.remove("menu-open");toggle?.setAttribute("aria-expanded","false");}
  }
  toggle?.addEventListener("click",navState);mobile.addEventListener("change",navState);
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape" && document.body.classList.contains("menu-open")) {document.body.classList.remove("menu-open");toggle?.setAttribute("aria-expanded","false");navState();toggle?.focus();}
    if(e.key==="Tab" && mobile.matches && document.body.classList.contains("menu-open")){
      const links=[toggle,...nav.querySelectorAll("a")];const first=links[0],last=links.at(-1);
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  navState(); updateSaved();
  if(emailSafe(config.enquiryEmail)) {
    document.querySelectorAll(".footer__column").forEach(col => { if(col.querySelector("h4")?.textContent === "Concierge") col.innerHTML=`<h4>Concierge</h4><a href="mailto:${escape(config.enquiryEmail)}">${escape(config.enquiryEmail)}</a><a href="tel:+447957644502">+44 (0)7957 644 502</a><a href="contact.html">Plan your journey</a>`; });
  }
  function emailSafe(value){return typeof value === "string" && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(value);}
})();
