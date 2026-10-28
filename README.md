## October 2026 website update

See [WEBSITE-UPDATE.md](WEBSITE-UPDATE.md) for the new holiday finder, enquiry delivery options, verification and publishing instructions. The default enquiry flow opens an email to bookings@velvetedgetravel.com and offers a downloadable brief; direct website delivery needs a verified form-service endpoint.

# Velvet Edge Travel

A responsive, multi-page luxury travel website built with plain HTML, CSS and JavaScript. It can be hosted directly on GitHub Pages without a build step.

## Pages

- `index.html` - Home
- `about.html` - About
- `contact.html` - Contact and travel enquiry
- `signature-holidays.html` - Signature holidays
- `golf-packages.html` - Golf packages
- `destinations.html` - Destinations
- `quote-template.html` - Agent quote builder form
- `quote-builder.js` - Quote builder and HTML generator
- `payment-dashboard.html` - Browser-local staff payment tracker
- `payment-summary.html` - Passphrase-unlocked customer payment summary
- `velvet-edge-logo-v3.svg` - Header and footer logo

## Publish with GitHub Pages

1. Create a GitHub repository and upload all files in this folder to its root.
2. Open the repository's **Settings**, then **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.

GitHub will display the public website URL after deployment completes.

## Create a client quote

1. Open `quote-template.html` through your GitHub Pages website.
2. Complete the form and add the required itinerary, accommodation and golf entries.
3. Use **Preview quote**, then **Download HTML file**.
4. Upload the downloaded quote file beside the other website files.
5. Send the client the link displayed by the builder.
6. Use **Save editable draft** to retain a JSON copy that can be loaded later for updates.

Downloaded quotes contain an embedded snapshot of the website styling, logo and print behavior, so they retain the complete design when opened outside the repository.

GitHub Pages is public hosting. A hard-to-guess URL and `noindex` tag reduce casual discovery but do not provide access control. Do not include passport details, dates of birth, payment information or other sensitive personal data. Use authenticated hosting for confidential proposals.

## Before publishing

- Confirm the contact details and existing service claims before publishing. The local demonstration address has been removed.
- Replace or self-host the remote Unsplash imagery if required.
- For direct form delivery, configure and test the endpoint described in WEBSITE-UPDATE.md. The demonstration confirmation has been replaced with an explicit email-app workflow.
- Add real privacy, terms and booking-condition pages and update the footer links.
- Replace the placeholder Instagram link.

## Payment tracker

`payment-dashboard.html` is a browser-only payment tracker and is not linked from the public site navigation. It can be published with the static site and opened over HTTPS to create customer links. Its records stay in readable browser storage on the current device and do not sync or reach the server. It stores only the traveller name, quote reference, payment plan, Revolut checkout URLs, cumulative amounts received, optional transaction references and private adjustment notes. It does not connect to Revolut Business, collect traveller identity details or store card data; verify receipts in Revolut and update the tracker manually. There is no staff sign-in; anyone who can use the same browser profile may be able to view records. Use a device and browser profile protected by your own sign-in. This version suits one trusted operator and browser, not shared team access.

Select **Import a quote** and choose the sent quote HTML or editable JSON draft from the quote builder. The tracker imports the reference, title, currency, per-person quote amount, terms and published quote URL where present. The quoted per-person amount prefills the traveller’s agreed total when it can be read; that total remains editable. Enter each traveller’s actual amount and payment split, which must add up to the agreed total. Each record and customer summary carries the quote reference. If several quotes are being tracked, select the right quote for each traveller.

After entering a traveller’s agreed total, instalments, due dates, Revolut payment links and confirmed terms, choose **Create customer link**. The page encrypts that one traveller’s snapshot in the link fragment using Web Crypto; the fragment is processed by the browser and is not sent in the page request. The traveller needs the passphrase, which you must send separately. The link requires HTTPS, does not expire or support revocation, and shows the figures as they were when it was created. Create a fresh link after changes and tell the traveller to disregard older copies. Internal adjustment notes, transaction references and other travellers are excluded. A downloaded HTML summary is also available.

On an existing traveller, edit the agreed total, each instalment amount and the cumulative amount received after checking Revolut Business. The instalments must still add up to the agreed total and each received amount must be within its instalment. If you change payment figures, add an internal reason; the tracker logs the date, reason and before/after totals and amount paid. This is a manual adjustment record, not an automatic Revolut transaction feed.

Do not commit traveller records, exported summaries, encrypted links or passphrases to the Git repository. Verify every HTTPS payment URL, amount, currency and due date before sharing. For revocable links, real sign-in, or shared team records, move the dashboard data to an authenticated backend before using those workflows.

## Local preview

Open `index.html` directly, or start any static web server in this directory. For example:

```sh
npx serve .
```
