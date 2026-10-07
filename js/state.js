import { STORAGE_KEY, DEFAULTS, EVENTS, AUDIENCES, DURATIONS, ALLOW_OTHER_DURATION, SHOW_SHORT_HEADLINES } from "./config.js";

/* Saved draft merged over the defaults, so drafts from older versions still load. */
export function loadState() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
  return normalize(merge(structuredClone(DEFAULTS), saved || {}));
}

export function defaultState() {
  return normalize(structuredClone(DEFAULTS));
}

export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function merge(base, extra) {
  for (const [k, v] of Object.entries(extra)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object") merge(base[k], v);
    else if (k in base && typeof v === typeof base[k]) base[k] = v;
  }
  return base;
}

/* Keeps audience, event and duration valid. */
function normalize(s) {
  if (!AUDIENCES[s.audience]) s.audience = DEFAULTS.audience;
  const events = eventsFor(s.audience);
  if (!events.some(e => e.id === s.eventId)) {
    // a hidden shorter-headline choice falls back to its "in 7 minutes" version
    const full = s.eventId.replace(/-short$/, "");
    s.eventId = events.some(e => e.id === full) ? full : events[0].id;
  }
  if (!ALLOW_OTHER_DURATION && !DURATIONS.includes(s.duration)) s.duration = closestDuration(s.duration);
  if (s.s2.duration && !DURATIONS.includes(s.s2.duration)) s.s2.duration = closestDuration(s.s2.duration);
  return s;
}

/* The listed duration nearest to a typed one ("90 minutes" -> "60 minutes"). */
function closestDuration(text) {
  const m = String(text).match(/\d+(\.\d+)?/);
  if (!m) return DEFAULTS.duration;
  const mins = parseFloat(m[0]) * (/h(ou)?r/i.test(text) ? 60 : 1);
  return DURATIONS.reduce((best, d) => Math.abs(parseInt(d) - mins) < Math.abs(parseInt(best) - mins) ? d : best);
}

export function eventsFor(audience) {
  return EVENTS.filter(e => e.templates[audience] && (SHOW_SHORT_HEADLINES || !e.id.endsWith("-short")));
}

export function currentEvent(state) {
  return EVENTS.find(e => e.id === state.eventId);
}

export function templateName(state) {
  return currentEvent(state).templates[state.audience];
}

/* The registration link as a full URL, or "" if it doesn't look like one.
   "https://" is added when missing. */
export function rsvpUrl(state) {
  let v = (state.rsvp || "").trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = "https://" + v.replace(/^\/+/, "");
  return /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?([\/?#]\S*)?$/i.test(v) ? v : "";
}
