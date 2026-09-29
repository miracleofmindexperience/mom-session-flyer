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

/* Session durations offered in the dropdown (the MoM session modules). */
export const DURATIONS = ["30 minutes", "45 minutes", "60 minutes"];

/*
 * The details area, in template pixels (all templates are 1545 x 2000 and
 * share the same white strip at the bottom). The whole strip is repainted:
 * header, session card (+ optional RSVP panel), the one-sentence note, the
 * logo, and a contact band. Card content scales (minScale to maxScale) to fit.
 */
export const LAYOUT = {
  strip: { top: 1488 },                        // white strip under the photo
  pad: 18,                                     // breathing room at the top and bottom of the white space
  left: 166,                                   // left edge of everything
  contentRight: 1205,                          // right edge of header rule and card (just left of the logo)
  header: { size: 30, spacing: 5, after: 20 }, // "SESSION DETAILS"
  card: { radius: 22, padX: 30, padTop: 22, padBottom: 26, colGap: 40 },
  rsvp: { width: 188, tile: 132, qr: 112 },    // RSVP panel at the card's right end
  note: { size: 23, gap: 16 },                 // one sentence about the session, under the card
  band: { top: 1928, textSize: 25 },           // contact band at the bottom
  logo: { src: { x: 1242, y: 1523, w: 265, h: 268 } }, // the template's own logo
  minScale: 0.74,
  maxScale: 1.3                                // sparse cards grow to fill the space
};

/*
 * Colors that follow the template, sampled from the bottom of its photo:
 */
export const THEME = {
  sample: { top: 1300, height: 180 },
  bandSat: 0.8, bandContrast: 4.5,   // footer band: the photo's color, darkened just enough for white text (WCAG 4.5:1)
  inkLight: 0.2, inkSat: 0.45,       // dates, venue, RSVP QR
  panelLight: 0.95, panelSat: 0.3,   // card background
  ruleLight: 0.85                    // header rule, dividers
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
  text: "#2D3748",
  gray: "#4A5568",
  label: "#5B6B82",
  dash: "#C3CDD9",
  white: "#FFFFFF"
};

export const FONTS = {
  family: '"Inter", "Helvetica Neue", Arial, sans-serif',
  preload: ["400 24px Inter", "600 24px Inter", "700 36px Inter", "800 30px Inter", "italic 400 23px Inter"]
};

export const TEXT = {
  header: "SESSION DETAILS",
  session: n => n ? "SESSION " + n : "SESSION",
  location: "LOCATION",
  rsvp: "RSVP",
  rsvpCaption: second => second ? ["Scan to register", "for either session"] : ["Scan to", "register"]
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
  center: "",
  contact: { link: "", phone: "", email: "" },
  rsvp: ""
};
