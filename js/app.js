/* Wires the form, the live preview and the download button together. */
import { AUDIENCES, DURATIONS, FONTS, DOWNLOAD_PREFIX } from "./config.js";
import { loadState, saveState, defaultState, eventsFor, currentEvent, rsvpUrl } from "./state.js";
import { drawFlyer } from "./flyer.js";
import { CENTERS } from "./centers.js";

const $ = id => document.getElementById(id);
const canvas = $("cv");
let state = loadState();

/* Text fields: input id -> path in state. */
const FIELDS = {
  "f-s1-date": "s1.date", "f-s1-time": "s1.time",
  "f-venue": "location.venue", "f-address": "location.address",
  "f-s2-date": "s2.date", "f-s2-time": "s2.time",
  "f-venue2": "location2.venue", "f-address2": "location2.address",
  "f-note": "note",
  "f-link": "contact.link", "f-phone": "contact.phone", "f-email": "contact.email",
  "f-rsvp": "rsvp"
};
/* Checkboxes: input id -> key in state. */
const CHECKS = { "f-second": "second", "f-same-location": "sameLocation" };

const get = path => path.split(".").reduce((o, k) => o[k], state);
const set = (path, v) => { const ks = path.split("."), last = ks.pop(); ks.reduce((o, k) => o[k], state)[last] = v; };

/* ---------- audience + event ---------- */
function renderAudiences() {
  const box = $("audiences");
  box.innerHTML = "";
  Object.entries(AUDIENCES).forEach(([key, label]) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = label;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", key === state.audience);
    b.addEventListener("click", () => {
      state.audience = key;
      if (!eventsFor(key).some(e => e.id === state.eventId)) state.eventId = eventsFor(key)[0].id;
      renderAudiences(); renderEvents(); changed();
    });
    box.appendChild(b);
  });
}

function renderEvents() {
  const sel = $("f-event");
  sel.innerHTML = "";
  eventsFor(state.audience).forEach(e => sel.add(new Option(e.name, e.id)));
  sel.value = state.eventId;
  $("prs-name").textContent = currentEvent(state).name;
}
$("f-event").addEventListener("change", e => { state.eventId = e.target.value; renderEvents(); changed(); });

$("prs-copy").addEventListener("click", () => {
  const b = $("prs-copy");
  navigator.clipboard?.writeText(currentEvent(state).name).then(() => {
    b.textContent = "Copied"; setTimeout(() => { b.textContent = "Copy"; }, 1500);
  }, () => {});
});

/* ---------- duration: a standard choice, or "Other" with free text ---------- */
const OTHER = "other";
function renderDuration() {
  const standard = DURATIONS.includes(state.duration);
  $("f-duration").value = standard ? state.duration : OTHER;
  $("duration-other-wrap").hidden = standard;
  if (!standard) $("f-duration-other").value = state.duration;
}
$("f-duration").addEventListener("change", e => {
  state.duration = e.target.value === OTHER ? $("f-duration-other").value : e.target.value;
  renderDuration();
  if (e.target.value === OTHER) $("f-duration-other").focus();
  changed();
});
$("f-duration-other").addEventListener("input", e => { state.duration = e.target.value; changed(); });

/* ---------- city center ---------- */
function renderCenters() {
  const sel = $("f-center");
  sel.add(new Option("Choose your city center…", ""));
  CENTERS.forEach(c => sel.add(new Option(c.name, c.id)));
}
$("f-center").addEventListener("change", e => {
  state.center = e.target.value;
  const c = CENTERS.find(x => x.id === state.center);
  if (c) {
    // fill the center's details; they stay editable afterwards
    state.contact.link = c.link; state.contact.email = c.email; state.rsvp = c.rsvp;
    ["link", "email"].forEach(k => { $("f-" + k).value = state.contact[k]; });
    $("f-rsvp").value = state.rsvp;
  }
  changed();
});

/* ---------- fields ---------- */
function fillForm() {
  Object.entries(FIELDS).forEach(([id, path]) => { $(id).value = get(path); });
  Object.entries(CHECKS).forEach(([id, key]) => { $(id).checked = state[key]; });
  $("f-center").value = state.center;
  renderDuration();
  renderAudiences(); renderEvents(); updateVisibility();
}

Object.entries(FIELDS).forEach(([id, path]) => {
  $(id).addEventListener("input", e => { set(path, e.target.value); changed(); });
});
Object.entries(CHECKS).forEach(([id, key]) => {
  $(id).addEventListener("change", e => { state[key] = e.target.checked; updateVisibility(); changed(); });
});

function updateVisibility() {
  $("second-fields").hidden = !state.second;
  $("location2-fields").hidden = state.sameLocation;
  $("rsvp-warn").hidden = !state.rsvp.trim() || !!rsvpUrl(state);
}

$("reset").addEventListener("click", () => {
  const keep = { audience: state.audience, eventId: state.eventId };
  state = Object.assign(defaultState(), keep, {
    s1: { date: "", time: "" }, location: { venue: "", address: "" }
  });
  fillForm(); changed();
});
$("form").addEventListener("submit", e => e.preventDefault());

/* ---------- updates ---------- */
let timer = null;
function changed() {
  saveState(state);
  updateVisibility();
  clearTimeout(timer);
  timer = setTimeout(render, 150);
}

async function render() {
  try {
    await drawFlyer(canvas, state);
    $("out").src = canvas.toDataURL("image/png");
  } catch (e) {
    $("dl-status").textContent = "Couldn't load the flyer template. Check your connection and reload.";
  }
}

/* ---------- download ---------- */
$("dl").addEventListener("click", async () => {
  const st = $("dl-status");
  await render();
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const name = DOWNLOAD_PREFIX + [state.audience, slug(currentEvent(state).name)].join("-") + ".png";
  canvas.toBlob(blob => {
    if (!blob) { st.textContent = "Couldn't create the image. Right-click or long-press the preview and choose Save image."; return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    st.textContent = "Downloaded. On a phone, you can also long-press the preview to save it.";
  }, "image/png");
});

/* ---------- start ---------- */
DURATIONS.forEach(d => $("f-duration").add(new Option(d)));
$("f-duration").add(new Option("Other (type your own)", OTHER));
renderCenters();
fillForm();
render();
Promise.all(FONTS.preload.map(f => document.fonts.load(f)))
  .catch(() => {})
  .then(() => document.fonts.ready)
  .then(render, render);
