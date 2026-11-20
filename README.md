# ML portfolio

A one-screen portfolio: project cards orbit a "Contact me" orb. Plain HTML, CSS and JS. There is no build step and nothing to install.

```
index.html    page shell
styles.css    all styling
main.js       orbit layout, tilt, panels, URL hash routing
projects.js   ALL content: window.SITE and window.PROJECTS
```

## Run locally

Open `index.html` in a browser by double-clicking it. Content is loaded with a plain `<script>`, so `file://` works.

Or serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

Dev check for crowded layouts: http://localhost:8000/?demo=16 duplicates the example projects to 16 cards.

## Add a project

1. Open `projects.js`.
2. Copy one object in `window.PROJECTS` and paste it where you want the card in the list.
3. Change the fields:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | URL-safe, unique. Used in links: `#my-project`, `#my-project/report`. |
| `name` | yes | Shown on the card and panel. |
| `glyph` | no | One or two characters, shown in monospace (e.g. `⌫`, `§`, `◇`). |
| `color` | no | Accent colour. Palette: coral `#FF7A59`, teal `#2DD4BF`, violet `#A78BFA`, blue `#60A5FA`, amber `#FBBF24`, pink `#F472B6`, lime `#A3E635`. |
| `accent2` | no | Colour for the second key number. White if left out. |
| `kind` | no | e.g. "LLM fine-tuning". |
| `status` | no | `running`, `planned`, `idea` or `done`. |
| `problem` | no | One paragraph. |
| `kpis` | no | Up to 3 `{ value, label }`. The first is shown in the accent colour. Fewer are fine. |
| `conclusion` | no | One or two sentences. Shown in an accent-tinted box. |
| `stack` | no | List of strings, shown as tags. |
| `report` | no | List of blocks (below). If left out, there is no "Read full report" button. |

4. Save and reload. Cards are placed automatically: one ring, or two rings with smaller cards when there are many.

Text fields support `**bold**`, `` `code` `` and `[links](https://example.com)`.

### Report blocks

```js
{ type: "heading", text: "Results" }
{ type: "text", text: "Paragraph. Blank lines split paragraphs." }
{ type: "list", items: ["a", "b"], ordered: false }
{ type: "kpis", items: [{ value: "[X]%", label: "accuracy" }] }
{ type: "table", columns: ["Method", "Acc"], rows: [["Baseline", "[X]%"]], highlight: 0 }  // highlight = row index
{ type: "image", src: "images/plot.png", alt: "…", caption: "Figure 1. …" }  // no src = placeholder box
{ type: "tokenSample", label: "Sample", text: "The capital is ~~Sydney~~ ⟨bs:3⟩ Canberra" }
{ type: "code", lang: "python", code: "print('hi')" }
{ type: "callout", label: "Verdict", text: "…" }
```

In `tokenSample`, `~~text~~` is struck through (retracted) and `⟨…⟩` is shown as a highlighted token.

Put images in a folder such as `images/` next to `index.html` and use relative paths.

### Contact details

Edit `window.SITE` at the top of `projects.js`: `name`, `email`, `github`, `linkedin`. Empty values are hidden.

### Tuning motion

At the top of `main.js`: `ORBIT_SPEED` (set it to `0` to stop the drift), `BOB_AMP`, `TILT_MAX`. All motion turns off when the visitor's system asks for reduced motion.

## Publish on GitHub Pages

1. Create a repository on GitHub, for example `portfolio` (or `<username>.github.io` to serve it at the root of your domain).
2. Push these files to the `main` branch, with `index.html` at the top level:
   ```bash
   git init
   git add .
   git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then pick branch `main` and folder `/ (root)`, and click Save.
4. After a minute the site is live at `https://<username>.github.io/<repo>/`.

To update the site later, edit `projects.js`, commit and push.
