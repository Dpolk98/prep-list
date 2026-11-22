# Prep Tracker

A small web app for tracking emergency supplies: food, water, toiletries, first aid, gear, and more.

## First visit

When a browser has no saved data, a welcome popup asks whether you're new or have used the app before.

- **New**: opens the **Welcome** guide, a quick tour of what the app does with a clear reminder to export a backup regularly (your data lives only in that browser). **Get started** then asks how long you're preparing for.
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

## Pages

The ☰ menu in the top left opens these pages. Each one has its own link, such as `#/water`.

- **Overview**: summary stats, your tier's focus, and a card for savings and each category
- **Savings** (right after Overview in the menu): two cards, **Emergency cash** and **Investments**, each with its own amount, goal, and progress bar. The Overview's Savings card adds the two together. Below them, why savings matter most once a disruption lasts more than a few days, and how to build them steadily
- **Category pages**: Water, Food (including stove fuel and cookware), Medical and First Aid, Toiletries and Hygiene, Light and Power, Documents, Other (tools, shelter and bedding, go-bags, masks, fire extinguishers, pets, baby supplies, and books and games). Each page shows a collapsible list of suggested supplies (for your tier and the tiers below it), its inventory, and an add-item form. Items can only be added from their own category page, so the form only offers that category's types.
- **Expired** and **Expiring soon**: tap those tiles on the Overview to see the matching items from every category, grouped by category. Editing an item there opens it on its category page
- **Plans and Skills**: an always-open list of things to set up (plans, training, community)
- **Settings**: household size, how long you're preparing for (your tier), and exporting or importing a backup, plus an About section with a link to support the app on Ko-fi

## Estimated expiration dates

Every item has a **type** within its category, for example Food → *Canned meat and fish*, *White rice (bagged)*, or *Freeze-dried meals*. As you type the name, the app suggests a type; once you pick one yourself, it stays put.

The expiration date is optional. If you leave it blank, the app estimates one from the type's typical unopened shelf life (for example: canned meat about 3 years, canned fruit about 18 months, bagged white rice about 2 years, alkaline batteries about 10 years). Types that don't normally expire, such as salt or a can opener, get no date.

The form shows the estimate before you save. Estimated dates are labeled "est." in the list. Edit the item and enter the printed date to replace the estimate. Types, shelf lives, and the name-matching rules live in `shelf-life.js`.

## Calorie estimate

The Food page opens with a rough estimate of the calories in your food inventory, and about how many days that would feed your household at 2,000 calories per person per day. A bar shows progress toward your tier's goal (up to a year).

It's worked out from each item's type, quantity, and unit, and it leans low on purpose, so it's more likely to come in under the real number than over it:

- Calorie figures sit near the low end of what's typical for each type, with the smaller common package size for each container (a 2 lb bag of rice, a 15 oz can, a 25 lb bucket)
- Most types also check the item's name, since calories can vary a lot within a type: Spam counts for far more than tuna, canned beans for more than green beans, and broth for almost nothing. A name that doesn't match anything gets the type's cautious default. Items filed under *Other shelf-stable food* use the figures for whatever type their name suggests
- Besides each type's own units, it understands weights (lb, oz, kg, and g), kitchen measures (cups, quarts, liters, and tablespoons), servings (by typical label sizes), cases (12 cans, jars, or bottles), and sizes or counts written into the unit, such as "25 lb bags", "cans (15 oz)", or "24-pack". "Each", or no unit, counts as one of the smallest container the item comes in
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
- Export and import a JSON backup
- Works offline: on the first visit, `sw.js` (a service worker) saves the app's own files on the device, so it opens with no connection. When online, it always loads the newest version and refreshes the saved copy, waiting up to 3 seconds on a weak signal before falling back to it. Settings → About says when the app is saved. This covers the app itself, not your data, which stays in `localStorage` as described below
- Adapts to light and dark mode and fits phone screens
- Has its own app icon (a checklist on green) in browser tabs and when added to a phone's home screen. The icon files are in `icons/`, and `manifest.webmanifest` describes the app to phones. Opened from the home screen, it runs full-screen like an installed app. On iPhone, a home-screen copy keeps its own data, separate from Safari's, so export a backup before removing it from the home screen

## Running it

No install or build step is needed. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Data

Everything is saved in the browser's `localStorage` under the key `prep-tracker:v1`. Which inventory groups you've opened is kept separately under `prep-tracker:open-groups` (it isn't part of backups). Data is per browser and per device, so use **Export backup** on the Settings page to keep a copy or move it to another device.
