# Prep Tracker

A small web app for tracking emergency supplies: food, water, toiletries, first aid, gear and more.

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
