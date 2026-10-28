(() => {
  const form = document.querySelector("#unlock-form");
  const password = document.querySelector("#share-passphrase");
  const status = document.querySelector("#unlock-status");
  const unlockCard = document.querySelector("#unlock-card");
  const summary = document.querySelector("#customer-summary");
  const iterations = 600000;
  const decoder = new TextDecoder();

  function decodeBase64Url(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  function encodeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
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

  async function deriveKey(phrase, salt) {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(phrase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  }

  function validatePayload(payload) {
    if (!payload || payload.version !== 1 || typeof payload.name !== "string" || typeof payload.quoteRef !== "string" || typeof payload.quoteTitle !== "string" || !/^[A-Z]{3}$/.test(payload.currency || "") || !Array.isArray(payload.installments) || !payload.installments.length || typeof payload.terms !== "string") {
      throw new Error("The encrypted link does not contain a supported payment summary.");
    }
    if (!payload.installments.every((item) => item && typeof item.label === "string" && validHttpsUrl(item.url))) {
      throw new Error("A payment link in this summary is invalid. Contact Velvet Edge Travel for an updated summary.");
    }
    return payload;
  }

  function money(value, currency) {
    try {
      return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(Number(value));
    } catch {
      return `${currency} ${Number(value).toFixed(2)}`;
    }
  }

  function dateLabel(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "To be confirmed";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "To be confirmed";
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
  }

  function renderSummary(payload) {
    const quoteUrl = validHttpsUrl(payload.quoteUrl) ? `<br><a href="${encodeHtml(payload.quoteUrl)}" target="_blank" rel="noopener noreferrer">View your original travel quote</a>` : "";
    const destination = payload.destination ? `<br>${encodeHtml(payload.destination)}` : "";
    const originalQuotePrice = payload.originalQuotePerPerson ? `<br>Original quote per person: ${encodeHtml(money(payload.originalQuotePerPerson, payload.currency))}` : "";
    const rows = payload.installments.map((item) => `<tr><td><strong>${encodeHtml(item.label)}</strong></td><td>${encodeHtml(money(item.amount, payload.currency))}</td><td>${encodeHtml(dateLabel(item.dueDate))}</td><td>${encodeHtml(money(item.paid || "0", payload.currency))}${item.paidDate ? `<br><small>Received ${encodeHtml(dateLabel(item.paidDate))}</small>` : ""}</td><td><a href="${encodeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Open secure payment link</a></td></tr>`).join("");
    summary.innerHTML = `<p class="eyebrow">Quote ${encodeHtml(payload.quoteRef)}</p><h1>Hello, ${encodeHtml(payload.name)}</h1><p class="customer-intro">Your individual payment schedule for ${encodeHtml(payload.quoteTitle)}.</p><section class="quote-card"><strong>Velvet Edge Travel quote ${encodeHtml(payload.quoteRef)}</strong>${encodeHtml(payload.quoteTitle)}${destination}${originalQuotePrice}${quoteUrl}</section><section class="balance-card"><div><span>Agreed total</span><strong>${encodeHtml(money(payload.total, payload.currency))}</strong></div><div><span>Received</span><strong>${encodeHtml(money(payload.paid, payload.currency))}</strong></div><div><span>Outstanding</span><strong>${encodeHtml(money(payload.outstanding, payload.currency))}</strong></div></section><div class="payment-schedule-wrap"><table class="payment-schedule"><thead><tr><th>Instalment</th><th>Amount</th><th>Due date</th><th>Paid</th><th>Payment</th></tr></thead><tbody>${rows}</tbody></table></div><section class="terms-card"><strong>Booking, cancellation and refund terms</strong>${encodeHtml(payload.terms)}</section><p class="payment-safety">Use the secure payment link for the correct instalment. This summary does not collect card details. Your payment processor should provide a confirmation or receipt when payment is complete. Contact us if a detail does not match your quote.</p>`;
    summary.hidden = false;
    unlockCard.hidden = true;
    document.title = `Payment summary ${payload.quoteRef} | Velvet Edge Travel`;
    window.history.replaceState(null, "", window.location.pathname);
  }

  async function decryptSummary(passphrase) {
    const parts = window.location.hash.slice(1).split(".");
    if (parts.length !== 4 || parts[0] !== "vep1") throw new Error("This link is incomplete. Ask Velvet Edge Travel to send you a new one.");
    const salt = decodeBase64Url(parts[1]);
    const iv = decodeBase64Url(parts[2]);
    const ciphertext = decodeBase64Url(parts[3]);
    if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw new Error("This link is incomplete or damaged. Ask Velvet Edge Travel to send you a new one.");
    const key = await deriveKey(passphrase, salt);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return validatePayload(JSON.parse(decoder.decode(plaintext)));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!crypto.subtle) {
      status.textContent = "Secure viewing requires an up-to-date browser on an HTTPS connection.";
      return;
    }
    const button = form.querySelector("button");
    button.disabled = true;
    button.textContent = "Unlocking…";
    try {
      const payload = await decryptSummary(password.value);
      password.value = "";
      renderSummary(payload);
    } catch (error) {
      status.textContent = error.name === "OperationError" ? "That passphrase did not unlock this summary. Check it and try again." : error.message || "This summary could not be opened.";
    } finally {
      button.disabled = false;
      button.textContent = "View payment summary";
    }
  });

  if (!window.location.hash) status.textContent = "The encrypted part of this link is missing. Ask Velvet Edge Travel to send you the complete link.";
})();
