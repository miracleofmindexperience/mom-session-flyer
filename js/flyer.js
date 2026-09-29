/*
 * Draws a flyer: the chosen Canva template as the background, with its white
 * "Session details" strip repainted in this layout (top to bottom):
 *
 *   SESSION DETAILS ─────────────────────────   ┌──────┐
 *   ┌ session card ─────────────────┬ RSVP ┐    │ logo │
 *   │ Session 1 | Session 2 columns │  QR  │    └──────┘
 *   └───────────────────────────────┴──────┘
 *   one sentence about the session
 *   ████ contact band ████████████████████████████████
 *
 * The details block and the logo are each centered vertically in the white
 * space, so short and long details both look balanced. The footer band, card
 * tint and dark text take their color from the template's photo (see theme()).
 *
 * The card's content is a list of columns (plus an optional full-width
 * footer), each a list of items (label, date, time, divider, venue, address).
 * Everything inside the card scales together: it shrinks until it fits, and
 * a sparse card grows a little (up to maxScale) to fill the space.
 */
import { LAYOUT as L, CARD_TEXT as T, COLORS as C, FONTS, TEXT, TEMPLATE_DIR, THEME } from "./config.js";
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

/* ---------- theme: colors taken from the template's photo ---------- */
function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
const css = (h, s, l) => "hsl(" + h.toFixed(0) + " " + (s * 100).toFixed(0) + "% " + (l * 100).toFixed(0) + "%)";

/* HSL (h in degrees, s and l 0..1) to relative luminance, for contrast checks. */
function luminance(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  const lin = v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(f(0)) + 0.7152 * lin(f(8)) + 0.0722 * lin(f(4));
}

/* Averages the photo just above the white strip (skipping white text and deep
   shadows), then derives: the footer band (the photo's own color, darkened
   only as far as white text needs to stay readable), dark text, and a pale
   card tint. Cached per template. */
const themes = {};
function theme(ctx, name, W) {
  if (themes[name]) return themes[name];
  const t = THEME.sample, d = ctx.getImageData(0, t.top, W, t.height).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) {
    const l = (Math.max(d[i], d[i + 1], d[i + 2]) + Math.min(d[i], d[i + 1], d[i + 2])) / 510;
    if (l > 0.85 || l < 0.08) continue;
    r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
  }
  const [h, s, l] = n ? hsl(r / n, g / n, b / n) : [210, 0.4, 0.3];
  const bandS = Math.min(s, THEME.bandSat);
  let bandL = l;
  while (bandL > 0.05 && (1.05 / (luminance(h, bandS, bandL) + 0.05)) < THEME.bandContrast) bandL -= 0.01;
  return (themes[name] = {
    ink: css(h, Math.min(s, THEME.inkSat), THEME.inkLight),
    band: css(h, bandS, bandL),
    panel: css(h, Math.min(s, THEME.panelSat), THEME.panelLight),
    rule: css(h, Math.min(s, THEME.panelSat), THEME.ruleLight)
  });
}
let TH = null; // theme of the flyer being drawn

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
  ctx.fillStyle = TH.panel;
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

/* One-line location for a row that spans the card: "Venue · street, city". */
function placeItem(loc) {
  const address = loc.address.split("\n").map(t => t.trim().replace(/,$/, "")).filter(Boolean).join(", ");
  return (loc.venue.trim() || address) ? [{ type: "place", venue: loc.venue.trim(), address }] : [];
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
  // one shared location spans both columns under the two sessions
  if (state.sameLocation) {
    const place = placeItem(state.location);
    return { cols: [s1, s2], footer: place.length ? [divider, ...place] : [] };
  }
  const loc2 = locationItems(state.location2);
  return { cols: [[...s1, ...(loc1.length ? [divider, ...loc1] : [])], [...s2, ...(loc2.length ? [divider, ...loc2] : [])]], footer: [] };
}

/* ---------- measuring + drawing items ---------- */
let wrapped = 0; // dates/times that needed more than one line in the last measure
/* Each item is measured and drawn by the same function; draw=false only measures. */
function item(ctx, it, x, y, width, k, draw) {
  const indent = T.icons ? T.iconIndent * k : 0;
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
      // a long date shrinks (to 70%) to stay on one line before it wraps
      const t = T.date, full = t.size * k;
      let size = full;
      font(ctx, 700, size);
      while (ctx.measureText(it.text).width > width && size > full * 0.7) { size--; font(ctx, 700, size); }
      const lines = wrapText(ctx, it.text, width), lh = t.height * k * size / full;
      if (lines.length > 1) wrapped++;
      if (draw) {
        ctx.fillStyle = TH.ink; ctx.textBaseline = "middle";
        lines.forEach((ln, i) => ctx.fillText(ln, x, y + (i + 0.5) * lh));
      }
      return lines.length * lh + t.after * k;
    }
    case "time": {
      const t = T.line;
      font(ctx, 400, t.size * k);
      const lines = wrapText(ctx, it.text, width - indent);
      if (lines.length > 1) wrapped++;
      if (draw) {
        if (T.icons) clockIcon(ctx, x, y + t.height * k / 2, t.size * k);
        ctx.fillStyle = C.text; ctx.textBaseline = "middle";
        lines.forEach((ln, i) => ctx.fillText(ln, x + indent, y + (i + 0.5) * t.height * k));
      }
      return lines.length * t.height * k;
    }
    case "divider": {
      const t = T.divider;
      if (draw) { ctx.fillStyle = TH.rule; ctx.fillRect(x, y + t.before * k, width, 2); }
      return (t.before + t.after) * k + 2;
    }
    case "place": {
      // venue (bold) then " · " and the address on the same line when it fits;
      // otherwise venue on its own line and the address wrapped below it
      const tv = T.venue, ta = T.address, sep = it.venue && it.address ? "  ·  " : "";
      font(ctx, 700, tv.size * k); const vw = ctx.measureText(it.venue).width;
      font(ctx, 400, ta.size * k); const rest = sep + it.address, rw = ctx.measureText(rest).width;
      const oneLine = indent + vw + rw <= width;
      const addrLines = oneLine || !it.address ? [] : wrapText(ctx, it.address, width - indent);
      const h = (it.venue ? tv.height : 0) * k + addrLines.length * ta.height * k || tv.height * k;
      if (draw) {
        const mid = y + tv.height * k / 2;
        if (T.icons) pinIcon(ctx, x, mid, tv.size * k);
        ctx.textBaseline = "middle";
        if (it.venue) { font(ctx, 700, tv.size * k); ctx.fillStyle = TH.ink; ctx.fillText(it.venue, x + indent, mid); }
        font(ctx, 400, ta.size * k); ctx.fillStyle = C.gray;
        if (oneLine) ctx.fillText(it.venue ? rest : it.address, x + indent + vw, mid);
        else addrLines.forEach((ln, i) => ctx.fillText(ln, x + indent, y + ((it.venue ? tv.height : 0) + (i + 0.5) * ta.height) * k));
      }
      return h;
    }
    case "venue":
    case "address": {
      const t = T[it.type], bold = it.type === "venue";
      font(ctx, bold ? 700 : 400, t.size * k);
      const lines = wrapText(ctx, it.text, width - indent);
      if (draw) {
        if (it.pin && T.icons) pinIcon(ctx, x, y + t.height * k / 2, t.size * k);
        ctx.fillStyle = bold ? TH.ink : C.gray; ctx.textBaseline = "middle";
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
/* "SESSION DETAILS" with a thin rule to the right; y = middle of the text. */
function drawHeader(ctx, y) {
  const h = L.header;
  font(ctx, 800, h.size); ctx.fillStyle = C.red; ctx.textBaseline = "middle";
  const w = spacedText(ctx, TEXT.header, L.left, y, h.spacing);
  ctx.fillStyle = TH.rule; ctx.fillRect(L.left + w + 24, y - 1, L.contentRight - (L.left + w + 24), 2);
}

/* Height of the RSVP block: label, QR tile and caption. */
function rsvpBlockHeight(second) {
  return 26 + L.rsvp.labelGap + L.rsvp.tile + 16 + TEXT.rsvpCaption(second).length * 24;
}

function drawRsvp(ctx, url, x, top, height, second) {
  const r = L.rsvp, cx = x + r.width / 2;
  const caption = TEXT.rsvpCaption(second);
  const blockH = rsvpBlockHeight(second);
  let y = top + (height - blockH) / 2;
  font(ctx, 800, 21); ctx.fillStyle = C.red; ctx.textBaseline = "middle";
  spacedText(ctx, TEXT.rsvp, cx, y + 13, 4, "center");
  y += 26 + r.labelGap;
  ctx.fillStyle = C.white; roundRect(ctx, cx - r.tile / 2, y, r.tile, r.tile, 14); ctx.fill();
  drawQR(ctx, url, cx - r.qr / 2, y + (r.tile - r.qr) / 2, r.qr, TH.ink);
  y += r.tile + 16;
  font(ctx, 700, 19); ctx.fillStyle = TH.ink; ctx.textAlign = "center";
  caption.forEach((ln, i) => ctx.fillText(ln, cx, y + 12 + i * 24));
  ctx.textAlign = "left";
}

/* The template's own logo, redrawn at its original size, centered vertically in the white space. */
function drawLogo(ctx, img, top, bottom) {
  const g = L.logo, s = g.src;
  ctx.drawImage(img, s.x, s.y, s.w, s.h, s.x, (top + bottom - s.h) / 2, s.w, s.h);
}

/* ---------- contact band ---------- */
/* Small white line icons (size = text height), drawn with the top-left at x, y. */
const BAND_ICONS = {
  link(ctx, x, y, h) {
    ctx.save(); ctx.translate(x + h / 2, y + h / 2); ctx.rotate(-Math.PI / 4);
    const w = h * 0.5, t = h * 0.3;
    roundRect(ctx, -w * 0.95, -t / 2, w, t, t / 2); ctx.stroke();
    roundRect(ctx, -w * 0.05, -t / 2, w, t, t / 2); ctx.stroke();
    ctx.restore();
  },
  phone(ctx, x, y, h) {
    const w = h * 0.56;
    roundRect(ctx, x + (h - w) / 2, y, w, h, h * 0.12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + h / 2 - h * 0.08, y + h * 0.82); ctx.lineTo(x + h / 2 + h * 0.08, y + h * 0.82); ctx.stroke();
  },
  email(ctx, x, y, h) {
    const w = h * 1.1, t = h * 0.78, top = y + (h - t) / 2;
    roundRect(ctx, x - (w - h) / 2, top, w, t, h * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - (w - h) / 2 + 2, top + 3); ctx.lineTo(x + h / 2, top + t * 0.58); ctx.lineTo(x + h - (h - w) / 2 - 2, top + 3); ctx.stroke();
  }
};

/* The contact items centered in the band, each with its icon, separated by
   thin dividers. items: [{ type: "link" | "phone" | "email", text }]. */
function drawBand(ctx, items, W, H) {
  const b = L.band, y = (b.top + H) / 2;
  ctx.fillStyle = TH.band; ctx.fillRect(0, b.top, W, H - b.top);
  let size = b.textSize;
  const layout = () => {
    font(ctx, 600, size);
    const icon = size * 0.95, gapIcon = size * 0.5, gapItem = size * 1.9;
    const widths = items.map(it => icon + gapIcon + ctx.measureText(it.text).width);
    return { icon, gapIcon, gapItem, widths, total: widths.reduce((a, w) => a + w, 0) + gapItem * (items.length - 1) };
  };
  let lay = layout();
  while (lay.total > W - L.left * 2 && size > 14) { size--; lay = layout(); }
  let x = (W - lay.total) / 2;
  ctx.textBaseline = "middle";
  items.forEach((it, i) => {
    if (i) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(x - lay.gapItem / 2 - 1, y - size * 0.55, 2, size * 1.1);
    }
    ctx.strokeStyle = C.white; ctx.lineWidth = Math.max(2, size * 0.09); ctx.lineCap = "round"; ctx.lineJoin = "round";
    BAND_ICONS[it.type](ctx, x, y - lay.icon / 2, lay.icon);
    font(ctx, 600, size); ctx.fillStyle = C.white;
    ctx.fillText(it.text, x + lay.icon + lay.gapIcon, y);
    x += lay.widths[i] + lay.gapItem;
  });
}

/* ---------- main ---------- */
export async function drawFlyer(canvas, state) {
  const name = templateName(state);
  const img = await loadTemplate(name);
  const ctx = canvas.getContext("2d");
  const W = img.naturalWidth, H = img.naturalHeight;
  canvas.width = W; canvas.height = H;
  ctx.drawImage(img, 0, 0);
  TH = theme(ctx, name, W);

  const c = state.contact;
  const contact = [["link", c.link], ["phone", c.phone], ["email", c.email]]
    .map(([type, t]) => ({ type, text: t.trim() })).filter(it => it.text);
  const note = state.note.trim();
  const rsvp = rsvpUrl(state);

  // the white space the details block and logo share
  const spaceTop = L.strip.top, spaceBottom = contact.length ? L.band.top : H;
  const top = spaceTop + L.pad, bottom = spaceBottom - L.pad;

  // repaint the whole white strip, then put the logo back
  ctx.fillStyle = C.white; ctx.fillRect(0, spaceTop, W, H - spaceTop);
  drawLogo(ctx, img, spaceTop, spaceBottom);

  // card geometry
  const cardL = L.left, cardR = L.contentRight, cd = L.card;
  const sessionsR = rsvp ? cardR - L.rsvp.width : cardR;
  // with the tinted box, text is inset from its edges; without it, text starts at the left margin
  const padX = cd.panel ? cd.padX : 0, padT = cd.panel ? cd.padTop : 0, padB = cd.panel ? cd.padBottom : 0;
  const innerX = cardL + padX, innerW = sessionsR - (rsvp ? cd.gapToRsvp : padX) - innerX;
  const open = !cd.panel; // no box: details, RSVP and logo sit side by side on white
  font(ctx, 400, L.note.size, true);
  // the note stays under the details, clear of the RSVP when there's no box
  const noteW = open && rsvp ? sessionsR - cd.gapToRsvp - cardL : cardR - cardL;
  const noteLines = note ? wrapText(ctx, note, noteW) : [];
  const noteH = note ? L.note.gap + noteLines.length * L.note.size * 1.35 : 0;
  const headH = L.header.show ? L.header.size + L.header.after : 0;
  const rsvpMinH = rsvp ? rsvpBlockHeight(true) + (cd.panel ? 40 : 8) : 0;
  const maxCardH = bottom - top - headH - noteH;

  // largest scale at which the card fits
  const card = buildCard(state);
  let k = L.maxScale, contentH;
  const cardHeight = () => Math.max(contentH + (padT + padB) * k, rsvpMinH);
  for (;;) {
    wrapped = 0;
    contentH = cardContent(ctx, card, innerX, 0, innerW, k, false);
    // growing past normal size is only worth it if dates and times stay on one line
    const fits = open ? contentH + noteH <= bottom - top : cardHeight() <= maxCardH;
    if ((fits && (k <= 1 || !wrapped)) || k <= L.minScale) break;
    k = Math.round((k - 0.02) * 100) / 100;
  }
  const cardH = cardHeight();

  if (open) {
    // details (with the note under them), RSVP and logo all centered on the same line
    const mid = (spaceTop + spaceBottom) / 2;
    const detailsTop = Math.max(top, mid - (contentH + noteH) / 2);
    cardContent(ctx, card, innerX, detailsTop, innerW, k, true);
    if (note) {
      font(ctx, 400, L.note.size, true); ctx.fillStyle = C.gray; ctx.textBaseline = "top";
      noteLines.forEach((ln, i) => ctx.fillText(ln, cardL, detailsTop + contentH + L.note.gap + i * L.note.size * 1.35));
    }
    if (rsvp) {
      const rH = rsvpBlockHeight(state.second);
      drawRsvp(ctx, rsvp, sessionsR, mid - rH / 2, rH, state.second);
    }
    // thin divider between the session details (incl. RSVP) and the logo
    if (L.divider.show) {
      const g = L.logo.src, dx = (cardR + g.x) / 2, dh = g.h - 2 * L.divider.inset;
      ctx.fillStyle = TH.rule; ctx.fillRect(dx - 1, mid - dh / 2, 2, dh);
    }
    if (contact.length) drawBand(ctx, contact, W, H);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    return;
  }

  // center the whole block (header, card, note) in the white space
  const blockH = headH + cardH + noteH;
  const y0 = Math.max(top, (top + bottom - blockH) / 2);
  if (L.header.show) drawHeader(ctx, y0 + L.header.size / 2);
  const cardTop = y0 + headH;

  if (cd.panel) { ctx.fillStyle = TH.panel; roundRect(ctx, cardL, cardTop, cardR - cardL, cardH, cd.radius); ctx.fill(); }
  // without the box, short content is centered against the RSVP block
  const contentTop = cd.panel ? cardTop + padT * k : cardTop + (cardH - contentH) / 2;
  cardContent(ctx, card, innerX, contentTop, innerW, k, true);

  if (rsvp) {
    ctx.strokeStyle = C.dash; ctx.lineWidth = 2; ctx.setLineDash([7, 7]);
    ctx.beginPath(); ctx.moveTo(sessionsR, cardTop + 20); ctx.lineTo(sessionsR, cardTop + cardH - 20); ctx.stroke();
    ctx.setLineDash([]);
    drawRsvp(ctx, rsvp, sessionsR, cardTop, cardH, state.second);
  }

  if (note) {
    font(ctx, 400, L.note.size, true); ctx.fillStyle = C.gray; ctx.textBaseline = "top";
    noteLines.forEach((ln, i) => ctx.fillText(ln, cardL, cardTop + cardH + L.note.gap + i * L.note.size * 1.35));
  }

  if (contact.length) drawBand(ctx, contact, W, H);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
}
