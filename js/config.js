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

/* Durations offered as suggestions (the field also accepts any text). */
export const DURATIONS = ["30 minutes", "45 minutes", "60 minutes"];

/*
 * Where the details go, in template pixels (all templates are 1545 x 2000
 * and share this layout). The template's own "Session details:" heading and
 * logo stay; everything in `clear` is painted white and redrawn.
 */
export const LAYOUT = {
  clear: { x: 150, y: 1598, w: 1080, h: 402 },   // placeholder text area
  left: 168,                                      // text starts here
  right: 1215,                                    // text must end before the logo
  top: 1614,                                      // first line (top of text)
  columnGap: 50,
  bottom: 1978,                                   // last line must end above this
  contactY: 1958,                                 // baseline of the contact row
  qr: { cx: 1374, top: 1806, size: 150 },         // under the logo, centered on it
  fontSize: 31,                                   // shrinks to fit, down to minFont
  minFont: 21,
  lineHeight: 1.32
};

export const COLORS = {
  text: "#1A1A1A",
  label: "#111111",
  accent: "#E1251B",   // contact row, like the PR team's filled-in example
  muted: "#555555",
  white: "#FFFFFF"
};

export const FONTS = {
  family: '"Libre Franklin", "Helvetica Neue", Arial, sans-serif',
  preload: ["400 31px 'Libre Franklin'", "700 31px 'Libre Franklin'"]
};

export const TEXT = {
  session: n => "Session " + n,
  location: "Location:",
  qrLabel: "Scan to register"
};

export const STORAGE_KEY = "mom-session-flyer-v1";
export const DOWNLOAD_PREFIX = "mom-session-";

/* What a new visitor sees. */
export const DEFAULTS = {
  audience: "corporate",
  eventId: "stress",
  duration: "30 minutes",
  s1: { date: "Sunday, October 11, 2026", time: "2:00 to 2:30 PM" },
  location: { venue: "Main Street Library", address: "123 Main St,\nYour City, ST 12345" },
  second: false,
  s2: { date: "", time: "" },
  sameLocation: true,
  location2: { venue: "", address: "" },
  note: "",
  contact: { link: "", phone: "", email: "" },
  rsvp: ""
};
