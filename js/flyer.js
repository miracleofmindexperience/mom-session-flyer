/*
 * Draws a flyer: the chosen Canva template as the background, with the
 * session details written into its white "Session details" area.
 *
 * Details are laid out as rows. A "cols" row has two columns side by side
 * (e.g. Session 1 | Session 2); a "full" row spans the width. Text shrinks
 * together until everything fits above the contact row.
 */
import { LAYOUT as L, COLORS as C, FONTS, TEXT, TEMPLATE_DIR } from "./config.js";
import { templateName, rsvpUrl } from "./state.js";
import { wrapText, fitFont, drawQR } from "./lib/canvas.js";

const F = FONTS.family;

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

/* ---------- content ---------- */
const line = (t, bold = false) => ({ t: (t || "").trim(), bold });
const GAP = { gap: true };

function whenLines(s, duration) {
  return [line(s.date, true), line([s.time.trim(), duration.trim()].filter(Boolean).join(" · "))];
}

function locationLines(loc) {
  const rest = [loc.venue, ...loc.address.split("\n")].map(t => line(t)).filter(l => l.t);
  return rest.length ? [line(TEXT.location, true), ...rest] : [];
}

const clean = lines => lines.filter(l => l.gap || l.t);

/* Rows of content from the form. Blank fields are left out. */
function buildRows(state) {
  const d = state.duration;
  const note = state.note.trim() ? [line(state.note)] : [];
  const loc1 = locationLines(state.location);

  if (!state.second) {
    // Like the template: session info on the left, the optional note on the right.
    return [{ cols: [clean([...whenLines(state.s1, d), GAP, ...loc1]), note] }];
  }
  const rows = [];
  const s1 = [line(TEXT.session(1), true), ...whenLines(state.s1, d).map(l => line(l.t))];
  const s2 = [line(TEXT.session(2), true), ...whenLines(state.s2, d).map(l => line(l.t))];
  if (state.sameLocation) {
    rows.push({ cols: [clean(s1), clean(s2)] });
    if (loc1.length) rows.push({ full: loc1 });
  } else {
    rows.push({ cols: [clean([...s1, GAP, ...loc1]), clean([...s2, GAP, ...locationLines(state.location2)])] });
  }
  if (note.length) rows.push({ full: note });
  return rows;
}

function contactText(state) {
  const c = state.contact;
  return [c.link, c.phone, c.email].map(t => t.trim()).filter(Boolean).join("   ·   ");
}

/* ---------- measuring ---------- */
function setFont(ctx, bold, size) { ctx.font = (bold ? "700 " : "400 ") + size + "px " + F; }

/* Wraps each line to the width; returns [{t, bold}] visual lines and gaps. */
function wrapLines(ctx, lines, width, size) {
  const out = [];
  lines.forEach(l => {
    if (l.gap) { out.push(l); return; }
    setFont(ctx, l.bold, size);
    wrapText(ctx, l.t, width).forEach(t => out.push({ t, bold: l.bold }));
  });
  return out;
}

function blockHeight(lines, size) {
  const lh = size * L.lineHeight;
  return lines.reduce((h, l) => h + (l.gap ? lh * 0.5 : lh), 0);
}

/* Lays out all rows at one font size; returns { rows, height }. */
function layout(ctx, rows, size) {
  const full = L.right - L.left, colW = (full - L.columnGap) / 2;
  const rowGap = size * L.lineHeight * 0.5;
  let height = 0;
  const placed = rows.map(r => {
    let h, cols;
    if (r.cols) {
      cols = r.cols.map(c => wrapLines(ctx, c, colW, size));
      h = Math.max(...cols.map(c => blockHeight(c, size)));
    } else {
      cols = [wrapLines(ctx, r.full, full, size)];
      h = blockHeight(cols[0], size);
    }
    const y = height;
    height += h + rowGap;
    return { y, cols, twoCols: !!r.cols, colW };
  });
  return { rows: placed, height: Math.max(0, height - rowGap) };
}

/* ---------- drawing ---------- */
function drawLines(ctx, lines, x, y, size) {
  const lh = size * L.lineHeight;
  lines.forEach(l => {
    if (l.gap) { y += lh * 0.5; return; }
    setFont(ctx, l.bold, size);
    ctx.fillStyle = l.bold ? C.label : C.text;
    ctx.fillText(l.t, x, y);
    y += lh;
  });
}

export async function drawFlyer(canvas, state) {
  const img = await loadTemplate(templateName(state));
  const ctx = canvas.getContext("2d");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  // wipe the placeholder text
  ctx.fillStyle = C.white;
  ctx.fillRect(L.clear.x, L.clear.y, L.clear.w, L.clear.h);

  const contact = contactText(state);
  const bottom = contact ? L.contactY - L.fontSize * 1.1 : L.bottom;

  // largest font size at which everything fits
  const rows = buildRows(state);
  let size = L.fontSize, lay = layout(ctx, rows, size);
  while (L.top + lay.height > bottom && size > L.minFont) { size--; lay = layout(ctx, rows, size); }

  ctx.textBaseline = "top"; ctx.textAlign = "left";
  lay.rows.forEach(r => {
    r.cols.forEach((col, i) => drawLines(ctx, col, L.left + (r.twoCols ? i * (r.colW + L.columnGap) : 0), L.top + r.y, size));
  });

  if (contact) {
    ctx.textBaseline = "alphabetic";
    fitFont(ctx, contact, "600", L.fontSize, F, L.right - L.left, L.minFont);
    ctx.fillStyle = C.accent;
    ctx.fillText(contact, L.left, L.contactY);
  }

  const url = rsvpUrl(state);
  if (url) {
    const q = L.qr, x = q.cx - q.size / 2;
    drawQR(ctx, url, x, q.top, q.size);
    ctx.textBaseline = "top"; ctx.textAlign = "center";
    ctx.font = "600 19px " + F; ctx.fillStyle = C.muted;
    ctx.fillText(TEXT.qrLabel, q.cx, q.top + q.size + 6);
    ctx.textAlign = "left";
  }
  ctx.textBaseline = "alphabetic";
}
