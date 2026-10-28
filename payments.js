(() => {
  const storageKey = "velvet-edge-payment-tracker-v1";
  const quoteStorageKey = "velvet-edge-payment-tracker-quotes-v1";
  const travellerList = document.querySelector("#traveller-list");
  const emptyState = document.querySelector("#empty-state");
  const dialog = document.querySelector("#traveller-dialog");
  const form = document.querySelector("#traveller-form");
  const installmentFields = document.querySelector("#installment-fields");
  const installmentTemplate = document.querySelector("#installment-template");
  const formError = document.querySelector("#form-error");
  const searchInput = document.querySelector("#search-travellers");
  const quoteFile = document.querySelector("#quote-file");
  const shareDialog = document.querySelector("#share-dialog");
  const shareForm = document.querySelector("#share-form");
  let travellers = loadTravellers();
  let quotes = loadQuotes();
  let editingId = null;
  let duplicateSource = null;
  let preferredQuoteId = travellers[0]?.quoteId || quotes[0]?.id || "";

  function loadTravellers() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(parsed) ? parsed.filter(isValidRecord) : [];
    } catch {
      return [];
    }
  }

  function isValidRecord(record) {
    return record && typeof record === "object" && typeof record.name === "string" && Array.isArray(record.installments);
  }

  function duplicateTravellerRecord(traveller) {
    const copy = JSON.parse(JSON.stringify(traveller));
    copy.id = "";
    copy.name = "";
    return copy;
  }

  function loadQuotes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(quoteStorageKey) || "[]");
      return Array.isArray(parsed) ? parsed.filter((quote) => quote && typeof quote.id === "string" && typeof quote.reference === "string" && typeof quote.title === "string") : [];
    } catch {
      return [];
    }
  }

  function saveQuotes() {
    try {
      localStorage.setItem(quoteStorageKey, JSON.stringify(quotes));
      return true;
    } catch {
      announce("This browser could not save the quote. Check available storage and try again.");
      return false;
    }
  }

  function saveTravellers() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(travellers));
      return true;
    } catch {
      showError("This browser could not save the record. Check available storage and try again.");
      return false;
    }
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function cents(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 100) : 0;
  }

  function money(amountCents, currency) {
    const value = amountCents / 100;
    try {
      return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);
    } catch {
      return `${currency || ""} ${value.toFixed(2)}`.trim();
    }
  }

  function dateLabel(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "Not set";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? "Not set" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function validHttpsUrl(value) {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname);
    } catch {
      return false;
    }
  }

  function quoteIdFor(reference) {
    return String(reference || "").trim().toLocaleLowerCase();
  }

  function parseQuoteAmount(value) {
    const text = String(value || "").trim();
    const match = text.match(/\d[\d,]*(?:\.\d{1,2})?/);
    if (!match) return "";
    const amount = Number(match[0].replace(/,/g, ""));
    return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : "";
  }

  function quotePageUrl(siteUrl, reference) {
    if (!validHttpsUrl(siteUrl)) return "";
    try {
      const base = new URL(siteUrl);
      base.search = "";
      base.hash = "";
      base.pathname = `${base.pathname.replace(/\/$/, "")}/quote-${String(reference).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client-quote"}.html`;
      return base.href;
    } catch {
      return "";
    }
  }

  function refreshQuoteOptions(selectedId = form.elements.quoteId.value) {
    const select = form.elements.quoteId;
    select.replaceChildren(new Option("Import or select a quote…", ""));
    quotes.forEach((quote) => select.add(new Option(`${quote.reference} · ${quote.title}`, quote.id)));
    select.value = quotes.some((quote) => quote.id === selectedId) ? selectedId : "";
    applySelectedQuote();
  }

  function applySelectedQuote() {
    const quote = quotes.find((item) => item.id === form.elements.quoteId.value);
    form.elements.quoteRef.value = quote?.reference || "";
    form.elements.quoteTitle.value = quote?.title || "";
    form.elements.quoteUrl.value = quote?.quoteUrl || "";
    if (quote?.currency) form.elements.currency.value = quote.currency;
    if (quote?.terms && !form.elements.terms.value.trim()) form.elements.terms.value = quote.terms;
    const previousPrefill = form.dataset.quotePrefill || "";
    if (!form.elements.total.value || (previousPrefill && form.elements.total.value === previousPrefill)) {
      form.elements.total.value = quote?.originalPerPerson || "";
    }
    form.dataset.quotePrefill = quote?.originalPerPerson || "";
    const priceNote = document.querySelector("#quote-price-note");
    if (quote?.originalPerPerson) {
      priceNote.textContent = `Imported per-person quote amount: ${money(cents(quote.originalPerPerson), quote.currency || form.elements.currency.value)}. The agreed total above is editable; update the instalments to match any agreed change.`;
      priceNote.hidden = false;
    } else if (quote?.originalPerPersonText) {
      priceNote.textContent = `Original per-person quote amount: ${quote.originalPerPersonText}. Enter the traveller’s agreed total below; the quoted group total is not applied automatically.`;
      priceNote.hidden = false;
    } else {
      priceNote.textContent = "No per-person amount could be read from this quote. Enter the agreed total for this traveller.";
      priceNote.hidden = !quote;
    }
    refreshScheduleTotal();
  }

  async function importQuote(file) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      announce("Choose a quote file under 50 MB.");
      return;
    }
    try {
      const source = await file.text();
      let data;
      if (/^\s*</.test(source)) {
        const quoteData = source.match(/<script\b(?=[^>]*\bid=["']velvet-quote-data["'])[^>]*>([\s\S]*?)<\/script\s*>/i);
        if (!quoteData) throw new Error("The selected HTML does not contain a Velvet Edge quote record.");
        data = JSON.parse(quoteData[1]);
        if (data.format !== "velvet-edge-client-quote") throw new Error("The selected page is not a Velvet Edge quote.");
      } else {
        data = JSON.parse(source);
      }
      const reference = String(data.reference || "").trim();
      const title = String(data.title || "").trim();
      if (!reference || !title) throw new Error("This quote file is missing its quote reference or proposal title.");
      const id = quoteIdFor(reference);
      const currency = /^[A-Za-z]{3}$/.test(data.currency || "") ? data.currency.toUpperCase() : "";
      const quoteTerms = [
        data.bookingTerms ? `Booking terms\n${data.bookingTerms}` : "",
        data.paymentTerms ? `Payment terms\n${data.paymentTerms}` : "",
      ].filter(Boolean).join("\n\n");
      const quote = {
        id,
        reference,
        title,
        destination: String(data.location || "").trim(),
        currency,
        originalPerPerson: parseQuoteAmount(data.perPerson),
        originalPerPersonText: String(data.perPerson || "").trim(),
        quoteUrl: quotePageUrl(data.siteUrl, reference),
        terms: quoteTerms,
      };
      const existingIndex = quotes.findIndex((item) => item.id === id);
      if (existingIndex >= 0) quotes[existingIndex] = quote;
      else quotes.unshift(quote);
      if (!saveQuotes()) return;
      preferredQuoteId = id;
      refreshQuoteOptions(id);
      openEditor();
      announce(`Quote ${reference} imported. Add a traveller to attach them to this quote.`);
    } catch (error) {
      announce(error.message || "That file could not be read as a Velvet Edge quote or draft.");
    } finally {
      quoteFile.value = "";
    }
  }

  function getBalances(traveller) {
    const total = cents(traveller.total);
    const paid = traveller.installments.reduce((sum, installment) => sum + Math.min(cents(installment.paid), cents(installment.amount)), 0);
    return { total, paid, outstanding: Math.max(0, total - paid) };
  }

  function installmentState(installment) {
    const amount = cents(installment.amount);
    const paid = Math.min(cents(installment.paid), amount);
    if (paid >= amount) return { label: "Paid", className: "paid", outstanding: 0 };
    const overdue = Boolean(installment.dueDate && installment.dueDate < localToday());
    if (overdue) return { label: paid > 0 ? "Overdue · partial" : "Overdue", className: "overdue", outstanding: amount - paid };
    if (paid > 0) return { label: "Partial", className: "partial", outstanding: amount - paid };
    return { label: "Unpaid", className: "", outstanding: amount };
  }

  function localToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function travellerState(traveller) {
    const balance = getBalances(traveller);
    const overdue = traveller.installments.some((installment) => installmentState(installment).className === "overdue");
    if (balance.outstanding === 0) return { label: "Paid", className: "paid" };
    if (overdue) return { label: "Overdue", className: "overdue" };
    if (balance.paid > 0) return { label: "Part-paid", className: "partial" };
    return { label: "Unpaid", className: "" };
  }

  function currencyGroups(key) {
    const totals = new Map();
    travellers.forEach((traveller) => {
      const amount = getBalances(traveller)[key];
      totals.set(traveller.currency, (totals.get(traveller.currency) || 0) + amount);
    });
    if (totals.size === 0) return "—";
    return [...totals.entries()].map(([currency, amount]) => money(amount, currency)).join(" · ");
  }

  function nextDue(traveller) {
    const upcoming = traveller.installments
      .filter((installment) => installmentState(installment).outstanding > 0)
      .map((installment) => installment.dueDate)
      .filter(Boolean)
      .sort();
    return upcoming.length ? dateLabel(upcoming[0]) : "No balance due";
  }

  function installmentRows(traveller) {
    return traveller.installments.map((installment, index) => {
      const state = installmentState(installment);
      const url = validHttpsUrl(installment.url) ? installment.url : "";
      const linkActions = url
        ? `<button class="mini-action" type="button" data-action="copy-link" data-traveller="${escapeHtml(traveller.id)}" data-installment="${index}">Copy link</button><button class="mini-action" type="button" data-action="open-link" data-traveller="${escapeHtml(traveller.id)}" data-installment="${index}">Open link</button>`
        : `<span class="muted-cell">No link added</span>`;
      return `<tr><td>${escapeHtml(installment.label)}</td><td>${money(cents(installment.amount), traveller.currency)}</td><td>${dateLabel(installment.dueDate)}</td><td>${money(cents(installment.paid), traveller.currency)}${installment.paidDate ? `<br><small>Received ${dateLabel(installment.paidDate)}</small>` : ""}${installment.reference ? `<br><small>Ref ${escapeHtml(installment.reference)}</small>` : ""}</td><td><span class="status-pill status-pill--${state.className}">${escapeHtml(state.label)}</span></td><td class="schedule-actions">${linkActions}</td></tr>`;
    }).join("");
  }

  function adjustmentHistory(traveller) {
    const entries = Array.isArray(traveller.adjustments) ? traveller.adjustments.slice(-5).reverse() : [];
    if (!entries.length) return "";
    const scheduleText = (schedule) => (schedule || []).map((item) => `${item.label}: ${money(cents(item.amount), traveller.currency)} (${money(cents(item.paid), traveller.currency)} paid; due ${dateLabel(item.dueDate)})`).join(" · ");
    const rows = entries.map((entry) => `<li><strong>${escapeHtml(dateLabel(String(entry.recordedAt || "").slice(0, 10)))}</strong><span>${escapeHtml(entry.reason)}</span><small>Total: ${money(cents(entry.previousTotal), traveller.currency)} → ${money(cents(entry.currentTotal), traveller.currency)} · Paid: ${money(cents(entry.previousPaid), traveller.currency)} → ${money(cents(entry.currentPaid), traveller.currency)}</small><small>Before: ${escapeHtml(scheduleText(entry.previousSchedule))}</small><small>After: ${escapeHtml(scheduleText(entry.currentSchedule))}</small></li>`).join("");
    return `<section class="adjustment-history"><h4>Recent private payment adjustments</h4><ol>${rows}</ol></section>`;
  }

  function paymentFacts(traveller) {
    return JSON.stringify({
      total: traveller.total,
      currency: traveller.currency,
        installments: traveller.installments.map(({ label, amount, dueDate, paid, paidDate, reference }) => ({ label, amount, dueDate, paid, paidDate, reference })),
    });
  }

  function renderTraveller(traveller) {
    const balance = getBalances(traveller);
    const state = travellerState(traveller);
    const percent = balance.total ? Math.min(100, Math.round((balance.paid / balance.total) * 100)) : 0;
    const quote = quotes.find((item) => item.id === traveller.quoteId);
    const quoteReference = traveller.quoteRef || quote?.reference || "Unlinked quote";
    const quoteTitle = traveller.quoteTitle || quote?.title || "";
    const quoteHref = validHttpsUrl(traveller.quoteUrl || quote?.quoteUrl) ? traveller.quoteUrl || quote.quoteUrl : "";
    const quoteLink = quoteHref ? `<a href="${escapeHtml(quoteHref)}" target="_blank" rel="noopener noreferrer">Open quote</a>` : "";
    const originalPerPerson = traveller.originalQuotePerPerson || quote?.originalPerPerson || "";
    const quotedAmount = originalPerPerson ? ` · Quoted per person ${money(cents(originalPerPerson), traveller.currency)}` : "";
    const notes = traveller.notes ? `<p class="traveller-notes"><strong>Private note:</strong> ${escapeHtml(traveller.notes)}</p>` : "";
    const terms = traveller.terms ? `<p class="traveller-terms"><strong>Confirmed terms:</strong> ${escapeHtml(traveller.terms)}</p>` : `<p class="traveller-terms">Add confirmed booking, cancellation and refund terms before creating a customer summary.</p>`;
    return `<article class="traveller-card" data-traveller-card="${escapeHtml(traveller.id)}">
      <div class="traveller-card__top">
        <div class="traveller-card__name"><h3>${escapeHtml(traveller.name)}</h3><p>${traveller.installments.length} instalment${traveller.installments.length === 1 ? "" : "s"}</p><p class="quote-reference"><strong>${escapeHtml(quoteReference)}</strong>${quoteTitle ? ` · ${escapeHtml(quoteTitle)}` : ""}${quotedAmount}${quoteLink ? ` · ${quoteLink}` : ""}</p></div>
        <div class="traveller-metric"><span>Agreed total</span><strong>${money(balance.total, traveller.currency)}</strong></div>
        <div class="traveller-metric"><span>Paid</span><strong>${money(balance.paid, traveller.currency)}</strong></div>
        <div class="traveller-metric"><span>Outstanding</span><strong>${money(balance.outstanding, traveller.currency)}</strong></div>
        <div class="traveller-metric"><span>Next due</span><strong>${escapeHtml(nextDue(traveller))}</strong></div>
        <span class="status-pill status-pill--${state.className}">${escapeHtml(state.label)}</span>
      </div>
      <div class="traveller-progress"><div class="traveller-progress__labels"><span>${percent}% paid</span><span>${money(balance.outstanding, traveller.currency)} outstanding</span></div><div class="progress-track" role="progressbar" aria-label="Payment progress for ${escapeHtml(traveller.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div></div>
      <div class="traveller-card__details">
        <table class="schedule-table"><thead><tr><th>Payment</th><th>Amount</th><th>Due</th><th>Paid</th><th>Status</th><th>Payment link</th></tr></thead><tbody>${installmentRows(traveller)}</tbody></table>
        ${terms}${adjustmentHistory(traveller)}${notes}
        <div class="traveller-card__actions"><button class="mini-action" type="button" data-action="share" data-traveller="${escapeHtml(traveller.id)}">Create customer link</button><button class="mini-action" type="button" data-action="export" data-traveller="${escapeHtml(traveller.id)}">Download summary</button><button class="mini-action" type="button" data-action="duplicate" data-traveller="${escapeHtml(traveller.id)}">Duplicate payment</button><button class="mini-action" type="button" data-action="edit" data-traveller="${escapeHtml(traveller.id)}">Edit details</button><button class="mini-action mini-action--danger" type="button" data-action="delete" data-traveller="${escapeHtml(traveller.id)}">Remove</button></div>
      </div>
    </article>`;
  }

  function render() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const visible = travellers.filter((traveller) => [traveller.name, traveller.quoteRef, traveller.quoteTitle].some((value) => String(value || "").toLocaleLowerCase().includes(query)));
    travellerList.innerHTML = visible.map(renderTraveller).join("");
    emptyState.hidden = travellers.length > 0;
    if (travellers.length > 0 && visible.length === 0) {
      travellerList.innerHTML = '<p class="empty-state">No traveller matches that name.</p>';
    }
    document.querySelector("#stat-travellers").textContent = String(travellers.length);
    document.querySelector("#stat-collected").textContent = currencyGroups("paid");
    document.querySelector("#stat-outstanding").textContent = currencyGroups("outstanding");
    document.querySelector("#stat-overdue").textContent = String(travellers.filter((traveller) => travellerState(traveller).className === "overdue").length);
  }

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function clearError() {
    formError.textContent = "";
    formError.hidden = true;
  }

  function addInstallment(values = {}) {
    const row = installmentTemplate.content.firstElementChild.cloneNode(true);
    const index = installmentFields.children.length + 1;
    row.querySelector("legend").textContent = values.label || `Instalment ${index}`;
    row.querySelectorAll("[data-installment]").forEach((input) => {
      const key = input.dataset.installment;
      input.value = values[key] ?? (key === "paid" ? "0.00" : "");
      if (!values.id && key === "label" && !input.value) input.value = index === 1 ? "First deposit" : `Instalment ${index}`;
      input.addEventListener("input", () => {
        if (key === "label") row.querySelector("legend").textContent = input.value || `Instalment ${index}`;
        if (key === "amount" || key === "paid") refreshScheduleTotal();
      });
    });
    row.querySelector(".installment-remove").addEventListener("click", () => {
      if (installmentFields.children.length <= 1) {
        showError("Keep at least one payment instalment.");
        return;
      }
      row.remove();
      refreshScheduleTotal();
    });
    installmentFields.append(row);
    refreshScheduleTotal();
  }

  function refreshScheduleTotal() {
    const sum = [...installmentFields.querySelectorAll('[data-installment="amount"]')].reduce((total, input) => total + cents(input.value), 0);
    const currency = (form.elements.currency.value || "").toUpperCase();
    const totalDue = cents(form.elements.total.value);
    const target = document.querySelector("#schedule-total");
    const balanced = totalDue > 0 && sum === totalDue;
    target.textContent = `Schedule total: ${currency.length === 3 ? money(sum, currency) : (sum / 100).toFixed(2)}${totalDue ? ` of ${currency.length === 3 ? money(totalDue, currency) : (totalDue / 100).toFixed(2)}` : ""}`;
    target.classList.toggle("is-balanced", balanced);
    target.classList.toggle("is-unbalanced", sum > 0 && !balanced);
  }

  function clearForm() {
    form.reset();
    installmentFields.replaceChildren();
    clearError();
    editingId = null;
    duplicateSource = null;
    form.dataset.quotePrefill = "";
    document.querySelector("#adjustment-reason-field").hidden = true;
    document.querySelector("#adjustment-history").hidden = true;
    document.querySelector("#duplicate-warning").hidden = true;
    refreshQuoteOptions(preferredQuoteId);
    document.querySelector("#dialog-title").textContent = "Add a traveller";
    const submit = form.querySelector('[type="submit"]');
    submit.textContent = "Save traveller";
    addInstallment({ label: "First deposit" });
    refreshScheduleTotal();
  }

  function openEditor(traveller = null, options = {}) {
    const duplicate = options.duplicate === true;
    if (!quotes.length && !traveller) {
      announce("Import the sent quote or its JSON draft before adding travellers.");
      quoteFile.click();
      return;
    }
    clearForm();
    if (traveller) {
      duplicateSource = duplicate ? duplicateTravellerRecord(traveller) : null;
      editingId = duplicate ? null : traveller.id;
      preferredQuoteId = traveller.quoteId || "";
      refreshQuoteOptions(preferredQuoteId);
      document.querySelector("#dialog-title").textContent = duplicate ? "Duplicate traveller payment" : "Edit traveller";
      form.querySelector('[type="submit"]').textContent = duplicate ? "Save duplicate" : "Save changes";
      form.elements.name.value = duplicate ? "" : traveller.name;
      form.elements.total.value = traveller.total;
      form.elements.currency.value = traveller.currency;
      form.elements.quoteUrl.value = traveller.quoteUrl || "";
      form.elements.terms.value = traveller.terms || "";
      form.elements.notes.value = traveller.notes || "";
      form.elements.adjustmentReason.value = "";
      document.querySelector("#adjustment-reason-field").hidden = duplicate;
      const history = document.querySelector("#adjustment-history");
      history.innerHTML = adjustmentHistory(traveller);
      history.hidden = !traveller.adjustments?.length;
      document.querySelector("#duplicate-warning").hidden = !duplicate;
      installmentFields.replaceChildren();
      traveller.installments.forEach(addInstallment);
    }
    dialog.showModal();
    form.elements.name.focus();
  }

  function readInstallments() {
    return [...installmentFields.querySelectorAll(".installment-field")].map((row) => Object.fromEntries(
      [...row.querySelectorAll("[data-installment]")].map((input) => [input.dataset.installment, input.value.trim()]),
    ));
  }

  function validateAndBuildRecord() {
    const name = form.elements.name.value.trim();
    const total = form.elements.total.value;
    const currency = form.elements.currency.value.trim().toUpperCase();
    const terms = form.elements.terms.value.trim();
    const notes = form.elements.notes.value.trim();
    const quote = quotes.find((item) => item.id === form.elements.quoteId.value);
    const existingRecord = travellers.find((item) => item.id === editingId);
    const sourceRecord = existingRecord || duplicateSource;
    const quoteUrl = form.elements.quoteUrl.value.trim();
    const installments = readInstallments();
    if (!quote) return { error: "Import and select the quote this traveller belongs to." };
    if (quoteUrl && !validHttpsUrl(quoteUrl)) return { error: "The original quote link must be a valid HTTPS address." };
    if (!name) return { error: "Enter the traveller’s name." };
    if (!Number.isFinite(Number(total)) || cents(total) <= 0) return { error: "Enter a total amount greater than zero." };
    if (!/^[A-Z]{3}$/.test(currency)) return { error: "Enter a three-letter ISO currency code, such as GBP or EUR." };
    if (!installments.length) return { error: "Add at least one instalment." };
    for (const [index, installment] of installments.entries()) {
      if (!installment.label) return { error: `Give instalment ${index + 1} a name.` };
      if (!Number.isFinite(Number(installment.amount)) || cents(installment.amount) <= 0) return { error: `Enter an amount greater than zero for “${installment.label}”.` };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(installment.dueDate)) return { error: `Add a due date for “${installment.label}”.` };
      if (installment.url && !validHttpsUrl(installment.url)) return { error: `The payment link for “${installment.label}” must be a valid HTTPS address.` };
      if (!Number.isFinite(Number(installment.paid)) || cents(installment.paid) < 0 || cents(installment.paid) > cents(installment.amount)) return { error: `The amount paid for “${installment.label}” must be between zero and its instalment amount.` };
    }
    const scheduleTotal = installments.reduce((sum, installment) => sum + cents(installment.amount), 0);
    if (scheduleTotal !== cents(total)) return { error: `Instalments add up to ${money(scheduleTotal, currency)}; they must equal the total due of ${money(cents(total), currency)}.` };
    return {
      record: {
        id: editingId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        quoteId: quote.id,
        quoteRef: quote.reference,
        quoteTitle: quote.title,
        destination: quote.destination,
        quoteUrl,
        originalQuotePerPerson: sourceRecord?.originalQuotePerPerson || quote.originalPerPerson || "",
        originalQuotePerPersonText: sourceRecord?.originalQuotePerPersonText || quote.originalPerPersonText || "",
        name,
        total: (cents(total) / 100).toFixed(2),
        currency,
        terms,
        notes,
        adjustments: sourceRecord?.adjustments || [],
        installments: installments.map((installment) => ({
          label: installment.label,
          amount: (cents(installment.amount) / 100).toFixed(2),
          dueDate: installment.dueDate,
          url: installment.url,
          paid: (cents(installment.paid) / 100).toFixed(2),
          paidDate: installment.paidDate,
          reference: installment.reference,
        })),
      },
    };
  }

  function customerSummary(traveller) {
    const balance = getBalances(traveller);
    const quote = quotes.find((item) => item.id === traveller.quoteId);
    const quoteRef = traveller.quoteRef || quote?.reference || "";
    const quoteTitle = traveller.quoteTitle || quote?.title || "";
    const quoteUrl = traveller.quoteUrl || quote?.quoteUrl || "";
    const originalQuotePerPerson = traveller.originalQuotePerPerson || "";
    const quoteDetails = `<section class="quote"><strong>Quote ${escapeHtml(quoteRef)}</strong><br>${escapeHtml(quoteTitle)}${traveller.destination ? `<br>${escapeHtml(traveller.destination)}` : ""}${originalQuotePerPerson ? `<br>Original quote per person: ${escapeHtml(money(cents(originalQuotePerPerson), traveller.currency))}` : ""}${validHttpsUrl(quoteUrl) ? `<br><a href="${escapeHtml(quoteUrl)}" rel="noopener noreferrer">View your original travel quote</a>` : ""}</section>`;
    const rows = traveller.installments.map((installment) => {
      const link = validHttpsUrl(installment.url)
        ? `<a href="${escapeHtml(installment.url)}" rel="noopener noreferrer">Pay securely for ${escapeHtml(installment.label)}</a>`
        : "Payment link will be shared separately";
      return `<tr><td>${escapeHtml(installment.label)}</td><td>${escapeHtml(money(cents(installment.amount), traveller.currency))}</td><td>${escapeHtml(dateLabel(installment.dueDate))}</td><td>${link}</td></tr>`;
    }).join("");
    return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Payment summary | Velvet Edge Travel</title><style>*{box-sizing:border-box}body{margin:0;background:#f8f5ef;color:#171512;font:16px/1.65 Arial,sans-serif}.top{padding:14px max(22px,calc((100vw - 760px)/2));background:#171512;color:white;font-family:Georgia,serif;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;gap:12px}.top img{width:55px;height:45px;object-fit:contain}.top em{color:#c7a35a;font-style:normal}main{max-width:760px;margin:50px auto;padding:0 22px}.eyebrow{color:#8b703e;font-size:11px;font-weight:bold;letter-spacing:.18em;text-transform:uppercase}h1{font:400 clamp(38px,8vw,64px)/1 Georgia,serif}p{color:#625c53}.amount{padding:20px 0;border-top:1px solid #d6cdbd;border-bottom:1px solid #d6cdbd}.amount strong{font:400 34px Georgia,serif}.table-wrap{overflow-x:auto}table{width:100%;min-width:560px;margin:28px 0;border-collapse:collapse}th,td{padding:13px 10px;border-bottom:1px solid #ded8ce;text-align:left;font-size:14px}th{color:#706a61;font-size:11px;text-transform:uppercase}a{color:#594520;text-underline-offset:3px}.quote,.terms{margin:24px 0;padding:18px;background:#eee8dc;white-space:pre-line}.footer{margin-top:36px;padding-top:20px;border-top:1px solid #d6cdbd;color:#706a61;font-size:12px}.safety{font-size:12px}</style></head><body><header class="top"><img src="https://www.velvetedgetravel.com/velvet-edge-logo-v3.svg" alt="Velvet Edge Travel logo">Velvet Edge <em>Travel</em></header><main><p class="eyebrow">Your personal payment schedule</p><h1>Hello, ${escapeHtml(traveller.name)}</h1><p>Here is your payment schedule for your Velvet Edge Travel arrangements.</p>${quoteDetails}<div class="amount"><p>Agreed total</p><strong>${escapeHtml(money(balance.total, traveller.currency))}</strong><p>${escapeHtml(money(balance.paid, traveller.currency))} received · ${escapeHtml(money(balance.outstanding, traveller.currency))} outstanding</p></div><div class="table-wrap"><table><thead><tr><th>Payment</th><th>Amount</th><th>Due date</th><th>Payment</th></tr></thead><tbody>${rows}</tbody></table></div><section class="terms"><strong>Booking, cancellation and refund terms</strong><br>${escapeHtml(traveller.terms)}</section><p class="safety">Use the secure payment link shown for each instalment. This summary does not collect card details. Your payment processor should provide confirmation or a receipt after payment.</p><footer class="footer">Velvet Edge Travel · Thoughtfully tailored travel<br>Contact <a href="mailto:bookings@velvetedgetravel.com">bookings@velvetedgetravel.com</a> if any amount or due date does not match your travel quote.<br><a href="https://www.velvetedgetravel.com">velvetedgetravel.com</a></footer></main></body></html>`;
  }

  function exportSummary(traveller) {
    if (!traveller.terms || !traveller.terms.trim()) {
      window.alert("Add the confirmed booking, cancellation and refund terms from this traveller’s quote before exporting their customer summary.");
      openEditor(traveller);
      form.elements.terms.focus();
      return;
    }
    const blob = new Blob([customerSummary(traveller)], { type: "text/html;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    const filename = traveller.name.normalize("NFKD").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "traveller";
    download.href = objectUrl;
    download.download = `velvet-edge-payment-summary-${filename}.html`;
    document.body.append(download);
    download.click();
    download.remove();
    URL.revokeObjectURL(objectUrl);
  }

  function encodeBase64Url(bytes) {
    let binary = "";
    new Uint8Array(bytes).forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  async function deriveShareKey(passphrase, salt, usage) {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, [usage]);
  }

  function openShareDialog(traveller) {
    if (!traveller.quoteId || !traveller.quoteRef) {
      window.alert("Attach this traveller to an imported quote before creating a customer link.");
      openEditor(traveller);
      return;
    }
    if (!traveller.terms || !traveller.terms.trim()) {
      window.alert("Add the confirmed booking, cancellation and refund terms before creating a customer link.");
      openEditor(traveller);
      form.elements.terms.focus();
      return;
    }
    const missingLink = traveller.installments.find((installment) => !validHttpsUrl(installment.url));
    if (missingLink) {
      window.alert(`Add a valid HTTPS payment link for “${missingLink.label}” before creating a customer link.`);
      openEditor(traveller);
      return;
    }
    shareForm.reset();
    document.querySelector("#share-error").hidden = true;
    document.querySelector("#share-link-field").hidden = true;
    document.querySelector("#share-copy").hidden = true;
    document.querySelector("#share-warning").hidden = true;
    shareForm.querySelector(".share-generate").hidden = false;
    document.querySelector("#share-link").value = "";
    document.querySelector("#share-context").textContent = `${traveller.name} · Quote ${traveller.quoteRef} · ${traveller.quoteTitle}`;
    shareDialog.dataset.travellerId = traveller.id;
    shareDialog.showModal();
    shareForm.elements.passphrase.focus();
  }

  function sharePayload(traveller) {
    const balance = getBalances(traveller);
    return {
      version: 1,
      name: traveller.name,
      quoteRef: traveller.quoteRef,
      quoteTitle: traveller.quoteTitle,
      destination: traveller.destination || "",
      quoteUrl: traveller.quoteUrl || "",
      originalQuotePerPerson: traveller.originalQuotePerPerson || "",
      currency: traveller.currency,
      total: (balance.total / 100).toFixed(2),
      paid: (balance.paid / 100).toFixed(2),
      outstanding: (balance.outstanding / 100).toFixed(2),
      terms: traveller.terms,
      installments: traveller.installments.map((installment) => ({
        label: installment.label,
        amount: installment.amount,
        dueDate: installment.dueDate,
        paid: installment.paid,
        paidDate: installment.paidDate || "",
        url: installment.url,
      })),
    };
  }

  async function createShareLink(traveller, passphrase) {
    if (window.location.protocol !== "https:") throw new Error("Open the dashboard on its published HTTPS website before creating links. A local file address cannot be sent to a customer.");
    if (!crypto.subtle) throw new Error("Secure link creation requires a browser with Web Crypto support on HTTPS.");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveShareKey(passphrase, salt, "encrypt");
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(sharePayload(traveller))));
    const fragment = ["vep1", encodeBase64Url(salt), encodeBase64Url(iv), encodeBase64Url(encrypted)].join(".");
    const shareUrl = new URL("payment-summary.html", window.location.href);
    shareUrl.hash = fragment;
    return shareUrl.href;
  }

  async function handleShareSubmit(event) {
    event.preventDefault();
    const message = document.querySelector("#share-error");
    const password = shareForm.elements.passphrase.value;
    const confirmation = shareForm.elements.confirmPassphrase.value;
    if (password.length < 12) {
      message.textContent = "Use a passphrase of at least 12 characters.";
      message.hidden = false;
      return;
    }
    if (password !== confirmation) {
      message.textContent = "The passphrases do not match.";
      message.hidden = false;
      return;
    }
    const traveller = travellers.find((item) => item.id === shareDialog.dataset.travellerId);
    if (!traveller) return;
    const submit = shareForm.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Encrypting…";
    try {
      const link = await createShareLink(traveller, password);
      document.querySelector("#share-link").value = link;
      document.querySelector("#share-link-field").hidden = false;
      document.querySelector("#share-copy").hidden = false;
      document.querySelector("#share-warning").hidden = false;
      shareForm.querySelector(".share-generate").hidden = true;
      shareForm.elements.passphrase.value = "";
      shareForm.elements.confirmPassphrase.value = "";
    } catch (error) {
      message.textContent = error.message || "This browser could not create the encrypted link.";
      message.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = "Create encrypted link";
    }
  }

  function announce(message) {
    document.querySelector("#list-status").textContent = message;
  }

  document.querySelector("#import-quote").addEventListener("click", () => quoteFile.click());
  quoteFile.addEventListener("change", () => importQuote(quoteFile.files[0]));
  document.querySelector("#add-traveller").addEventListener("click", () => openEditor());
  document.querySelector("[data-empty-add]").addEventListener("click", () => openEditor());
  document.querySelector("#add-installment").addEventListener("click", () => addInstallment());
  form.elements.quoteId.addEventListener("change", () => {
    preferredQuoteId = form.elements.quoteId.value;
    applySelectedQuote();
  });
  document.querySelectorAll("[data-close-share]").forEach((button) => button.addEventListener("click", () => shareDialog.close()));
  shareForm.addEventListener("submit", handleShareSubmit);
  document.querySelector("#copy-share-link").addEventListener("click", async () => {
    const link = document.querySelector("#share-link").value;
    try {
      await navigator.clipboard.writeText(link);
      document.querySelector("#copy-share-link").textContent = "Copied";
    } catch {
      document.querySelector("#share-link").focus();
      document.querySelector("#share-link").select();
      window.prompt("Copy this encrypted customer link:", link);
    }
  });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  searchInput.addEventListener("input", render);
  form.elements.total.addEventListener("input", refreshScheduleTotal);
  form.elements.currency.addEventListener("input", refreshScheduleTotal);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearError();
    const result = validateAndBuildRecord();
    if (result.error) {
      showError(result.error);
      return;
    }
    const existingIndex = travellers.findIndex((traveller) => traveller.id === editingId);
    if (existingIndex >= 0) {
      const previousRecord = travellers[existingIndex];
      if (paymentFacts(previousRecord) !== paymentFacts(result.record)) {
        const reason = form.elements.adjustmentReason.value.trim();
        if (!reason) {
          showError("Add an internal reason for changing the agreed total, instalments or amount paid.");
          form.elements.adjustmentReason.focus();
          return;
        }
        const previousBalance = getBalances(previousRecord);
        const currentBalance = getBalances(result.record);
        result.record.adjustments = [...(previousRecord.adjustments || []), {
          recordedAt: new Date().toISOString(),
          reason,
          previousTotal: previousRecord.total,
          currentTotal: result.record.total,
          previousPaid: (previousBalance.paid / 100).toFixed(2),
          currentPaid: (currentBalance.paid / 100).toFixed(2),
          previousSchedule: previousRecord.installments.map(({ label, amount, paid, dueDate }) => ({ label, amount, paid, dueDate })),
          currentSchedule: result.record.installments.map(({ label, amount, paid, dueDate }) => ({ label, amount, paid, dueDate })),
        }].slice(-50);
      }
      travellers[existingIndex] = result.record;
    } else travellers.unshift(result.record);
    if (!saveTravellers()) return;
    dialog.close();
    clearForm();
    render();
    announce(`${result.record.name} saved.`);
  });
  travellerList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const traveller = travellers.find((item) => item.id === button.dataset.traveller);
    if (!traveller) return;
    const installment = traveller.installments[Number(button.dataset.installment)];
    switch (button.dataset.action) {
      case "edit":
        openEditor(traveller);
        break;
      case "duplicate":
        openEditor(traveller, { duplicate: true });
        break;
      case "delete":
        if (window.confirm(`Remove the payment record for ${traveller.name} from this browser?`)) {
          travellers = travellers.filter((item) => item.id !== traveller.id);
          if (saveTravellers()) {
            render();
            announce(`${traveller.name} removed.`);
          }
        }
        break;
      case "export":
        exportSummary(traveller);
        break;
      case "share":
        openShareDialog(traveller);
        break;
      case "copy-link":
        if (!installment || !validHttpsUrl(installment.url)) break;
        try {
          await navigator.clipboard.writeText(installment.url);
          announce(`Payment link copied for ${traveller.name}, ${installment.label}.`);
          button.textContent = "Copied";
          window.setTimeout(() => { if (button.isConnected) button.textContent = "Copy link"; }, 1800);
        } catch {
          window.prompt("Copy this verified HTTPS payment link:", installment.url);
        }
        break;
      case "open-link":
        if (installment && validHttpsUrl(installment.url)) window.open(installment.url, "_blank", "noopener,noreferrer");
        break;
      default:
        break;
    }
  });

  refreshQuoteOptions(preferredQuoteId);
  render();
})();
