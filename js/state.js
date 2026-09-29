import { STORAGE_KEY, DEFAULTS, EVENTS, AUDIENCES } from "./config.js";

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

/* Keeps audience and event valid together. */
function normalize(s) {
  if (!AUDIENCES[s.audience]) s.audience = DEFAULTS.audience;
  if (!eventsFor(s.audience).some(e => e.id === s.eventId)) s.eventId = eventsFor(s.audience)[0].id;
  return s;
}

export function eventsFor(audience) {
  return EVENTS.filter(e => e.templates[audience]);
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
