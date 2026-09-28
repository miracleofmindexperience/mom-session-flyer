# MoM Session Flyer Maker

A web page for Miracle of Mind session coordinators. Pick an audience (Corporate, Medical, Student, Community) and an event name, add the session details, and download a ready-to-share flyer.

The flyer designs are the PR team's approved Canva templates (from the *MoM Sessions One Pager*). The page redraws only the white "Session details" strip at the bottom: a session card (one or two sessions, date, time, duration, location), an optional RSVP/registration QR inside the card, an optional note, the Miracle of Mind logo with a "Get the app" QR (can be hidden), and an optional navy contact band (link, phone, email).

Plain HTML/CSS/JS. No framework, no build step.

## Run it locally

The page uses JavaScript modules, so it has to be served:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish

GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.

**Before each push, run `scripts/bump-version.sh`.** It raises the `?v=N` tag on every file in `index.html`, so visitors load the new files together instead of mixing them with cached old ones. If you add a new file under `js/`, add it to the import map in `index.html`.

## Where to change things

| I want to change… | Edit |
|---|---|
| Event names, which template each audience uses | `js/config.js` → `EVENTS` |
| Audiences | `js/config.js` → `AUDIENCES` |
| Add a new flyer design | Export page as PNG from Canva, save as JPG in `templates/`, add it to `EVENTS` |
| Where things sit in the details strip | `js/config.js` → `LAYOUT` |
| Text sizes inside the session card | `js/config.js` → `CARD_TEXT` |
| App download link ("Get the app" QR) | `js/config.js` → `APP_URL` |
| Colors, fonts, labels ("SESSION DETAILS", "RSVP", "GET THE APP") | `js/config.js` → `COLORS`, `FONTS`, `TEXT` |
| The example details a new visitor sees | `js/config.js` → `DEFAULTS` |
| Form fields and page text | `index.html` |
| How the details are laid out | `js/flyer.js` |

### Adding a template

All current templates are 1545 × 2000 px (Canva's US Letter PNG export) and share the same details area, so `LAYOUT` works for all of them. A new template with the same white strip and logo position needs no layout changes. The page repaints the whole strip, so any placeholder text there doesn't matter.

## Project layout

```
index.html          page markup
css/styles.css      page styles (light + dark)
js/config.js        audiences, events, template mapping, layout, text
js/state.js         saved draft, audience/event helpers, link check
js/flyer.js         draws the template and the session details
js/lib/canvas.js    canvas helpers (text wrapping and fitting, QR)
js/app.js           connects the form, preview and download
templates/          the Canva flyer designs (JPG)
vendor/qrcode.js    qrcode-generator 1.4.4 (MIT, Kazuhiko Arase)
scripts/bump-version.sh  raises the cache version tag before a release
```
