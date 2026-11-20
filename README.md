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

Each tier builds on the ones below it. Every category page has a collapsible **What to buy** list of suggested supplies for your tier, followed by the lower tiers' suggestions as "foundations". Tap **Add** on a suggestion to log it in your inventory; items you already have are marked "In inventory". The weekly savings baseline can be changed. Tier content lives in `tiers.js`.

## Pages

The ☰ menu in the top left opens these pages. Each one has its own link, such as `#/water`.

- **Overview**: summary stats, household size, your tier's focus, and a card for each category
- **Category pages**: Water, Food, Medical & First Aid, Toiletries & Hygiene, Light & Power, Tools & Gear, Documents & Cash, Other. Each page shows a collapsible list of suggested supplies (for your tier and the tiers below it), its inventory, and an add-item form. Items can only be added from their own category page, so the form only offers that category's types.
- **Plans & Skills**: a list of things to set up (plans, training, community)
- **Savings**: progress toward the tier's savings goal

## Estimated expiration dates

Every item has a **type** within its category, for example Food → *Canned meat & fish*, *White rice (bagged)* or *Freeze-dried meals*. As you type the name, the app suggests a type; once you pick one yourself, it stays put.

The expiration date is optional. If you leave it blank, the app estimates one from the type's typical unopened shelf life (for example: canned meat about 3 years, canned fruit about 18 months, bagged white rice about 2 years, alkaline batteries about 10 years). Types that don't normally expire, such as salt or a can opener, get no date.

The form shows the estimate before you save. Estimated dates are labeled "est." in the list. Edit the item and enter the printed date to replace the estimate. Types, shelf lives and the name-matching rules live in `shelf-life.js`.

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
