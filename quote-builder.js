const form = document.querySelector("#quote-builder");
const status = document.querySelector("[data-builder-status]");
const lists = {
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

const addItem = (type, values = {}) => {
  const template = document.querySelector(`#${type}-template`);
  const item = template.content.firstElementChild.cloneNode(true);
  item.querySelectorAll("[data-key]").forEach((field) => {
    field.value = values[field.dataset.key] ?? "";
  });
  item
    .querySelector("[data-remove]")
    .addEventListener("click", () => item.remove());
  lists[type].append(item);
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

const getData = () => {
  const fields = Object.fromEntries(new FormData(form));
  return {
    ...fields,
    days: readItems("day"),
    stays: readItems("stay"),
    golf: readItems("golf"),
  };
};

const validate = () => {
  if (!form.reportValidity()) return false;
  if (!lists.day.children.length) {
    setStatus("Add at least one itinerary day.", true);
    lists.day.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  if (!lists.stay.children.length) {
    setStatus("Add at least one accommodation entry.", true);
    lists.stay.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  return true;
};

const renderDays = (days) =>
  days
    .map(
      (item) => `<div class="quote-day">
        <div><span>Day ${htmlEscape(item.day)}</span><strong>${htmlEscape(formatDate(item.date))}</strong></div>
        <div><h3>${htmlEscape(item.title)}</h3><p>${htmlEscape(item.details)}</p></div>
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
          <p>${htmlEscape(item.description)}</p>
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
        <div><h3>${htmlEscape(item.course)}</h3><p>${htmlEscape(item.courseDetails)}</p></div>
        <dl><div><dt>Tee time</dt><dd>${htmlEscape(item.teeTime)}</dd></div><div><dt>Included</dt><dd>${htmlEscape(item.included)}</dd></div></dl>
      </div>`;
    })
    .join("");

const loadQuoteAssets = async (data) => {
  const siteUrl = data.siteUrl.trim().replace(/\/$/, "");
  const stylesheetUrl = `${siteUrl}/styles.css`;
  const logoUrl = `${siteUrl}/velvet-edge-logo-v3.svg`;
  const fetchText = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url} is unavailable`);
    return response.text();
  };
  const [stylesheet, logo] = await Promise.allSettled([
    fetchText(stylesheetUrl),
    fetchText(logoUrl),
  ]);

  return {
    styleMarkup:
      stylesheet.status === "fulfilled"
        ? `<style>\n${stylesheet.value}\n</style>`
        : `<link rel="stylesheet" href="${attributeEscape(stylesheetUrl)}">`,
    logoMarkup:
      logo.status === "fulfilled"
        ? logo.value
            .replace(/<\?xml[^>]*>\s*/i, "")
            .replace(
              "<svg ",
              '<svg class="brand__mark" aria-hidden="true" focusable="false" ',
            )
        : `<img class="brand__mark" src="${attributeEscape(logoUrl)}" alt="" width="150" height="56">`,
  };
};

const generateHtml = (data, assets) => {
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
      <div class="quote-facts">
        <div class="quote-fact quote-fact--wide"><span>Hotel</span><strong>${htmlEscape(data.hotel)}</strong><small>${htmlEscape(data.location)}</small></div>
        <div class="quote-fact"><span>Room</span><strong>${htmlEscape(data.room)}</strong></div>
        <div class="quote-fact"><span>Arrival date</span><strong>${htmlEscape(formatDate(data.arrival))}</strong></div>
        <div class="quote-fact"><span>Duration</span><strong>${htmlEscape(data.nights)} nights</strong></div>
        <div class="quote-fact"><span>Board basis</span><strong>${htmlEscape(data.board)}</strong></div>
        <div class="quote-fact"><span>Total guests</span><strong>${htmlEscape(data.guests)}</strong></div>
        <div class="quote-fact quote-fact--wide"><span>Golf courses</span><strong>${htmlEscape(data.golfSummary || "To be confirmed")}</strong></div>
      </div>
      <div class="quote-price"><div><span>Price per person</span><strong>${htmlEscape(data.perPerson)}</strong><small>Per person, based on the stated occupancy</small></div><div class="quote-price__total"><span>Total holiday price</span><strong>${htmlEscape(data.totalPrice)}</strong><small>Including all items shown below</small></div></div>
      ${inclusions ? `<div class="quote-inclusions"><p class="eyebrow">Included in your proposal</p><ul>${inclusions}</ul></div>` : ""}
    </div></section>
    <section class="quote-details section"><div class="container"><div class="quote-section-heading"><div><p class="eyebrow">The complete proposal</p><h2>Explore every detail</h2></div><p>Select each section to view the full arrangements.</p></div>
      <div class="quote-accordions">
        <details class="quote-accordion" open><summary><span class="quote-accordion__number">01</span><span><small>Day by day</small>Itinerary overview</span><i aria-hidden="true"></i></summary><div class="quote-accordion__content">${renderDays(data.days)}</div></details>
        <details class="quote-accordion"><summary><span class="quote-accordion__number">02</span><span><small>Your stay</small>Full accommodation itinerary</span><i aria-hidden="true"></i></summary><div class="quote-accordion__content">${renderStays(data.stays)}</div></details>
        ${data.golf.length ? `<details class="quote-accordion"><summary><span class="quote-accordion__number">03</span><span><small>Your rounds</small>Full golf itinerary</span><i aria-hidden="true"></i></summary><div class="quote-accordion__content">${renderGolf(data.golf)}${data.golfNote ? `<p class="quote-note">${htmlEscape(data.golfNote)}</p>` : ""}</div></details>` : ""}
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
    await navigator.clipboard.writeText(
      document.querySelector("[data-expected-link]").textContent,
    );
    setStatus(
      "Client link copied. It will work after the generated file is uploaded.",
    );
  });

document.querySelector("[data-preview]").addEventListener("click", async () => {
  if (!validate()) return;
  const data = getData();
  setStatus("Preparing preview...");
  const assets = await loadQuoteAssets(data);
  const url = URL.createObjectURL(
    new Blob([generateHtml(data, assets)], { type: "text/html" }),
  );
  window.open(url, "_blank", "noopener");
  setStatus("Preview opened in a new tab.");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validate()) return;
  const data = getData();
  const filename = `quote-${slugify(data.reference)}.html`;
  setStatus("Building the complete styled quote...");
  const assets = await loadQuoteAssets(data);
  download(generateHtml(data, assets), filename, "text/html");
  setStatus(
    `${filename} downloaded. Upload it to GitHub to activate the client link.`,
  );
});

document.querySelector("[data-save-draft]").addEventListener("click", () => {
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
      Object.entries(data).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (field && typeof value === "string") {
          field.value = value;
        }
      });
      Object.keys(lists).forEach((type) => {
        lists[type].replaceChildren();
        (data[type === "day" ? "days" : type] || []).forEach((item) =>
          addItem(type, item),
        );
      });
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
addItem("day", { day: "1" });
addItem("stay");
updateExpectedLink();
