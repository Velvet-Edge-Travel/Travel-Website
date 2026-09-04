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

- Replace the demonstration contact details and Mayfair address with the company's real information.
- Replace or self-host the remote Unsplash imagery if required.
- Connect the contact form to Formspree, Netlify Forms or a custom backend. It currently displays a demonstration confirmation and does not transmit data.
- Add real privacy, terms and booking-condition pages and update the footer links.
- Replace the placeholder Instagram link.

## Local preview

Open `index.html` directly, or start any static web server in this directory. For example:

```sh
npx serve .
```
