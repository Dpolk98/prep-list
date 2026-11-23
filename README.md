# Prep Tracker

A small web app for tracking emergency supplies: food, water, toiletries, first aid, gear, and more.

## First visit

When a browser has no saved data, a welcome popup asks whether you're new or have used the app before.

- **New**: opens the **Welcome** guide, a quick tour of what the app does with a clear reminder to export a backup regularly (your data lives only in that browser). **Get started** then opens a short, three-step setup: how long you're preparing for (tapping a tier moves straight on), how many people you're preparing for (with − and + buttons), and your Local Hazards (optional). A progress bar shows the step, **Back** returns to the one before, and nothing is saved until **Finish**, so setup simply starts again if the app is closed partway through. **Run setup again**, at the bottom of the Settings page, goes through the same three steps with your current answers filled in; it can be cancelled (step 1's **Cancel**, or Escape), and nothing changes until **Finish**.
- **Returning**: offers to import a backup right away, or to start fresh.

The guide can be read again from the About section on the Settings page.

## Prep tiers

On first use you choose how long you're preparing for. You can change it any time on the **Settings** page.

| Tier | Focus | Emergency cash goal (at $500/week) | Investment goal | Total |
| --- | --- | --- | --- | --- |
| 1 Week | Shelter in place: stored supplies that need no power or running water | $500 | $750 | $1,250 |
| 1 Month | Extended disruption: cook without power, purify water, handle sanitation | $2,143 | $3,215 | $5,358 |
| 1 Year | Long-term self-reliance: renewable water, bulk staples, generated power, skills | $26,071 | $39,107 | $65,178 |
| Beyond | Sustainable living: production, skills, and community | $500/week × years you choose | 1.5 × cash goal | Both together |

Each tier builds on the ones below it. Every category page has a collapsible **What to buy** list of suggested supplies for your tier, followed by the lower tiers' suggestions as "foundations". Tap **Add** on a suggestion to log it in your inventory; items you already have are marked "In inventory". The weekly savings baseline can be changed. The investment goal is always 1.5 times the emergency cash goal. Tier content lives in `tiers.js`.

## Local Hazards

The last step of first-use setup asks which hazards apply where you live (leaving them blank is fine). They can be changed any time on the **Settings** page, in the **Local Hazards** card. The choices are winter storms, extreme heat, hurricanes, tornadoes, floods, wildfire, and earthquakes. Each one adds a few suggestions, whatever your tier, since they depend on the place rather than how long you're preparing for. They appear on the category pages' **What to buy** lists and on Plans and Skills, in a section headed with the hazard's name ("Winter storms · Local Hazards"), right after your tier's own suggestions. A suggestion shared by two chosen hazards is listed once. With none chosen, What to buy ends with a short pointer to Settings. Chosen hazards also show on the Overview's plan card, as buttons: tapping one shows everything it adds, with its supply suggestions grouped by category (marked **In inventory** when you have them, with a link to that category's What to buy list), its plans and skills, and related Quick reference cards that open straight to the card. They also show on the printed summary, and they're included in backups. Hazard content lives in `hazards.js`.

## Pages

The ☰ menu in the top left opens these pages. Each one has its own link, such as `#/water`.

- **Overview**: summary stats, your tier's focus, and a card for savings and each category
- **Savings** (right after Overview in the menu): two cards, **Emergency cash** and **Investments**, each with its own amount, goal, and progress bar. The Overview's Savings card adds the two together. Below them, why savings matter most once a disruption lasts more than a few days, and how to build them steadily
- **Category pages**: Water, Food (including stove fuel and cookware), Medical and First Aid, Toiletries and Hygiene, Light and Power, Documents, Other (tools, shelter and bedding, go-bags, masks, fire extinguishers, pets, baby supplies, and books and games). Each page shows a collapsible list of suggested supplies (for your tier and the tiers below it), its inventory, and an add-item form. Items can only be added from their own category page, so the form only offers that category's types.
- **Expired** and **Expiring soon**: tap those tiles on the Overview to see the matching items from every category, grouped by category. Editing an item there opens it on its category page
- **Plans and Skills**: an always-open list of things to set up (plans, training, community)
- **Grab list**: what to take if you ever need to leave in a hurry, as two numbered lists: **If you have 5 minutes** and **If you have 15 minutes** (everything in the first list, then these). It starts with a suggested list built on the "5 Ps" (people and pets, papers, prescriptions, personal needs, and priceless items). Each entry has a checkbox to tick off once it's grabbed; ticks are saved, each list shows how many are done, and **Uncheck all** resets it. Under each entry, small text shows where that kind of item is kept, taken from your inventory: each starter entry goes with a category (and sometimes particular types), and your own entries can choose one under **Goes with**. An entry can also be linked to a single inventory item, which shows that item's location and flags it if it's expired or expiring soon, or have a location typed in. So that a stray tap while checking things off can't open anything, changes happen in edit mode: **Edit list** at the bottom of the page shows **Add to this list** on each list and lets you tap an entry to change or remove it, and **Done editing** (or leaving the page) switches back. The grab list also appears on the printed summary and in low-battery mode
- **Quick reference**: short how-tos for when the power or water is out: purifying water (with a bleach table), keeping food safe without power, generators and carbon monoxide, shutting off utilities, power outages, staying warm, staying cool, toilets and sanitation, basic first aid, and staying in touch. Each is a card that opens and closes, with **Expand all** / **Collapse all** above them. The content follows widely published guidance from the CDC, EPA, USDA, FEMA, and the Red Cross, lives in `reference.js`, and is saved on the device, so it works with no connection
- **Print summary**: everything on hand as a plain document for paper, for when a phone is dead or the power is out. It shows household size and tier, an "at a glance" block (items, days of water, a rough count of days of food, and expired and expiring counts), your grab list, a **Use or replace soon** table, and the full inventory as tables grouped by category or by storage location (locations that differ only in capitals or spacing are combined). Savings amounts are left off unless **Include savings amounts** is ticked, since anyone who finds a printout can read it. **Include quick reference** adds the Quick reference cards in two columns, starting on a new page so they can be posted on their own. **Print or save as PDF** opens the browser's print screen, and the print styles hide the app's menu and controls so only the summary prints in black and white. On a phone screen, the preview shows each item as a short labelled block
- **Low-battery mode** (at the bottom of the ☰ menu, and on the Settings page): for a power outage, one plain screen on true black, which an OLED phone screen doesn't light at all, with no animations. It shows only the essentials: days of water and food, expired and expiring counts, a **Use first** list, **Where things are** (everything grouped by storage location), the Quick reference cards, and tips for making the battery last. The phone's status bar turns black to match. It stays on, even if the app is closed and opened again, until you tap **Leave**, and it doesn't change your data. On phones and browsers that report the battery level (Android and Chrome, not iPhone), the Overview suggests it once the battery is at 20% or below and not charging. Whether it's on is kept under `prep-tracker:low-power`
- **Settings**: household size, how long you're preparing for (your tier), Local Hazards, the Year in review, low-battery mode, and exporting or importing a backup, plus an About section with a link to support the app on Ko-fi, and **Run setup again** at the bottom

## Year in review

Once a year, on the anniversary of when you started, a **Year in review** card appears at the top of the Overview ("One year of being prepared"). **See your year** opens the review with a short shower of confetti (skipped if the device is set to reduce motion), and **Maybe later** puts the card away until next year. The review can be opened any time from the **Settings** page, where it covers the last 12 months, or your time so far if you started more recently.

It shows:

- **Then and now** for items on hand, days of water, a rough count of days of food, and savings, each compared with the earliest month in the review
- **Month by month**: a bar chart of any of the four, one bar per month
- **Highlights**, only ones that are true: how many items you added and your busiest month, how many categories have supplies, items added straight from the What to buy suggestions, moving up a tier, and having nothing expired
- **Looking ahead**: progress bars toward your tier's water, food, and savings goals

The app keeps one small snapshot per month (items, water, food, savings, and tier), updated whenever you save and when the app opens. Opening the app doesn't count as a change for the backup reminder. Months from before snapshots were kept are worked out from the dates items were added, using what you have now, so savings history starts from the first recorded month. When you started is saved as well, or taken from the earliest date an item was added. Both are part of backups. Whether this year's review has been seen is kept separately under `prep-tracker:review`.

## Estimated expiration dates

Every item has a **type** within its category, for example Food → *Canned meat and fish*, *White rice (bagged)*, or *Freeze-dried meals*. As you type the name, the app suggests a type; once you pick one yourself, it stays put.

The expiration date is optional. If you leave it blank, the app estimates one from the type's typical unopened shelf life (for example: canned meat about 3 years, canned fruit about 18 months, bagged white rice about 2 years, alkaline batteries about 10 years). Types that don't normally expire, such as salt or a can opener, get no date.

The form shows the estimate before you save. Estimated dates are labeled "est." in the list. Edit the item and enter the printed date to replace the estimate. Types, shelf lives, and the name-matching rules live in `shelf-life.js`.

## Barcode scanning

On every category page, the add section sits above the inventory list, so adding something is the first thing you see, and the full add form stays folded away until it's needed. On the Food page it starts with two side-by-side buttons, **Scan a barcode** and **Enter manually**; other categories have no scanner, so they show one **Add an item** button. The form also opens when you edit an item or tap **Add** on a What to buy suggestion, and it folds back after an item is added.

**Scan a barcode** opens the camera. Hold the barcode level inside the frame and it's read on its own, usually within a second. It reads grocery barcodes: EAN-13, UPC-A, EAN-8, and UPC-E.

- **Something new**: the number is looked up on [Open Food Facts](https://world.openfoodfacts.org), a free, open food database. Only the barcode number is sent. **Use these details** fills in the add form with the product's name, a type (from the product's categories or its name), a unit from its packaging (cans, jars, boxes, and so on), a quantity of 1, and its calories from the label. Change anything you like, or just tap **Add item**. The barcode and label figures are saved with the item
- **Something you already have** (same barcode): **Add one** or **Use one** right from the scanner, which is handy when putting groceries away or taking things out of storage, or **Add as a new item** (for example, a second batch with a different date)
- **Not in Open Food Facts**: **Fill in myself** keeps the barcode with the item, so it's recognized next time
- **No connection**: the lookup can be tried again. Recognizing things already in your inventory works offline
- **No camera**, or camera access turned off: **Take a photo** reads the barcode from a picture, or **Or type the number** looks up the digits printed under it. Typed numbers are checked first, so a typo is caught before any lookup

Barcodes are read by the browser's own reader where there is one (Android and desktop Chrome), and otherwise by `barcode.js`, a small reader written for this app with no outside library. It reads straight lines across the picture, checks each code's check digit, and in the camera view only accepts a code read on two lines (or in two frames in a row), so a misread is very unlikely. The camera and lookup code is in `scan.js`. The camera only works over https (as on GitHub Pages) or on `localhost`.

## Calorie estimate

The Food page opens with a rough estimate of the calories in your food inventory, and about how many days that would feed your household at 2,000 calories per person per day. A bar shows progress toward your tier's goal (up to a year).

It's worked out from each item's type, quantity, and unit, and it leans low on purpose, so it's more likely to come in under the real number than over it:

- Calorie figures sit near the low end of what's typical for each type, with the smaller common package size for each container (a 2 lb bag of rice, a 15 oz can, a 25 lb bucket)
- Most types also check the item's name, since calories can vary a lot within a type: Spam counts for far more than tuna, canned beans for more than green beans, and broth for almost nothing. A name that doesn't match anything gets the type's cautious default. Items filed under *Other shelf-stable food* use the figures for whatever type their name suggests
- Besides each type's own units, it understands weights (lb, oz, kg, and g), kitchen measures (cups, quarts, liters, and tablespoons), servings (by typical label sizes), cases (12 cans, jars, or bottles), and sizes or counts written into the unit, such as "25 lb bags", "cans (15 oz)", or "24-pack". "Each", or no unit, counts as one of the smallest container the item comes in
- Items added by scanning a barcode use their own label's calories instead (calories per 100 g and the package size, from Open Food Facts), when the unit is a package, a weight, a case, or a count. They show "from the label" rather than "est."
- Not counted: expired items, infant formula and baby food, and things with few or no calories (fuel, cookware, seeds, spices, coffee, and tea)

Each food item shows its own estimate, such as "About 1,200 est." Items with a unit the estimate can't convert are named on the panel so they can be fixed. The panel says plainly that it’s only an estimate. Tap **How it works** for how it’s worked out and what isn’t counted; that section starts closed to save space. Labels give the exact numbers. The figures live in `calories.js`, and the unit handling shared with the water estimate lives in `units.js`.

## Features

- Add, edit, and delete items with category, quantity, unit, expiration date, storage location, and notes
- On phones and tablets, number fields open the number pad instead of the full keyboard. Quantity's pad includes a decimal point, so you can enter amounts like 0.5 gallons
- Tapping a number field highlights the number already in it, so typing a new one replaces it without deleting the old one first
- Quantity and unit unlock once you choose a type, and the unit list fits that type (canned beans: cans, #10 cans, jars; freeze-dried meals: pouches, #10 cans, buckets, servings, meals). The most common unit is selected for you. Choose **Other…** to type your own; units you've typed before are added to that type's list
- Items that are expired or expire within 60 days are flagged and sorted to the top
- Once a category has more than 3 types of item, its inventory is split into collapsible groups: one per type, or for Food, one per section (Canned and jarred, Dry staples, Snacks…). Each heading sits on a lightly shaded strip with a small green icon for its section or type, and shows its item count, with any expired or expiring items on a line under the name. Groups that need attention open on their own and come first; the rest follow the Type list. Search and the status filter open every group with a match. Open or closed groups are remembered, and **Expand all** / **Collapse all** sits above the list
- **Days of water** estimate: 1 gallon per person per day, based on household size. It understands gallons, quarts, pints, cups, liters, mL, fl oz, 500 mL bottles, cases of 24, 1-gallon jugs, and sizes written into the unit ("5-gallon jugs", "24-pack", "case of 35"). Purification tablets, bleach, and filters aren't counted as water, and items with a unit it can't convert are named on the Water page so they can be fixed
- **Calorie estimate** on the Food page: a rough, deliberately low count of your food's calories and how many days it would last your household
- Search, plus filters by category and status
- Each item shows its details on separate rows (quantity, type, estimated calories for food, expiration, location, and notes). Its ⋯ menu has **Use one** and **Add one** (the menu stays open for repeat taps), **Edit** and **Delete**
- Export and import a JSON backup. The Backup card on Settings shows when you last exported one from this device. An imported file is checked before anything is replaced: a file that isn't JSON, isn't a Prep Tracker backup, or has damaged items (no name, an unknown category, a quantity that isn't a number, an expiration date that isn't a date, or a repeated id) or damaged settings is turned away with a message saying what's wrong, and nothing changes. If the imported data can't be saved to the browser, what was there before is kept
- **Backup reminders**: once something has changed since your last backup, a calm note on the Overview appears after 30 days without a backup or after 5 changes to your items (adding, editing, deleting, or using one), whichever comes first. It offers **Export backup** or **Remind me later** (a week). Exporting clears it, and importing a backup counts as up to date, since what's on the device then matches a backup file. If nothing has changed, there's no note
- Works offline: on the first visit, `sw.js` (a service worker) saves the app's own files on the device, so it opens with no connection. When online, it always loads the newest version and refreshes the saved copy, waiting up to 3 seconds on a weak signal before falling back to it. Settings → About says when the app is saved. This covers the app itself, not your data, which stays in `localStorage` as described below
- Adapts to light and dark mode and fits phone screens
- Has its own app icon (a checklist on green) in browser tabs and when added to a phone's home screen. The icon files are in `icons/`, and `manifest.webmanifest` describes the app to phones. Opened from the home screen, it runs full-screen like an installed app. On iPhone, a home-screen copy keeps its own data, separate from Safari's, so export a backup before removing it from the home screen

## Running it

No install or build step is needed. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Tests

Unit tests cover the estimates in `units.js`, `calories.js`, `shelf-life.js`, and `barcode.js`. They use Node's built-in test runner (Node 22 or later), so there is nothing to install:

```bash
npm test
```

`tests/load.js` loads the app's scripts into one sandbox, in the same order as `index.html`, so the tests call the same functions the page does. The barcode tests draw their own scanlines from the published bar widths, so no image files are needed.

## Data

Everything is saved in the browser's `localStorage` under the key `prep-tracker:v1`. Which inventory groups you've opened is kept separately under `prep-tracker:open-groups`, the backup reminder's details (last export, first change since then, item changes since then, and "remind me later") under `prep-tracker:backup`, and the last Year in review celebrated under `prep-tracker:review`. None of these are part of backups. Data is per browser and per device, so use **Export backup** on the Settings page to keep a copy or move it to another device.
