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
 * "Event Name". Each "in 7 minutes" event has a shorter-headline version
 * right after it (for longer sessions that include other practices).
 * `templates` maps audience -> image in templates/ (without .jpg). An
 * audience missing here doesn't offer that event.
 */
export const EVENTS = [
  { id: "stress", name: "How to manage stress in 7 minutes",
    templates: { corporate: "corporate-1", medical: "medical-1", student: "corporate-1", community: "corporate-1" } },
  { id: "stress-short", name: "How to manage stress",
    templates: { corporate: "corporate-1-short", medical: "medical-1-short", student: "corporate-1-short", community: "corporate-1-short" } },
  { id: "brain-fog", name: "How to clear brain fog in 7 minutes",
    templates: { corporate: "corporate-2", student: "student-2" } },
  { id: "brain-fog-short", name: "How to clear brain fog",
    templates: { corporate: "corporate-2-short", student: "student-2-short" } },
  { id: "focus", name: "How to boost your focus in 7 minutes",
    templates: { corporate: "corporate-3" } },
  { id: "focus-short", name: "How to boost your focus",
    templates: { corporate: "corporate-3-short" } },
  { id: "flow", name: "Enter a flow state in 7 minutes",
    templates: { student: "student-4" } },
  { id: "flow-short", name: "Enter a flow state",
    templates: { student: "student-4-short" } },
  { id: "lock-in", name: "7 minutes to lock in",
    templates: { student: "student-5" } },
  { id: "lock-in-short", name: "How to lock in",
    templates: { student: "student-5-short" } },
  { id: "overstimulation", name: "Reset from overstimulation in 7 minutes",
    templates: { medical: "medical-6", student: "student-6" } },
  { id: "overstimulation-short", name: "Reset from overstimulation",
    templates: { medical: "medical-6-short", student: "student-6-short" } },
  { id: "relieve-stress", name: "How to relieve stress in 7 minutes",
    templates: { medical: "medical-7", community: "medical-7" } },
  { id: "relieve-stress-short", name: "How to relieve stress",
    templates: { medical: "medical-7-short", community: "medical-7-short" } },
  { id: "burnout", name: "The way out of burnout starts here",
    templates: { medical: "medical-8" } }
];

export const TEMPLATE_DIR = "templates/";
/* Raise this whenever template images are replaced, so browsers fetch the new
   files instead of cached old ones (the images keep the same names). */
export const TEMPLATE_VERSION = 2;

/* The Miracle of Mind logo, drawn on every flyer (the templates' white strip
   is blank). Cut from the PR team's Canva export. */
export const LOGO_SRC = "assets/mom-logo.png";

/* Session durations in the dropdown (the MoM session modules). */
export const DURATIONS = ["30 minutes", "45 minutes", "60 minutes"];
/* "Other (type your own)" duration. Off: sessions are 60 minutes at most
   (PR team request, Sep 2026). Drafts with other durations move to the
   closest option above. */
export const ALLOW_OTHER_DURATION = false;

/* Shorter-headline flyers (the "-short" events below). Off during the PR
   team's 2-week test of the "in 7 minutes" versions (from Sep 30, 2026);
   set back to true to offer both again. Burnout has no 7-minute version,
   so it stays either way. */
export const SHOW_SHORT_HEADLINES = false;

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
  header: { show: false, size: 30, spacing: 5, after: 20 }, // "SESSION DETAILS" heading + rule (off per the designer)
  card: { panel: false, radius: 22, padX: 30, padTop: 22, padBottom: 26, colGap: 80, gapToRsvp: 34 }, // panel = tinted box behind the details (off per the designer)
  rsvp: { width: 232, tile: 184, qr: 176, labelGap: 4, gap: 14 }, // RSVP column at the right end of the details; the QR grows to fill it, keeping `gap` px above and below
  divider: { show: false, inset: 24 },                      // thin line between the details and the logo (shorter than the logo by inset at each end)
  note: { size: 23, gap: 36 },                 // one sentence about the session, under the card
  band: { top: 1928, textSize: 25 },           // contact band at the bottom
  logo: { src: { x: 1242, y: 1523, w: 265, h: 268 } }, // where the logo goes (x, size); y is centered in the white space
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
  icons: false,                                // clock and pin icons (off per the designer)
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
  s2: { date: "", time: "", duration: "" }, // duration "" = same as session 1
  sameLocation: true,
  location2: { venue: "", address: "" },
  note: "",
  center: "",
  contact: { link: "", phone: "", email: "" },
  rsvp: ""
};
