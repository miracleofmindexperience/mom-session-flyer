/* Generic 2D-canvas helpers. Nothing flyer-specific lives here. */

/* Rounded-rectangle path. */
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function spacedWidth(ctx, text, sp) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + sp;
  return w - sp;
}

/* Draws letter-spaced text. Returns its width. */
export function spacedText(ctx, text, x, y, sp, align) {
  const w = spacedWidth(ctx, text, sp);
  let cx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; }
  ctx.textAlign = prev;
  return w;
}

/* Splits text into lines no wider than maxW using the current font. */
export function wrapText(ctx, text, maxW) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  words.forEach(w => {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width <= maxW || !cur) cur = test;
    else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

/* Shrinks the font until text fits maxW (not below min). Sets ctx.font and returns the size. */
export function fitFont(ctx, text, weight, size, family, maxW, min) {
  let s = size;
  ctx.font = weight + " " + s + "px " + family;
  while (ctx.measureText(text).width > maxW && s > min) { s -= 1; ctx.font = weight + " " + s + "px " + family; }
  return s;
}

/* Draws a QR code for text in a size×size square (white background, `color`
   modules). Needs vendor/qrcode.js (global `qrcode`). */
export function drawQR(ctx, text, x, y, size, color = "#111111") {
  const qr = window.qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount(), quiet = 2, cell = size / (n + quiet * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = color;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) {
    const x0 = Math.floor(x + (c + quiet) * cell), y0 = Math.floor(y + (r + quiet) * cell);
    const x1 = Math.floor(x + (c + quiet + 1) * cell), y1 = Math.floor(y + (r + quiet + 1) * cell);
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
}
