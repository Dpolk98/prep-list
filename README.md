# Prep Tracker

A small web app for tracking emergency supplies: food, water, toiletries, first aid, gear and more.

## Prep tiers

On first use you choose how long you're preparing for. You can change it any time on the **Settings** page.

| Tier | Focus | Savings goal (at $500/week) |
| --- | --- | --- |
| 1 Week | Shelter in place: stored supplies that need no power or running water | $500 |
| 1 Month | Extended disruption: cook without power, purify water, handle sanitation | $2,143 |
| 1 Year | Long-term self-reliance: renewable water, bulk staples, generated power, skills | $26,071 |
| Beyond | Sustainable living: production, skills and community | $500/week × years you choose |

Each tier builds on the ones below it. Every category page has a collapsible **What to buy** list of suggested supplies for your tier, followed by the lower tiers' suggestions as "foundations". Tap **Add** on a suggestion to log it in your inventory; items you already have are marked "In inventory". The weekly savings baseline can be changed. Tier content lives in `tiers.js`.

## Pages

The ☰ menu in the top left opens these pages. Each one has its own link, such as `#/water`.

- **Overview**: summary stats, your tier's focus, and a card for savings and each category
- **Savings** (right after Overview in the menu): progress toward the tier's savings goal, plus why savings matter most once a disruption lasts more than a few days, and how to build them steadily
- **Category pages**: Water, Food (including stove fuel and cookware), Medical & First Aid, Toiletries & Hygiene, Light & Power, Documents, Other (tools, shelter and bedding, go-bags, masks, fire extinguishers, pets, baby supplies, books and games). Each page shows a collapsible list of suggested supplies (for your tier and the tiers below it), its inventory, and an add-item form. Items can only be added from their own category page, so the form only offers that category's types.
- **Expired** and **Expiring soon**: tap those tiles on the Overview to see the matching items from every category, grouped by category. Editing an item there opens it on its category page
- **Plans & Skills**: an always-open list of things to set up (plans, training, community)
- **Settings**: household size, how long you're preparing for (your tier), and exporting or importing a backup

## Estimated expiration dates

Every item has a **type** within its category, for example Food → *Canned meat & fish*, *White rice (bagged)* or *Freeze-dried meals*. As you type the name, the app suggests a type; once you pick one yourself, it stays put.

The expiration date is optional. If you leave it blank, the app estimates one from the type's typical unopened shelf life (for example: canned meat about 3 years, canned fruit about 18 months, bagged white rice about 2 years, alkaline batteries about 10 years). Types that don't normally expire, such as salt or a can opener, get no date.

The form shows the estimate before you save. Estimated dates are labeled "est." in the list. Edit the item and enter the printed date to replace the estimate. Types, shelf lives and the name-matching rules live in `shelf-life.js`.

## Features

- Add, edit and delete items with category, quantity, unit, expiration date, storage location and notes
- On phones and tablets, number fields (quantity, household size, weekly savings baseline, years to cover) open a spinning number dial instead of the keyboard. **Saved so far** opens the number pad, so you can enter an exact amount
- Quantity and unit unlock once you choose a type, and the unit list fits that type (canned beans: cans, #10 cans, jars; freeze-dried meals: pouches, #10 cans, buckets, servings, meals). The most common unit is selected for you. Choose **Other…** to type your own; units you've typed before are added to that type's list
- Items that are expired or expire within 60 days are flagged and sorted to the top
- Once a category has more than 3 types of item, its inventory is split into collapsible groups: one per type, or for Food, one per section (Canned & jarred, Dry staples, Snacks…). Each heading shows its item count and any expired or expiring items. Groups that need attention open on their own and come first; the rest follow the Type list. Search and the status filter open every group with a match. Open or closed groups are remembered, and **Expand all** / **Collapse all** sits above the list
- **Days of water** estimate: 1 gallon per person per day, based on household size (understands gallons, liters, oz, mL and 500 mL bottles)
- Search, plus filters by category and status
- Each item shows its details on separate rows (quantity, type, expiration, location, notes). Its ⋯ menu has **Use one** and **Add one** (the menu stays open for repeat taps), **Edit** and **Delete**
- Export and import a JSON backup
- Works offline, adapts to light and dark mode, and fits phone screens

## Running it

No install or build step is needed. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Data

Everything is saved in the browser's `localStorage` under the key `prep-tracker:v1`. Which inventory groups you've opened is kept separately under `prep-tracker:open-groups` (it isn't part of backups). Data is per browser and per device, so use **Export backup** on the Settings page to keep a copy or move it to another device.
