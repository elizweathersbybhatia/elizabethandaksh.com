# Wedding Website — Handoff / Progress Log

**Project folder:** `/Users/elizabethweathersby/Downloads/wedding-website`
**Main file:** `index.html` (single-file site — all HTML, CSS in `<style>`, and JS in `<script>` live here; ~660 lines but ~1.6MB because a background texture + icon sprite sheets are embedded as base64).

> **To resume in a new chat, paste this:**
> "Read `/Users/elizabethweathersby/Downloads/wedding-website/HANDOFF.md` and continue from the 'NEXT / OUTSTANDING' section. Keep this file updated as we work."

---

## How to preview the site
- Static site, no build step. Serve the folder and open `index.html`.
  - e.g. `python3 -m http.server 8756` from the project folder, then open `http://localhost:8756`.
- **Password gate:** the site is name-gated. Log in with a name from `GUEST_LIST` in the `<script>`:
  - **Full access (sees all 3 days incl. Christian ceremony):** First `Daksh`, Last `Bhatia`
  - **Limited access (2 days, no Christian day):** First `Elizabeth`, Last `Weathersby`
- `GUEST_LIST` entries: `{ firstName, lastName, fullAccess, maxGuests, allowChildren }`. Only 2 placeholder entries exist — **real guest list still needs to be added before launch.**

---

## DONE (this session)
1. **No horizontal page scroll** — added `overflow-x:hidden` + `overscroll-behavior-x:none` to `html`/`body` (kills two-finger trackpad lateral drift). Carousel is the only horizontal-scroll area.
2. **Photo marquee (welcome section)** — still auto-scrolls right→left, but is now manually scrollable/swipeable/draggable; auto-scroll pauses on interaction, resumes ~1.8s later (JS IIFE near end of `<script>`).
3. **RSVP** — removed "We'd love to know if you can join us" subtitle; tightened the gold divider spacing.
4. **Useful Information (#info)** — reduced whitespace (accordion gap 1rem→0.55rem; tighter section heading/padding).
5. **Active-section nav indicator** — current section's nav link shows as a **solid navy pill** (cream text); soft top progress bar (`#scroll-progress`). Trigger fires when a section reaches ~⅓ down the viewport (`line = max(110, innerHeight*0.3)`), so the pill switches as soon as you're on a section (e.g. FAQ lights up when "Useful Information" enters).
6. **Logo "home" indicator** — on Hero + "A Note From Us" (welcome), NO section pill is highlighted; instead the E&D crest gets a gold underline + glow (`.nav-home.home-active`).
7. **Mobile menu bug fixed** — the fullscreen hamburger overlay used to only cover the nav strip (nav's `backdrop-filter` trapped the `position:fixed` child). Fixed by sizing `nav ul` to `100vw/100dvh`. Active link there shows as a gold pill.
8. **Christian ceremony dress code** — split into Men/Women with Indian options (saree/anarkali) + western; tag "Cocktail · Western or Indian".
9. **RSVP message** — replaced with the July-31 peak-season copy.
10. **Baraat & Reception attire** — TEXT: Men add "jodhpuri", "tailored tuxedo"→"black tuxedo"; Women "finished with a maang tikka". IMAGE: recolored the man's figure to black w/ gold accents + added a centered, head-tilt-angled gold maang tikka on the bride (done via Python/Pillow pixel edit, not AI repaint).
11. **Events section → day carousel** — replaced the long vertical stack with a horizontal carousel: clickable date tabs under "Wedding Events" (weekday + date + title), prev/next arrows (desktop; hidden mobile), swipe support, height animates to the active day. Access-aware: 3 tabs (full) default to Christian Ceremony; 2 tabs (limited) default to The Warm-Up. JS: `initEventsCarousel()` called at end of `attemptLogin()`.
12. **Icon animations** — tried subtle CSS animations on event icons; **user did not like them — REVERTED.** Icons are static. (Do not re-add unless asked.)

---

## DONE (session 2 — 2026-05-27 continued)
13. **Outfit-card hover animation removed** — `.outfit-card` no longer lifts/shadows on hover; static images only.
14. **Attire illustrations replaced** — `final_attire.png` delivered by user. Python/Pillow script extracted all 5 couples (correct cell boundaries: top row 0–494, bottom row 532–973; gap col ≈719). Background removed via flood-fill from edges (threshold 22). Each saved as individual transparent PNG: `assets/attire/attire-{christian,haldi,sangeet,wedding,baraat}.png`. CSS updated from sprite sheet to per-file `background-image`.
15. **"Where to Shop" redesigned** — renamed to **"A Few Places We Recommend"**; replaced flat pill links with two collapsible accordion sections: "Ready to Wear" (Lashkaraa $, Andaaz $, Kalki $$, Nishly $$, Basanti $$–$$$, Pernia's $$$) and "Rental Options" (Aayka, All Borrow, Marigold, Glamourental, Couture Encore). Each section toggles independently via `toggleShop()`. Links open in new tab.
16. **Whitespace tightened — Attire section** — `#clothing` padding reduced to 1.5rem. Gold decorative divider added between "What to Wear" heading and outfit grid. Outfit grid (`border-radius:4px 4px 0 0`, no bottom border) connects flush with shop-links (`border-radius:0 0 4px 4px`, no top border) as one visual card.
17. **Whitespace tightened — Travel & Visa** — `#travel` padding reduced to 1.5rem; section-heading margin-bottom 1rem; info-cards margin-bottom 1rem; accom-box margin-top 0, styled with explicit borders to delineate it from the cards above.
18. **Whitespace tightened — Useful Information** — `#info` padding reduced to 1.8rem.
19. **Hero title enlarged** — `h1` font: `clamp(2.8rem,7vw,6rem)` (was 3.8rem max); subtitle `clamp(1.6rem,3.2vw,2.6rem)`; date 1.35rem; venue 1.1rem; hero-content padding reduced. Title block now fills more of the full-screen hero, letting the background artwork show prominently in the remaining space.

---

## NEXT / OUTSTANDING

### A. Attire illustrations — COMPLETE
Individual transparent PNGs at `assets/attire/attire-{christian,haldi,sangeet,wedding,baraat}.png`. Source is `final_attire.png` (1536×1024). Old sprite sheet files remain as backup. See item 14 above for crop details.

### B. Pre-launch essentials (not started)
- **Real guest list** in `GUEST_LIST` (currently 2 placeholders).
- **RSVP backend = Google Sheet via Apps Script Web App.** `handleRSVP()` now POSTs (fetch, `mode:'no-cors'`, form-urlencoded) all fields + access tier to `RSVP_ENDPOINT` (a `var` near the top of the `<script>`, currently EMPTY). Apps Script code is in `rsvp-google-apps-script.gs`. SETUP REMAINING: create a Google Sheet → Extensions ▸ Apps Script → paste the .gs → Deploy ▸ New deployment ▸ Web app, "Execute as: Me", "Who has access: Anyone" → copy the `/exec` URL → paste it into `RSVP_ENDPOINT`. With the endpoint empty the form still shows the confirmation but records nothing. (Note: `no-cors` means we can't read the response, so confirmation is shown optimistically on a resolved fetch.)
- Registry details, shop links (currently `href="#"`), and contact details are placeholders.

---

## KEY TECHNICAL NOTES
- Everything is in `index.html`. Editing image *data* (base64) is impractical; change asset filenames/positions in CSS/JS instead.
- Icons: `.tl-icon` spans get sprite classes assigned in JS (`ICON_CLASSES` map) at load. Detail icons (flight/transport/visa/accommodation) similar.
- Design tokens (CSS vars): navy `#1B3A5C`, gold `#B8943E`, cream `#FAF6EE`, etc. Fonts: Cormorant Garamond, Josefin Sans, Great Vibes, EB Garamond.
- `style-previews.html` is a separate design-mockup file, not the live site.
- When verifying in the preview tool, note its screenshots can lag a frame behind JS state — trust `eval` readouts over a single screenshot.

---

## CHANGELOG
- 2026-05-27: Items 1–12 above completed. Icon animations reverted per user. Handoff file created.
- 2026-05-27 (session 2): Items 13–19 completed. New attire images, shop accordion, whitespace tightening, hero enlargement.
- 2026-05-27 (session 3 cont.): RSVP backend wired up. Apps Script Web App + Google Sheet (`rsvp-google-apps-script.gs`); `var RSVP_ENDPOINT` in `<script>` holds the `/exec` URL; `handleRSVP()` does a no-cors form-urlencoded POST. Also added "already RSVP'd" UX, gated on the SHEET (source of truth), NOT localStorage: `attemptLogin` hides both `.rsvp-form` and `#rsvp-already`, then calls `checkRSVPStatus(first,last,cb)` which JSONPs `doGet?action=check&firstName=&lastName=&callback=` (JSONP because Apps Script has no CORS); if a matching row exists → `showAlreadyRSVPd(m)` panel (personalized "Daksh, you've already RSVP'd", warm thank-you, link to #questions), else show the form. Fails open to the form on any error/timeout (onload+onerror+10s backstop). Deliberately no localStorage cache: if a row is manually deleted from the sheet, the site reflects it on next login. (Requires the Apps Script redeploy that adds the `action=check` handler.) FIXED Sheets formula-parsing bug where phone "+1 (555) ..." became `#ERROR!` — `doPost` now `setNumberFormat('@')` on columns 2–9 *before* `setValues`, so phone/notes are stored literally even when they start with `+ = - @`. Required redeploy of the Web App (new version) after pasting the updated `.gs`.
- 2026-05-27 (session 3 cont.): Removed all em dashes (—) from site copy + pop-up modals (18 total incl. one `&mdash;`), rewritten with commas/colons or reworded so it doesn't read AI-generated. En dashes in date/number ranges (e.g. "22nd – 24th", "$$–$$$") intentionally kept.
- 2026-05-27 (session 3 cont.): Fixed accommodation left-align bug on wide desktop — `#travel .accom-box` had `margin:0` (killed horizontal centering); restored `max-width:var(--content-width); margin:0 auto` so it aligns with the info-cards at all widths. Made travel subsection dividers 2px (thicker). Enlarged itinerary `.tl-icon` 78→108px desktop (60→80px mobile), grid icon column 84→112px, `margin:0 auto` + `align-items:center` keeps all icons uniform size & vertically centered.
- 2026-05-27 (session 3 cont.): Fixed nav indicator lighting FAQ on login. The active-section IIFE ran once at load while `#main-site` was `display:none` (all sections measured at top=0 → last section "FAQ" selected) and never recomputed after login. Fix: guard `onScroll` so when `scrollY <= 5` (hero/welcome "home" zone) no pill is lit and the E&D crest is home-active; also dispatch a scroll event at end of `attemptLogin`.
- 2026-05-27 (session 3): Attire couples re-cropped from new high-res files (3840×2560, couple was centered with ~1000px transparent padding) → tight crop; then normalized so each couple's BODY height matches (measured feet→shoulders excluding raised arms) on a uniform 2179×2126 canvas, feet-aligned, so all 5 render optically the same size. Reduced `.attire-figure` height 380→270px (mobile keeps 380 via media query) to remove ~125px of empty headroom above each width-constrained couple, tightening the inter-row gap. Hero h1 weight 400→600, subtitle/date →500. Tightened #clothing heading→attire gap. Combined #travel into one connected box (info-cards + accom-box share borders, vertical/horizontal divider lines between subsections). Combined #info accordion into one box (items share divider lines, no gaps).
