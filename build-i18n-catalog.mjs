import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const pages = [
  "index.html", "about.html", "contact.html", "destinations.html",
  "golf-packages.html", "holiday.html", "holidays.html", "privacy.html",
  "signature-holidays.html",
];
const locales = ["en", "fr", "de", "es", "it"];
const decode = value => value
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\s+/g, " ").trim();
const isCopy = value => value && !/^(?:[©→·*]|\d+[\d./-]*)$/.test(value);

const existingCatalog = {};
for (const locale of locales) {
  try {
    existingCatalog[locale] = JSON.parse(await readFile(join(root, "locales", `${locale}.json`), "utf8"));
  } catch {
    existingCatalog[locale] = {};
  }
}
const catalog = Object.fromEntries(locales.map(locale => [locale, {}]));
for (const page of pages) {
  let html = await readFile(join(root, page), "utf8");
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  const values = [];
  for (const match of html.matchAll(/>([^<>]+)</g)) {
    const value = decode(match[1]);
    if (isCopy(value)) values.push(value);
  }
  for (const match of html.matchAll(/\b(?:aria-label|placeholder|title|content)="([^"]+)"/gi)) {
    const value = decode(match[1]);
    if (isCopy(value)) values.push(value);
  }
  [...new Set(values)].forEach((value, index) => {
    const key = `${page.replace(/\.html$/, "")}.${String(index + 1).padStart(3, "0")}`;
    catalog.en[key] = value;
    locales.slice(1).forEach(locale => { catalog[locale][key] = existingCatalog[locale][key] || ""; });
  });
}

await mkdir(join(root, "locales"), { recursive: true });
for (const locale of locales) {
  await writeFile(join(root, "locales", `${locale}.json`), `${JSON.stringify(catalog[locale], null, 2)}\n`);
}

const browserCatalog = `window.VELVET_I18N_CATALOG = ${JSON.stringify(catalog)};\n`;
await writeFile(join(root, "i18n-catalog.js"), browserCatalog);
console.log(`Generated ${Object.keys(catalog.en).length} source keys for ${pages.length} public pages.`);
