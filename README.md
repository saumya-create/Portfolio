# Saumya Mishra — Designer Portfolio

Personal portfolio of **Saumya Mishra**, a UI/UX designer crafting intuitive digital experiences for AI-powered products and web applications.

---

## Sections

- **Home** — hero with an animated laptop reveal.
- **About Me** — scroll-driven media expansion.
- **Experience** — horizontal, scroll-linked timeline (Foundation & Journey).
- **Things I Have Designed** — six exploration cards with a 3D flip interaction.
- **Project Highlights** — sticky stacking cards of featured projects, each linking to its live site or Figma file.
- **Case Studies** — in-depth write-ups that open in a new tab.
- **Let's Talk** — LinkedIn and email contact.

## Tech

- HTML, Tailwind CSS (CDN) and vanilla JavaScript (ES modules)
- GSAP + ScrollTrigger for the Exploration section pin and parallax
- Plus Jakarta Sans from Google Fonts

## Project structure

```
├── index.html               # Page layout, styles and inline scripts
├── experience-section.js    # Horizontal experience timeline
├── scroll-expand-media.js   # About section scroll expansion
├── project-stack.js         # Project Highlights stacking cards and their project data
├── assets/                  # About imagery, case-study thumbnails
└── Project Images/          # Project screenshots
```

## Run locally

The site is static. Serve the folder with any local HTTP server (ES modules need one):

```bash
npm run dev      # npx http-server on http://localhost:8080
# or
python -m http.server 8080
```

## Deploy

Upload the folder to any static host (Netlify, Vercel, GitHub Pages) with the publish directory set to the project root.

## Contact

- **LinkedIn:** [saumya-mishra](https://www.linkedin.com/in/saumya-mishra-23472224a)
- **Email:** [saumyaaam@gmail.com](mailto:saumyaaam@gmail.com)
