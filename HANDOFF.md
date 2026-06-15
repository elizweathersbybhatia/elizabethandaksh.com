# Wedding Website — Handoff / Progress Log

**Project folder:** `/Users/daksh.bhatia/Desktop/elizabethandaksh.com`
**Main file:** `index.html` (single-file site — all HTML, CSS in `<style>`, and JS in `<script>` live here; ~660 lines but ~1.6MB because a background texture + icon sprite sheets are embedded as base64).

> **To resume in a new chat, paste this:**
> "Read `/Users/elizabethweathersby/Downloads/wedding-website/HANDOFF.md` and continue from the 'NEXT / OUTSTANDING' section. Keep this file updated as we work."

---

## How to preview the site
- Static site, no build step. Serve the folder and open `index.html`.
  - e.g. `python3 -m http.server 8756` from the project folder, then open `http://localhost:8756`.
- **Password gate:** the site is name-gated through the Apps Script API. Guest
  records come from the private `Login_Master` and `Household_Master` Google
  Sheet tabs; no guest list is embedded in `index.html`.
- **Access:** `both` guests see Monday, Tuesday, and Wednesday. `india` guests
  see Tuesday and Wednesday only.

---

## DONE (session 10 — 2026-06-14) — branch: pre-launch
25. **Nav redesigned** — logo (E&D crest) moved to far left as standalone `<a class="nav-home">` outside `<ul>`. Nav items right-aligned in flex row: Our Story | The Celebration | Travel | Attire | Registry | FAQ | RSVP. "Events" renamed to "The Celebration". RSVP is always a navy pill (`.nav-rsvp-pill`), never dimmed. Nav layout changed from 7-column grid to flex with `justify-content:space-between`. Active-section JS updated: `home` now found via `document.querySelector('nav .nav-home')` since it's outside `<ul>`. Nav crest JS simplified (link already in HTML, no longer built dynamically).
26. **Hero photo carousel** — 6 photos from `assets/photos/photo-1.jpg` through `photo-6.jpg` cycle every 5 seconds with 1.8s crossfade. "are getting married" subtitle removed. Text now: name / gold divider / date / venue. Cream overlay (`rgba(250,246,238,0.50)` at z-index:-4) sits between photos and existing gradient pseudo-elements to keep text readable.
27. **Countdown timer** — new `<section id="countdown">` inserted between hero and "Our Story". Shows Days / Hours / Minutes / Seconds. `initCountdown(invitedMonday)` called from `enterWebsite(m)`: 3-day guests count to Feb 22 2027, 2-day guests count to Feb 23 2027. Timer ticks every second.
28. **Registry section** — section made visible (was `display:none`), nav link now shows. Message updated: presence-is-the-gift copy + gift-box warning (shown to all). Honeymoon fund block (`#registry-fund`) is shown/hidden by `setupRegistry(m)` based on `m.guestGroup`; only the `Parents` bucket has the PayPal block hidden.
29. **Contact / Questions** — updated to Silver Slate Events: phone +91 88826 88816, email silverslateevents.wedding@gmail.com. Message preserved: planner reaches out after RSVP.
30. **RSVP deadline** — July 31 → August 31 (deadline text only; no other copy changed).
31. **Apps Script** — added `guestGroup: text(household.bucket)` to the `loginGuest` return object. This makes `m.guestGroup` available in the front-end for registry display logic. **Requires redeploy** (new version) before it takes effect on the live endpoint.

## DONE (session 9 — 2026-06-14)
24. **Font system updated** — redesign-2027 branch deleted; all work now on main. Font replacements across all CSS rules:
    - Headings: Cormorant Garamond (unchanged)
    - Subheading script (.section-script, .hero-amp, .o-num, .footer-names, #rsvp-confirmation): Great Vibes → Cormorant Garamond italic
    - Handwritten notes: Caveat added to Google Fonts (ready to use, not yet applied to any elements)
    - Navigation / labels / buttons / tags: Josefin Sans → Montserrat
    - Body copy / subtitles / inputs / descriptions: EB Garamond → Lora
    - Google Fonts URL updated: removed Josefin Sans, Great Vibes, EB Garamond; added Montserrat, Lora, Caveat

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

## DONE (session 3 — 2026-06-07)
20. **RSVP sheet columns fixed** — `RSVP_HEADERS` reordered to match expected schema. `saveRsvp` `valuesByHeader` aligned to the same order; removed stale `'Phone'` key; added `'Total Number of Guests'` (accepted + adults + children count) and `'Additional Adult Contacts'` (name + email + phone per adult, formatted as readable string).
21. **Additional adult contact fields** — split `cleanGuests` into `cleanAdults` (stores optional `email`, `phoneCountry`, `phone`) and `cleanChildren`. `index.html`: extracted `COUNTRY_CODES` to top-level; added `buildCountryOptions(selected)` helper (used by both the main phone field and guest-entry selects); `renderGuestFields` for adults now shows email input + country-code select + phone input; `readGuestFields` for adults now reads those three fields. `rsvpFromRow` already returns `additionalAdults` from JSON so contact info round-trips automatically.
22. **Sangeet photo fixed (locally only)** — 71,766 semi-transparent pixels composited against black background (new_rgb = old_rgb × alpha/255, new_alpha = 255). Backup at `assets/attire/attire-sangeet_2.backup.png`. **NOT pushed** — review locally first, then push separately.
23. **RSVP changes pushed to main** — commit `3ab68dc`. `rsvp-google-apps-script.gs` still needs to be redeployed as a new Apps Script version for the live endpoint to reflect these changes.

## DONE (session 11 — 2026-06-14) — branch: pre-launch
32. **RSVP deadline** — cancellation grace period updated from September 30 → October 31 (line ~557 of index.html).
33. **Hero carousel** — replaced `photo-1.jpg` through `photo-6.jpg` with all 15 engagement photos from `assets/photos/engagement/` (DSC02483–DSC02600 + IMG_3092–IMG_3227). Slides expand from 6 to 15.
34. **"A Note From Us" photo marquee** — replaced 6-photo set with all 28 photos from `assets/photos/our story/`. HEICs converted to JPG with `sips` (16 new .jpg files). Track now has 56 img elements (28 × 2 for seamless loop).
35. **Attire section redesigned** — full visual overhaul to match style-guide mockup:
    - **Header:** Large "Attire" title left-aligned, italic "Dress up, show up, let's celebrate." subtitle, intro text, and a 3-photo polaroid cluster on the right using 3 personal attire photos from `assets/photos/attire/` (HEIC→JPG converted). Polaroids have rotation + hover effects.
    - **Event table:** 6-column CSS grid (icon | event name | dress code | Men | Women | color swatches) for all 5 events. Each event uses the existing sprite icons (icon-christian/haldi/sangeet/pheras/baraat). Color swatches are 4 filled circles per event. Christian Ceremony row keeps `.christian-only` class. Cursive italic accents: "Wear Yellow!" (Haldi code col), "Something you can dance in!" (Sangeet women col).
    - **Footwear note:** Separated into its own `.attire-footwear` box with eyebrow label + script line + body.
    - **Tagline:** "When in doubt, a little extra is always just right." at bottom.
    - **Mobile:** Collapses to 2-col grid (icon+event | rest of columns). Dress code + swatches span full width.
    - **Removed:** Old `.outfit-card`, `.outfit-grid`, `.o-num`, `.o-event`, `.o-tag`, `.attire-figure`, `.figure-*` CSS. JS block that prepended attire illustrations removed.
    - **Shop links accordion** unchanged.
    - **Refinement (same session):** Merged the event-name and dress-code columns into a single `.attire-col-main` column (5 cols total instead of 6) with a larger event name (`clamp(1.45rem,2.8vw,1.8rem)`) to eliminate row whitespace. Polaroid images changed from personal HEIC photos → couple illustrations (`attire-christian_2.png`, `attire-haldi_2.png`, `attire-baraat_2.png`) with `object-fit:contain`. Christian ceremony swatches changed to pinks/pastels — no white/ivory (`#F2BFC9`, `#C47A8A`, `#1B3A5C`, `#9A5E72`) because bride wears white. Mobile layout: men + women now each span full width (2 cols) on mobile instead of side-by-side in a 72px/1fr grid.

## DONE (session 12 — 2026-06-14) — branch: pre-launch
36. **Attire section redesigned into lookbook cards** — replaced the compact table with five clearly delineated event cards. Desktop uses a three-column lookbook grid (two columns at tablet widths); mobile uses compact horizontal cards to limit scrolling. Each card follows the same order: couple illustration + vertical six-color palette, event title, standardized dress code, time/location/temperature, then men/women guidance.
37. **Attire content finalized** — dress codes standardized to `formality · culture`; indoor/outdoor labels added; redundant event mood copy and ad-lib callouts removed; turmeric-stains note removed. Pheras palette contains no reds and uses lighter daytime colors. Final palettes: Christian nature/navy/pink, Haldi yellow/orange, Sangeet bright celebratory jewel tones, Pheras light mixed colors, Reception ivory/beige/black/royal tones.
38. **Attire mobile refinement** — changed the phone layout from a cramped horizontal split to stacked cards. Illustrations are larger and centered with palettes beside them; titles are slightly smaller; the information area has more intentional padding and line height for easier reading.
39. **Two-day itinerary access refined** — guests who are not invited to Monday now also do not see the Tuesday, February 23 breakfast. The Wednesday, February 24 breakfast remains visible.
40. **Mobile navigation compacted** — reduced the mobile E&D crest from 86px to 48px, tightened the navigation bar padding, and preserved a comfortable hamburger touch target. Hero top padding was adjusted to match the shorter bar.
41. **Attire weather labels clarified** — every attire card now explicitly labels its temperature as the outdoor weather, including events held indoors.
42. **Desktop hero photo framing improved** — desktop engagement-photo backgrounds are anchored at the top so faces and heads are not clipped by the wide hero crop.
43. **Registry guest-group response fixed** — restored `guestGroup` to the Apps Script login response so the existing honeymoon-fund bucket filter can reveal the PayPal link to eligible guests. New deployment verified and `RSVP_ENDPOINT` updated to `AKfycbw24FeHBPo_vKh39OlpauSqImWkCdES_LWgYlDu5SB1n8JZ2N2wOQWZG1-FLEOZ4STE`.
44. **Registry filter simplified** — the full registry message and PayPal link now show to every guest group, including `Elizabeth & Daksh` and `Vir`; only the `Parents` bucket has the PayPal block hidden.
45. **FAQ section rebuilt from mockup** — replaced Useful Information with a responsive FAQ accordion containing attire, travel, accommodation, parking, plus-one, weather, food, open-bar, and dietary questions. Added matching planner and hotel check-in/check-out cards; mobile shows compact question rows with answers on demand.
46. **Travel and Questions reorganized** — moved the former Useful Information accordions under Travel, combined the planner introduction with the help copy, and simplified the final Questions section.
47. **Small visual refinements** — removed the gold active line beneath the E&D navigation crest and changed attire labels from `Outdoor weather` to `Outdoor Temp`.
48. **Travel section tightened** — renamed the section to `Travel & Stay`, reduced oversized icons and card padding, and moved hotel check-in/check-out times directly beneath the Riverview Retreat details.
49. **FAQ tone and support layout refined** — made the attire, food, and open-bar answers cheekier; kept the other practical answers direct; removed the redundant final Questions box and retained the planner contact card under the FAQ.
50. **Registry gift wording broadened** — removed the honeymoon-specific language so the contribution is framed as a gift toward building the couple's life together.
51. **Hero photography restored** — replaced the broad pale overlays with a subtle edge vignette and localized text backdrop, preserving full-color engagement photos while keeping the hero text readable.
52. **Section headings standardized** — all major content sections now use the same unboxed, centered heading structure, typography, sizing, and spacing. This includes Our Story, Wedding Events, Attire, Travel & Stay, Registry, RSVP, and FAQ. Registry and RSVP headings were moved outside their content boxes; the Attire-specific oversized/left-aligned header and decorative polaroid cluster were removed.
53. **Section rhythm standardized** — all main content sections now use the same 60px top and bottom padding at the current desktop and mobile breakpoints. Removed the one-off reduced spacing overrides previously applied to Attire, Travel, FAQ, and mobile Our Story.
54. **Attire desktop grid balanced** — moved the footwear note and shopping recommendations into a quieter sixth companion tile beside Baraat & Reception. The note was shortened to emphasize lawn-friendly footwear; the existing Ready to Wear and Rental Options accordions remain available inside the tile. Desktop is now a balanced 3×2 grid, tablet is 2 columns, and mobile remains a natural single-column stack.
55. **Responsive verification completed** — local browser checks confirmed all seven main headings are unboxed and use the same computed font size, every main section uses equal top/bottom padding, the six attire tiles align to equal heights on desktop, mobile has no horizontal overflow, and the companion tile stacks cleanly. `git diff --check` and inline JavaScript syntax validation pass.

## NEXT / OUTSTANDING

### BRANCH: pre-launch (not yet merged to main)
All current website work is on branch `pre-launch`. Continue from this branch in the next environment; review and merge to main when the pre-launch site is approved.

### C. Registry — COMPLETE
The PayPal pool link is set, and the registry filter hides the PayPal block only for the `Parents` bucket.

### D. Apps Script redeploy — COMPLETE (2026-06-14)
The new deployment returns `guestGroup` correctly and the website `RSVP_ENDPOINT` now points to it. The filtered PayPal registry link is available to eligible buckets.

### A. Attire illustrations — COMPLETE
Individual transparent PNGs at `assets/attire/attire-{christian,haldi,sangeet,wedding,baraat}.png`. Source is `final_attire.png` (1536×1024). Old sprite sheet files remain as backup. See item 14 above for crop details.

### A2. Sangeet + Christian photos — COMPLETE (commit `33ca99d`)
User supplied new photos (`Downloads/attire-sangeet_2.png`, `Downloads/attire-christian_2.png`). Background removed via edge flood-fill (threshold 40) + interior near-bg pass (threshold 18). Christian canvas cropped to feet+16px. CSS `--figure-width` updated: christian 92%→94.5%, sangeet 94.8%→95.2% to normalize rendered body height to ~336px (matching haldi). Pushed to main.

### A3. Redeploy Apps Script
After updating `rsvp-google-apps-script.gs`, paste the new code into the Apps Script editor and deploy a **new version** (not "Update deployment" on the same version — click "New deployment" or "Manage deployments > New version"). The `/exec` URL stays the same.

### B. Pre-launch essentials (not started)
- **Guest login + household RSVP backend implemented locally.** The public site no longer contains a `GUEST_LIST`. Login uses the Apps Script endpoint, which privately reads `Login_Master` and `Household_Master` from the attached Google Sheet. Named household members have unique logins and individual accepted status. Unnamed adults require first and last names; children require first name, last name, and age. Responses are stored one row per household and can be updated to add unused seats. See `RSVP_SETUP.md`.
- **Local guest preview enabled.** `local-guest-data.js` contains the 224 generated
  logins for local testing and is ignored by Git. Local RSVP edits use browser
  `localStorage`; production continues to use Apps Script and Google Sheets.
- **Deployment still required.** Import the workbook's `Login_Master` and `Household_Master` tabs into the RSVP Google Sheet, replace the deployed Apps Script with `rsvp-google-apps-script.gs`, and publish a new Web App version. Until that is done, the live endpoint still runs the prior API and the new login will not work.
- **Guest workbook privacy.** `wedding_website_guest_master_final.xlsx` remains local but is now ignored and staged for removal from future Git commits. The older committed copy still exists in Git history unless history is separately rewritten.
- Shop links, planner contact details, hotel details, registry PayPal link, and the current RSVP endpoint are populated.

---

## KEY TECHNICAL NOTES
- Everything is in `index.html`. Editing image *data* (base64) is impractical; change asset filenames/positions in CSS/JS instead.
- Icons: `.tl-icon` spans get sprite classes assigned in JS (`ICON_CLASSES` map) at load. Detail icons (flight/transport/visa/accommodation) similar.
- Design tokens (CSS vars): navy `#1B3A5C`, gold `#B8943E`, cream `#FAF6EE`, etc. Fonts: Cormorant Garamond (headings/script), Montserrat (nav/labels/buttons), Lora (body/inputs), Caveat (loaded, not yet used).
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
- 2026-06-07 (session 4): Items 20–23 completed. RSVP sheet columns fixed, additional adult contact fields added to form and Apps Script, sangeet photo fixed locally (not pushed). See NEXT/OUTSTANDING for redeploy instructions.
- 2026-06-08 (session 5): Replaced sangeet and christian attire illustrations with new user-supplied photos. Background removed (edge flood-fill + interior pass). Christian canvas cropped to normalize foot position. CSS figure-width adjusted to keep all 5 couples at ~336px rendered body height. Fixed preview server launch.json (was serving wrong directory). Pushed commit `33ca99d`.
- 2026-06-08 (session 5 cont.): Replaced haldi and baraat attire illustrations with new user-supplied photos using same pipeline. haldi 97.2%→96.4%, baraat 92.3%→93.7%. Pushed commit `3e255ca`. All 5 attire illustrations now replaced.
- 2026-05-27 (session 3): Attire couples re-cropped from new high-res files (3840×2560, couple was centered with ~1000px transparent padding) → tight crop; then normalized so each couple's BODY height matches (measured feet→shoulders excluding raised arms) on a uniform 2179×2126 canvas, feet-aligned, so all 5 render optically the same size. Reduced `.attire-figure` height 380→270px (mobile keeps 380 via media query) to remove ~125px of empty headroom above each width-constrained couple, tightening the inter-row gap. Hero h1 weight 400→600, subtitle/date →500. Tightened #clothing heading→attire gap. Combined #travel into one connected box (info-cards + accom-box share borders, vertical/horizontal divider lines between subsections). Combined #info accordion into one box (items share divider lines, no gaps).
