# Modern Era Plus V1.2.6 — Code Guide

## Purpose
This package retains the V1.2.5 website and adds a two-photo automatic slideshow
to the Home page's "Capability. Commitment. Confidence." section.
It also reformats all existing HTML, CSS, JavaScript, JSON and SVG source files
for maintainability, with no intentional change to their existing behavior.

## Website file structure
- `index.html` — Home page; includes the new Company photo slideshow.
- `about.html` — Company.
- `services.html` — Capabilities list.
- `service.html` — Individual capability details.
- `projects.html` — Projects.
- `technology.html` — ASOE technology.
- `hse.html` — HSE & Quality.
- `contact.html` — Contact.
- `404.html` — Not-found page.
- `style.css` — All site styles, responsive layouts and slideshow animation.
- `app.js` — Navigation, menus, galleries and normal site interactions.
- `viewer.js` — Three.js-based offshore-platform 3D viewer.
- `data/catalog.js` — Service and asset data (`window.MEP_DATA`).
- `data/asset-manifest.json` — Asset manifest.
- `assets/favicon.svg` — Site icon.
- `assets/models/offshore-platform.glb` — Original 3D model, not modified.
- `assets/images/` — Website photographs.
- `assets/images/home-company/onshore-facility.webp` — New copy of the
  original `assets/images/contact-us/02.webp` used by the Home slideshow.

## Home page slideshow
The markup is in `index.html`, inside `.split-visual` of the Company section.
The two photographs appear inside:
- `.company-slideshow`
- `.company-slideshow-track`
CSS in `style.css` uses `@keyframes company-photo-slide` for a 12-second
automatic repeating sequence: first image -> second image -> first image.
There are no previous/next buttons. Mobile and desktop both display the slider.
When a visitor requests reduced motion in their OS, the animation remains still.
The photo frame matches the original V1.2.5 dimensions at common viewport widths.
The Miri/Sarawak/Malaysia caption remains outside the moving picture track.

## Code formatting
- All nine HTML pages use structured line breaks and indentation.
- CSS rules and declarations are indented without reordering existing CSS rules:
  cascade/order is important.
- `app.js` and `viewer.js` use consistent indentation, braces and line breaks.
  Their parsed JavaScript syntax trees were checked to match V1.2.5.
- `data/catalog.js` and `data/asset-manifest.json` are expanded into
  readable structured data; catalogue content is unchanged.
- The favicon's SVG markup is formatted without changing the shapes.
- Existing shell and batch launcher scripts were already readable and unchanged.

## Deployment (GitHub Desktop)
1. Back up the repository folder if desired.
2. Extract the Update Only ZIP.
3. Copy the contents **inside** the extracted update folder into the root of
   the cloned `modern-era-plus-website` repository, preserving subfolders.
4. Allow Windows to replace the listed source files.
5. In GitHub Desktop, review changes, **Commit to main**, then **Push origin**.
6. Open the website and press **Ctrl + F5** if the old CSS is cached.

Do not delete the Contact image. The original `contact-us/02.webp`
must remain in place. The big original GLB, video, PDFs and existing site media
need not be re-uploaded when using the Update Only package.

## Verification notes
- Both photos were found inside the supplied V1.2.5 ZIP.
- CSS slideshow preview was verified on desktop and mobile.
- Original CSS rules and ordering were compared structurally and preserved.
- JavaScript syntax trees for `app.js` and `viewer.js` match the originals.
- Desktop navigation and mobile navigation were checked in a browser test.
- Full GPU-powered 3D rendering is not verifiable in this environment; the
  3D viewer's logic and GLB assets were preserved.
