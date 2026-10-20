# Velvet Edge Travel — client experience update

Prepared 20 October 2026 for https://github.com/Velvet-Edge-Travel/Travel-Website.

## What changed

- Added `holidays.html`: all ten existing journeys, text search, region/style/duration filters, sorting, saved-only view and helpful empty results.
- Added `holiday.html?id=…`: specific holiday details, tailored quotation messaging, related journeys and an enquiry carrying the selected holiday.
- Added saved journeys on the visitor's device. Only journey IDs are stored; names and enquiry data are not stored in localStorage.
- Added a three-step enquiry: trip preferences, contact details, then review. Golf preferences are optional and shown only for golf enquiries.
- Replaced the demonstration confirmation that discarded form data. The default delivery option opens the visitor's email app addressed to bookings@velvetedgetravel.com. Visitors must press Send in that app. A text download is available as an alternative.
- Added mobile layouts, keyboard navigation, focus indicators, reduced-motion support, FAQs and direct contact options.
- Preserved the quote and ticket builders. Their files were not edited.
- Retained existing destination descriptions. All public prices and price sorting have been removed; every journey is enquiry-led and individually quoted.
- Incorporated the newer contact telephone and email from GitHub. Removed the local demonstration street address and replaced the home-page testimonial with practical FAQs.

## Preview

Open `index.html` in a browser, or run a local static server in this folder and open its address. The interactive pages have no build step.

Useful pages:

- `holidays.html`
- `holidays.html?style=Golf`
- `holidays.html?saved=1`
- `holiday.html?id=algarve-golf`
- `contact.html?holiday=algarve-golf#enquiry`

## Enquiry delivery

`site-config.js` contains public settings:

```js
window.VELVET_CONFIG = {
  enquiryEndpoint: "",
  enquiryEmail: "bookings@velvetedgetravel.com"
};
```

With an empty endpoint, the form prepares an email and clearly says the website has not sent it. This works without a backend but depends on the visitor having a configured email app. They can also download the brief or use the displayed telephone/email.

For direct website submission:

1. Configure a form service under the business's account, with bookings@velvetedgetravel.com as the verified destination.
2. Obtain its public HTTPS submission endpoint. It must accept JSON POSTs from this website, support CORS, and return a non-2xx response on rejected submissions.
3. Put that URL in `enquiryEndpoint`. Do not put a private API key in this public file.
4. Enable the provider's spam/rate protection and configure allowed domains where supported.
5. Update the enquiry information and approved privacy notice to reflect the actual provider and handling of information.
6. Test successful delivery to the mailbox and failure behaviour on a staging site. Only after receipt is confirmed should direct delivery be considered ready.

The direct-submission path includes a sending state, duplicate-submit protection, a 20-second timeout and an error that retains entered details. It has not been tested against a real provider because no provider has been connected.

## Publish the update

The supplied update ZIP contains only the public website files needed for this update and this handover. It excludes unrelated projects, backups, customer quotations and test data.

Upload its contents to the root of the existing repository, preserving the repository's other files, custom-domain CNAME and Pages configuration. The new HTML, JS and CSS files must be uploaded together. Do not replace the whole repository with only the ZIP contents.

This local folder has no `.git` directory. No commit, push or deployment was made during this update.

Before publishing, confirm the images and existing service claims. Replace the former placeholder legal footer with the business's approved privacy notice and booking conditions when those documents are available; the new enquiry information section is explanatory copy, not a complete legal policy.

## Maintaining the collection

`holidays-data.js` is the source for the interactive finder and detail pages. Each journey has a stable ID, title, destination, region, style, duration, description and image. Prices are intentionally excluded. There is no live supplier inventory.

The original signature and golf pages are editorial pages and are not generated from that file. Keep their descriptions consistent when updating the catalogue. Existing holiday IDs should stay stable so shared links remain valid.

## Backup and verification

A backup of the edited original files was saved outside this folder under the Codex workspace, in `outputs/velvet-before-ux`.

Browser checks covered the catalogue, golf filtering and duration sorting, save state across pages, individual trip details, selected-trip enquiry prefill, progression to review and phone-width layouts. Static checks cover local links, catalogue identifiers and JavaScript syntax. No real enquiry was sent during testing.

## Enquiry-only update

All public prices, price sorting and preset budget amounts have been removed. The optional budget field is free text. Private agent quote and ticket tools are unchanged so you can still prepare bespoke client quotations.
