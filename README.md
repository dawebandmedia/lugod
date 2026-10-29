# LUGOD Catering & Events Management website

A fast, static website. No build step or server code is needed to publish it.

## Publish

Upload the contents of this folder (everything next to `index.html`) to any static host: Netlify, Vercel, Cloudflare Pages, GitHub Pages, or a regular web host. Open `index.html` to start.

To preview on your computer, run a local server in this folder, for example `python -m http.server`, then open http://localhost:8000. Double-clicking the HTML files also works, though some browsers limit features on `file://` pages.

## Settings you can change

`assets/js/config.js`

| Setting | What it does |
| --- | --- |
| `formEndpoint` | Empty by default. People then send their request by email, Messenger, Viber or SMS, with all their details filled in. Paste a form-inbox URL (e.g. from Formspree) to receive requests directly; the site shows "sent" only after that service confirms it got the request. |
| `messenger`, `email`, `phone`, `viber` | Where requests and quick-contact buttons go. |
| `smoothScroll` | Smooth mouse-wheel scrolling on desktop. Set to `false` to use the browser's normal scrolling. |

## Prices: keep them current

The site shows **one price only**: the Fun Kiddie Birthday Package at **₱99,000 for 100 pax**, labelled "as posted by LUGOD on Instagram on 14 June 2026". Everything else says "priced by quote" or "ask for today's list".

If the rate changes, search the HTML files for `99,000` and `14 June 2026` (in `index.html`, `celebrations.html` and `faq.html`) and update both. To remove the price entirely, delete the `<div class="price">` block in those files.

## Content sources

All photos, the menu, tray names, the package inclusions, contact details and the review come from LUGOD's public Facebook (facebook.com/LUGODEVENTS) and Instagram (@lugodcateringservices) pages, as of October 2026. Photos keep LUGOD's watermark. Please confirm with LUGOD before launch:

- that the celebrant names visible on backdrops, and photos with guests, may be shown publicly;
- that the Facebook review by Me'Anne S. may be quoted;
- the current package rate, delivery area and opening hours (hours are not shown anywhere on the site yet).

## What's inside

- `index.html`: home, with the photo deck, the two doors (celebrations or food), the real-event stories, the package, a menu preview, booking steps and the review
- `celebrations.html`: the package in detail, other occasions, extras
- `menu.html`: all 36 dishes, with search and group filters
- `trays-and-bento.html`, `real-celebrations.html` (filterable gallery with a photo viewer), `about.html`, `faq.html`, `contact.html` (request form), `privacy.html`, `404.html`
- `assets/css/main.css`: all styles
- `assets/js/main.js`: all motion and interactions, with no libraries. It respects "reduce motion" settings, and every page still works without JavaScript.
- `assets/img/`: responsive WebP images with JPEG fallbacks

The `_source` folder in the download has the templates, content data and image scripts used to generate these pages (Python with Jinja2), in case you'd rather edit there and rebuild.
