# Velvet Edge Travel language support

The public site now has an accessible language selector in the global header for English, French, German, Spanish and Italian. The chosen language is retained in the visitor's browser with `localStorage`; it applies to every public page on the next page visit.

## Translated now

- Global navigation, footer navigation, common calls to action, saved-journey actions and key accessibility labels.
- Core journey discovery and enquiry interface labels.
- Key landing-page, about, destination, golf, signature collection and enquiry-page headings.

## Content still authored in English

- Long-form editorial paragraphs, destination and itinerary descriptions, legal/privacy-policy body text, and holiday records in `holidays-data.js`.
- Dynamically created email, downloaded enquiry and quote text.
- The separate internal quote and ticket templates are intentionally excluded, as they are operational documents rather than public site pages.

Before presenting fully localised campaigns, have a native-speaking travel editor translate and review this remaining customer-facing copy. The shared `i18n.js` catalogue is the central place for additional reusable interface translations.
