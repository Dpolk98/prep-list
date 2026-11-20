# Prep Tracker

A small web app for tracking emergency supplies: food, water, toiletries, first aid, gear and more.

## Prep tiers

On first use you choose how long you're preparing for. You can change it any time from the header.

| Tier | Focus | Savings goal (at $500/week) |
| --- | --- | --- |
| 1 Week | Shelter in place: stored supplies that need no power or running water | $500 |
| 1 Month | Extended disruption: cook without power, purify water, handle sanitation | $2,143 |
| 1 Year | Long-term self-reliance: renewable water, bulk staples, generated power, skills | $26,071 |
| Beyond | Sustainable living: production, skills and community | $500/week × years you choose |

Each tier builds on the ones below it: its checklist is shown alongside the earlier tiers' checklists as "foundations". Water-storage items tick themselves when your inventory holds enough water. The weekly savings baseline can be changed. Tier content lives in `tiers.js`.

## Pages

The ☰ menu in the top left opens these pages. Each one has its own link, such as `#/water`.

- **Overview**: summary stats, household size, overall readiness, and a card for each category
- **Category pages**: Water, Food, Medical & First Aid, Toiletries & Hygiene, Light & Power, Tools & Gear, Documents & Cash, Other. Each page shows that category's checklist (for your tier and the tiers below it), its inventory, and an add-item form with the category already selected.
- **Plans & Skills**: checklist only
- **Savings**: progress toward the tier's savings goal

## Features

- Add, edit and delete items with category, quantity, unit, expiration date, storage location and notes
- Items that are expired or expire within 60 days are flagged and sorted to the top
- **Days of water** estimate: 1 gallon per person per day, based on household size (understands gallons, liters, oz, mL and 500 mL bottles)
- Search, plus filters by category and status
- Quick −/+ buttons for when you use or restock something
- Export and import a JSON backup
- Works offline, adapts to light and dark mode, and fits phone screens

## Running it

No install or build step is needed. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Data

Everything is saved in the browser's `localStorage` under the key `prep-tracker:v1`. Data is per browser and per device, so use **Export backup** to keep a copy or move it to another device.
