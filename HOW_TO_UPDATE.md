# How to Update This Portfolio

## Adding a New Project

Open `data/projects.json` and add a new object to the `"projects"` array:

```json
{
  "id": "proj-007",
  "title": "Your Project Title",
  "category": ["character"],
  "year": 2025,
  "description": "Full description of the project shown in the modal.",
  "shortDescription": "One-line summary shown on the card.",
  "thumbnail": "assets/projects/your-thumbnail.jpg",
  "media": {
    "type": "video",
    "url": "https://player.vimeo.com/video/YOUR_VIMEO_ID"
  },
  "tools": ["After Effects", "Illustrator"],
  "featured": false,
  "client": "Personal Project",
  "duration": "1:30 min"
}
```

**Valid categories:** `character`, `motion`, `2d`, `3d`, `experimental`

**Featured projects** span 2 columns — use `"featured": true` for your best 1-3 pieces.

---

## Adding a Thumbnail Image

1. Prepare the image: 1920x1080px (16:9), JPG format, under 500KB
2. Place it in `assets/projects/`
3. Reference it in `projects.json` as `"thumbnail": "assets/projects/filename.jpg"`

---

## Updating Your Info

All personal info (name, bio, email, skills, social links) is in `data/projects.json` under the `"animator"` key.

---

## Updating Social Links

In `data/projects.json`, find `"social"` and replace the placeholder URLs:

```json
"social": {
  "linkedin": "https://linkedin.com/in/YOUR_USERNAME",
  "vimeo": "https://vimeo.com/YOUR_USERNAME",
  "instagram": "https://instagram.com/YOUR_USERNAME",
  "artstation": "https://artstation.com/YOUR_USERNAME"
}
```

---

## Deploying to Netlify (Recommended — Free)

1. Create a free account at [netlify.com](https://netlify.com)
2. Drag and drop the entire `Portafolio` folder onto the Netlify deploy area
3. Done — you get a live URL instantly

To update later: drag and drop again, or connect to GitHub for automatic deploys.

---

## Deploying to GitHub Pages (Free)

1. Create a GitHub repository (e.g., `sofia-porras-portfolio`)
2. Upload all files to the repository
3. Go to Settings > Pages > Source: select `main` branch > root folder
4. Your site will be live at `https://USERNAME.github.io/REPO_NAME`

---

## Adding a Resume PDF

1. Name your resume `resume.pdf`
2. Place it in the `assets/` folder
3. The "Download Resume" button will automatically link to it
