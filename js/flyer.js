/*
 * Draws a flyer: the chosen Canva template as the background, with its white
 * "Session details" strip repainted in this layout (top to bottom):
 *
 *   SESSION DETAILS ─────────────────────────   [logo]
 *   ┌ session card ─────────────────┬ RSVP ┐    [app QR]
 *   │ Session 1 | Session 2 columns │  QR  │    GET THE APP
 *   └───────────────────────────────┴──────┘
 *   italic note
 *   ████ contact band ████████████████████████████████
 *
 * The card's content is a list of columns (plus an optional full-width
 * footer), each a list of items (label, date, time, divider, venue, address).
 * Everything inside the card scales together: it shrinks until it fits, and
 * a sparse card grows a little (up to maxScale) to fill the space.
 */
import { LAYOUT as L, CARD_TEXT as T, COLORS as C, FONTS, TEXT, TEMPLATE_DIR, APP_URL } from "./config.js";
import { templateName, rsvpUrl } from "./state.js";
import { roundRect, spacedText, spacedWidth, wrapText, fitFont, drawQR } from "./lib/canvas.js";

const F = FONTS.family;
const font = (ctx, weight, size, italic) => { ctx.font = (italic ? "italic " : "") + weight + " " + size + "px " + F; };

/* ---------- template images (loaded once each) ---------- */
const images = {};
function loadTemplate(name) {
  if (!images[name]) {
    images[name] = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = TEMPLATE_DIR + name + ".jpg";
    });
  }
  return images[name];
}

/* ---------- icons (drawn at text height h, left edge x, middle y) ---------- */
function clockIcon(ctx, x, y, h) {
  const r = h * 0.36;
  ctx.strokeStyle = C.red; ctx.lineWidth = Math.max(2, h * 0.09); ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(x + r, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + r, y - r * 0.55); ctx.lineTo(x + r, y); ctx.lineTo(x + r + r * 0.45, y + r * 0.3); ctx.stroke();
}

function pinIcon(ctx, x, y, h) {
  const r = h * 0.3, cx = x + h * 0.36, cy = y - h * 0.1;
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.85, Math.PI * 0.15);
  ctx.lineTo(cx, cy + h * 0.5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.panel;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2); ctx.fill();
}

/* ---------- card content ---------- */
const shortDuration = d => d.trim().replace(/\bminutes?\b/i, "min").replace(/\bhours?\b/i, "hr");

function sessionItems(label, s, duration) {
  const time = [s.time.trim(), shortDuration(duration)].filter(Boolean).join(" · ");
  return [
    { type: "label", text: label },
    s.date.trim() && { type: "date", text: s.date.trim() },
    time && { type: "time", text: time }
  ].filter(Boolean);
}

/* Venue (bold) then address lines; the first line carries the pin icon. */
function locationItems(loc) {
  const lines = [
    loc.venue.trim() && { type: "venue", text: loc.venue.trim() },
    ...loc.address.split("\n").map(t => t.trim()).filter(Boolean).map(text => ({ type: "address", text }))
  ].filter(Boolean);
  if (lines.length) lines[0].pin = true;
  return lines;
}

/* { cols: [items...], footer: items } for the form's choices. */
function buildCard(state) {
  const d = state.duration, loc1 = locationItems(state.location);
  const divider = { type: "divider" };
  if (!state.second) {
    const when = sessionItems(TEXT.session(0), state.s1, d);
    if (!loc1.length) return { cols: [when], footer: [] };
    return { cols: [when, [{ type: "label", text: TEXT.location }, ...loc1]], footer: [] };
  }
  const s1 = sessionItems(TEXT.session(1), state.s1, d), s2 = sessionItems(TEXT.session(2), state.s2, d);
  if (state.sameLocation) return { cols: [s1, s2], footer: loc1.length ? [divider, ...loc1] : [] };
  const loc2 = locationItems(state.location2);
  return { cols: [[...s1, ...(loc1.length ? [divider, ...loc1] : [])], [...s2, ...(loc2.length ? [divider, ...loc2] : [])]], footer: [] };
}

/* ---------- measuring + drawing items ---------- */
/* Each item is measured and drawn by the same function; draw=false only measures. */
function item(ctx, it, x, y, width, k, draw) {
  const indent = T.iconIndent * k;
  switch (it.type) {
    case "label": {
      const t = T.label;
      if (draw) {
        font(ctx, 800, t.size * k); ctx.fillStyle = C.label; ctx.textBaseline = "middle";
        spacedText(ctx, it.text, x, y + t.height * k / 2, t.spacing * k);
      }
      return (t.height + t.after) * k;
    }
    case "date": {
      const t = T.date;
      font(ctx, 700, t.size * k);
      const lines = wrapText(ctx, it.text, width);
      if (draw) {
        ctx.fillStyle = C.navy; ctx.textBaseline = "middle";
        lines.forEach((ln, i) => ctx.fillText(ln, x, y + (i + 0.5) * t.height * k));
      }
      return (lines.length * t.height + t.after) * k;
    }
    case "time": {
      const t = T.line;
      font(ctx, 400, t.size * k);
      const lines = wrapText(ctx, it.text, width - indent);
      if (draw) {
        clockIcon(ctx, x, y + t.height * k / 2, t.size * k);
        ctx.fillStyle = C.text; ctx.textBaseline = "middle";
        lines.forEach((ln, i) => ctx.fillText(ln, x + indent, y + (i + 0.5) * t.height * k));
      }
      return lines.length * t.height * k;
    }
    case "divider": {
      const t = T.divider;
      if (draw) { ctx.fillStyle = C.rule; ctx.fillRect(x, y + t.before * k, width, 2); }
      return (t.before + t.after) * k + 2;
    }
    case "venue":
    case "address": {
      const t = T[it.type], bold = it.type === "venue";
      font(ctx, bold ? 700 : 400, t.size * k);
      const lines = wrapText(ctx, it.text, width - indent);
      if (draw) {
        if (it.pin) pinIcon(ctx, x, y + t.height * k / 2, t.size * k);
        ctx.fillStyle = bold ? C.navy : C.gray; ctx.textBaseline = "middle";
        lines.forEach((ln, i) => ctx.fillText(ln, x + indent, y + (i + 0.5) * t.height * k));
      }
      return lines.length * t.height * k;
    }
  }
  return 0;
}

function column(ctx, items, x, y, width, k, draw) {
  let h = 0;
  items.forEach(it => { h += item(ctx, it, x, y + h, width, k, draw); });
  return h;
}

/* Height of the card's content (or draws it). */
function cardContent(ctx, card, x, y, width, k, draw) {
  const gap = L.card.colGap;
  const colW = card.cols.length > 1 ? (width - gap) / 2 : width;
  const colsH = Math.max(...card.cols.map((c, i) => column(ctx, c, x + i * (colW + gap), y, colW, k, draw)));
  return colsH + column(ctx, card.footer, x, y + colsH, width, k, draw);
}

/* ---------- sections ---------- */
function drawHeader(ctx) {
  const h = L.header;
  font(ctx, 800, h.size); ctx.fillStyle = C.red; ctx.textBaseline = "middle";
  const w = spacedText(ctx, TEXT.header, L.left, h.y, h.spacing);
  ctx.fillStyle = C.rule; ctx.fillRect(L.left + w + 22, h.y - 1, L.contentRight - (L.left + w + 22), 2);
}

function drawRsvp(ctx, url, x, top, height, second) {
  const r = L.rsvp, cx = x + r.width / 2;
  const caption = TEXT.rsvpCaption(second);
  const blockH = 26 + 14 + r.tile + 16 + caption.length * 24;
  let y = top + (height - blockH) / 2;
  font(ctx, 800, 21); ctx.fillStyle = C.red; ctx.textBaseline = "middle";
  spacedText(ctx, TEXT.rsvp, cx, y + 13, 4, "center");
  y += 26 + 14;
  ctx.fillStyle = C.white; roundRect(ctx, cx - r.tile / 2, y, r.tile, r.tile, 14); ctx.fill();
  drawQR(ctx, url, cx - r.qr / 2, y + (r.tile - r.qr) / 2, r.qr, C.navy);
  y += r.tile + 16;
  font(ctx, 700, 19); ctx.fillStyle = C.navy; ctx.textAlign = "center";
  caption.forEach((ln, i) => ctx.fillText(ln, cx, y + 12 + i * 24));
  ctx.textAlign = "left";
}

function drawLogoAndApp(ctx, img, showApp) {
  const g = L.logo, s = g.src, h = g.width * s.h / s.w;
  ctx.drawImage(img, s.x, s.y, s.w, s.h, g.cx - g.width / 2, g.top, g.width, h);
  if (!showApp) return;
  const a = L.app;
  drawQR(ctx, APP_URL, g.cx - a.size / 2, a.top, a.size, C.red);
  font(ctx, 800, a.labelSize); ctx.fillStyle = C.red; ctx.textBaseline = "top";
  spacedText(ctx, TEXT.app, g.cx, a.top + a.size + a.labelGap, 3, "center");
}

function drawBand(ctx, items, W, H) {
  const b = L.band;
  ctx.fillStyle = C.band; ctx.fillRect(0, b.top, W, H - b.top);
  const sep = "   " + TEXT.bullet + "   ";
  const maxW = W - L.left * 2;
  let size = b.textSize;
  const measure = () => { font(ctx, 700, size); return ctx.measureText(items.join(sep)).width; };
  while (measure() > maxW && size > 14) size--;
  font(ctx, 700, size); ctx.textBaseline = "middle";
  const y = (b.top + H) / 2;
  let x = L.left;
  items.forEach((t, i) => {
    if (i) {
      ctx.fillStyle = C.red; ctx.fillText(sep, x, y); x += ctx.measureText(sep).width;
    }
    ctx.fillStyle = C.white; ctx.fillText(t, x, y); x += ctx.measureText(t).width;
  });
}

/* ---------- main ---------- */
export async function drawFlyer(canvas, state) {
  const img = await loadTemplate(templateName(state));
  const ctx = canvas.getContext("2d");
  const W = img.naturalWidth, H = img.naturalHeight;
  canvas.width = W; canvas.height = H;
  ctx.drawImage(img, 0, 0);

  // repaint the whole white strip, then redraw the logo from the template
  ctx.fillStyle = C.white; ctx.fillRect(0, L.strip.top, W, H - L.strip.top);
  drawLogoAndApp(ctx, img, state.showApp);
  drawHeader(ctx);

  const c = state.contact;
  const contact = [c.link, c.phone, c.email].map(t => t.trim()).filter(Boolean);
  const note = state.note.trim();
  const rsvp = rsvpUrl(state);

  // card geometry
  const cardL = L.left, cardR = L.contentRight, cd = L.card;
  const sessionsR = rsvp ? cardR - L.rsvp.width : cardR;
  const innerX = cardL + cd.padX, innerW = sessionsR - cd.padX - innerX;
  font(ctx, 400, L.note.size, true);
  const noteLines = note ? wrapText(ctx, note, cardR - cardL) : [];
  const bottomLimit = (contact.length ? L.band.top : H) - 18 - (note ? L.note.gap + noteLines.length * L.note.size * 1.35 : 0);
  const rsvpMinH = rsvp ? 26 + 14 + L.rsvp.tile + 16 + 2 * 24 + 40 : 0;

  // largest scale at which the card fits
  const card = buildCard(state);
  let k = L.maxScale, contentH;
  for (;;) {
    contentH = cardContent(ctx, card, innerX, 0, innerW, k, false);
    const h = Math.max(contentH + (cd.padTop + cd.padBottom) * k, rsvpMinH);
    if (cd.top + h <= bottomLimit || k <= L.minScale) break;
    k = Math.round((k - 0.02) * 100) / 100;
  }
  const cardH = Math.max(contentH + (cd.padTop + cd.padBottom) * k, rsvpMinH);

  ctx.fillStyle = C.panel; roundRect(ctx, cardL, cd.top, cardR - cardL, cardH, cd.radius); ctx.fill();
  cardContent(ctx, card, innerX, cd.top + cd.padTop * k, innerW, k, true);

  if (rsvp) {
    ctx.strokeStyle = C.dash; ctx.lineWidth = 2; ctx.setLineDash([7, 7]);
    ctx.beginPath(); ctx.moveTo(sessionsR, cd.top + 20); ctx.lineTo(sessionsR, cd.top + cardH - 20); ctx.stroke();
    ctx.setLineDash([]);
    drawRsvp(ctx, rsvp, sessionsR, cd.top, cardH, state.second);
  }

  if (note) {
    font(ctx, 400, L.note.size, true); ctx.fillStyle = C.gray; ctx.textBaseline = "top";
    noteLines.forEach((ln, i) => ctx.fillText(ln, cardL, cd.top + cardH + L.note.gap + i * L.note.size * 1.35));
  }

  if (contact.length) drawBand(ctx, contact, W, H);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
}
