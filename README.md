# Integrated IT Solution Website

Modern, mobile-first marketing and commerce experience for **Integrated IT Solution**. Built with semantic HTML5, Tailwind CSS (via CDN), and vanilla JavaScript for dynamic behaviour.

## Features

- Responsive layout with WCAG 2.1 AA-conscious components.
- Hardware catalogue fed by `data/products.json` with category filtering, sorting, and pagination.
- Product detail template with spec table, sticky buy bar, schema markup, and related items.
- Persistent cart stored in `localStorage`, mini-cart drawer, and toast notifications.
- Marketing surfaces: hero, solutions grid, USPs, newsletter modal, cookie notice, and newsletter form validation.
- SEO enhancements: canonical tags, Open Graph metadata, JSON-LD for category and product pages, sitemap, and robots directives.

## Project Structure

```
├── index.html
├── category.html
├── product.html
├── about.html
├── contact.html
├── terms.html
├── returns.html
├── sitemap.xml
├── robots.txt
├── data/
│   └── products.json
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── assets/
    └── favicon.svg
```

## Local Development

1. Clone the repository and open the directory in your editor.
2. Serve the site with any static web server to ensure `fetch` calls for JSON work correctly. Examples:
   - Python: `python -m http.server 8000`
   - Node: `npx serve .`
3. Visit the served URL (e.g., `http://localhost:8000/index.html`). Navigation between templates uses query parameters (e.g., `category.html?slug=laptops`, `product.html?slug=hp-probook-450-g9`).

## Replacing Seed Data

- All catalogue content lives in `data/products.json`.
- Each category requires `id`, `name`, descriptive copy, and a hero image object.
- Products reference their category via `categoryId` and include pricing, condition badge, specs, warranty text, and image data.
- Add or update products by editing the JSON file; the UI automatically renders new entries after reload.
- If moving to a headless CMS or API, update `DATA_URL` inside `js/app.js` to point to the new endpoint. Ensure the response schema matches the existing shape or adapt the mapping functions accordingly.

## Deployment

The site is static and can be hosted on platforms like Vercel, Netlify, GitHub Pages, AWS S3 + CloudFront, etc.

1. Build/optimise assets if needed (e.g., download and self-host frequently used imagery).
2. Upload repository contents to your hosting provider.
3. Configure redirects or rewrites so `/categories/<slug>` and `/product/<slug>` map to `category.html` and `product.html` if you need pretty URLs.
4. Ensure HTTPS is enabled and update `sitemap.xml` and canonical URLs to match the production domain.

## Accessibility & Performance Notes

- Tailwind utility classes combined with custom CSS variables keep the experience lightweight while retaining design tokens.
- Images include `width`, `height`, and `loading="lazy"` for LCP improvements.
- Focus states, skip-links, semantic landmarks, and ARIA attributes support keyboard and assistive technologies.
- JavaScript is modular and only initialises features present on each page.

## Browser Support

Tested on modern evergreen browsers (Chrome, Edge, Firefox, Safari). For legacy support, include appropriate polyfills if required.
