/*
 * All editable content lives here: audiences, event names, which Canva
 * template each audience + event uses, the details-area layout, colors and
 * text. Adding a new flyer = add its image to templates/ and one entry below.
 */

export const AUDIENCES = {
  corporate: "Corporate",
  medical: "Medical",
  student: "Student",
  community: "Community"
};

/*
 * Event names from the MoM Sessions one-pager. `name` is also the PRS
 * "Event Name". `templates` maps audience -> image in templates/ (without
 * .jpg). An audience missing here doesn't offer that event.
 */
export const EVENTS = [
  { id: "stress", name: "How to manage stress in 7 minutes",
    templates: { corporate: "corporate-1", medical: "medical-1", student: "corporate-1", community: "corporate-1" } },
  { id: "brain-fog", name: "How to clear brain fog in 7 minutes",
    templates: { corporate: "corporate-2", student: "student-2" } },
  { id: "focus", name: "How to boost your focus in 7 minutes",
    templates: { corporate: "corporate-3" } },
  { id: "flow", name: "Enter a flow state in 7 minutes",
    templates: { student: "student-4" } },
  { id: "lock-in", name: "7 minutes to lock in",
    templates: { student: "student-5" } },
  { id: "overstimulation", name: "Reset from overstimulation in 7 minutes",
    templates: { medical: "medical-6", student: "student-6" } },
  { id: "relieve-stress", name: "How to relieve stress in 7 minutes",
    templates: { medical: "medical-7", community: "medical-7" } },
  { id: "burnout", name: "The way out of burnout starts here",
    templates: { medical: "medical-8" } }
];

export const TEMPLATE_DIR = "templates/";

/* Miracle of Mind app download link: the same one as the PR team's official
   app QR code (opens the App Store / Play Store on phones). */
export const APP_URL = "https://isha.us/aj2o41.qr";

/* Durations offered as suggestions (the field also accepts any text). */
export const DURATIONS = ["30 minutes", "45 minutes", "60 minutes"];

/*
 * The details area, in template pixels (all templates are 1545 x 2000 and
 * share the same white strip at the bottom). The whole strip is repainted:
 * header, session card (+ optional RSVP panel), note, logo with app QR, and
 * a contact band. Content inside the card shrinks (down to minScale) to fit.
 */
export const LAYOUT = {
  strip: { top: 1488 },                        // white strip under the photo
  left: 166,                                   // left edge of everything
  contentRight: 1212,                          // right edge of header rule and card
  header: { y: 1509, size: 21, spacing: 4 },   // "SESSION DETAILS" (y = middle)
  card: { top: 1543, radius: 22, padX: 30, padTop: 20, padBottom: 26, colGap: 40 },
  rsvp: { width: 188, tile: 132, qr: 112 },    // RSVP panel at the card's right end
  note: { size: 22, gap: 16 },                 // italic note under the card
  band: { top: 1916, textSize: 25 },           // navy contact band at the bottom
  logo: {
    src: { x: 1242, y: 1523, w: 265, h: 268 }, // the template's own logo
    cx: 1350, top: 1495, width: 208            // redrawn here, a bit smaller
  },
  app: { size: 112, top: 1728, labelSize: 19, labelGap: 12 },
  minScale: 0.74,
  maxScale: 1.15                                // sparse cards grow a little to fill the space
};

/* Sizes inside the session card at scale 1 (shrunk together when needed). */
export const CARD_TEXT = {
  label: { size: 20, height: 26, after: 10, spacing: 3 },
  date: { size: 36, height: 44, after: 8 },
  line: { size: 24, height: 32 },              // time row
  divider: { before: 12, after: 14 },
  venue: { size: 24, height: 31 },
  address: { size: 23, height: 31 },
  iconIndent: 36
};

export const COLORS = {
  red: "#E1251B",
  navy: "#1B2E4B",
  band: "#1F3A5F",
  text: "#2D3748",
  gray: "#4A5568",
  label: "#5B6B82",
  panel: "#EEF2F7",
  rule: "#D6DCE4",
  dash: "#C3CDD9",
  white: "#FFFFFF"
};

export const FONTS = {
  family: '"Inter", "Helvetica Neue", Arial, sans-serif',
  preload: ["400 24px Inter", "600 24px Inter", "700 36px Inter", "800 21px Inter", "italic 400 22px Inter"]
};

export const TEXT = {
  header: "SESSION DETAILS",
  session: n => n ? "SESSION " + n : "SESSION",
  location: "LOCATION",
  rsvp: "RSVP",
  rsvpCaption: second => second ? ["Scan to register", "for either session"] : ["Scan to", "register"],
  app: "GET THE APP",
  bullet: "•"
};

export const STORAGE_KEY = "mom-session-flyer-v1";
export const DOWNLOAD_PREFIX = "mom-session-";

/* What a new visitor sees. */
export const DEFAULTS = {
  audience: "corporate",
  eventId: "stress",
  duration: "30 minutes",
  s1: { date: "Sun, Oct 11, 2026", time: "2:00 to 2:30 PM" },
  location: { venue: "Main Street Library", address: "123 Main St,\nYour City, ST 12345" },
  second: false,
  s2: { date: "", time: "" },
  sameLocation: true,
  location2: { venue: "", address: "" },
  note: "",
  contact: { link: "", phone: "", email: "" },
  rsvp: "",
  showApp: true
};
