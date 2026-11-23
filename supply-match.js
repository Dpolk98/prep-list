// Which What to buy suggestions the inventory already covers.
//
// A suggestion counts as owned once the inventory holds at least one of it
// (quantity above 0) in the suggestion's category, either:
//   - an item with the same name (commas ignored, "&" read as "and"), or
//   - an item of one of the suggestion's `types` (ids from shelf-life.js),
//     so a can of Spam (type "Canned meat and fish") covers
//     "Canned meat, fish, and beans".
// Items saved before types existed are matched by the type their name suggests.
//
// The lists are rendered from the saved inventory each time a page draws,
// including when the app starts, so owned suggestions show "In inventory"
// straight away and the Add button returns if the item is used up.

function supplyNameKey(s) {
  return String(s ?? '').replaceAll(' & ', ' and ').replace(/,/g, '').trim().toLowerCase();
}

function itemTypeId(item) {
  return item.type || guessType({ name: item.name, unit: item.unit, category: item.category });
}

function ownsSupply(supply, items) {
  const name = supplyNameKey(supply.name);
  const types = supply.types || [];
  return items.some((i) => {
    if (i.category !== supply.cat || !(Number(i.quantity) > 0)) return false;
    return supplyNameKey(i.name) === name || (types.length > 0 && types.includes(itemTypeId(i)));
  });
}

// The What to buy (or Plans and Skills) list for one category, split into
// sections: your Local Hazards first, then your tier, then the foundation
// tiers it builds on, nearest first. A name is only listed once.
//
// `tiers` is the current tier plus every tier below it, lowest first.
// `items` is the inventory, or null when the page has no inventory.
// Each section carries how many of its suggestions are still to buy.
//
// Above the first tier the list gets long, so each section can collapse
// (`collapsible`). Only the first section that still has something to buy
// starts open; the rest start closed with their count showing.
function supplySections(tiers, hazards, cat, items) {
  const [own, ...foundations] = [...tiers].reverse();
  const groups = [
    ...hazards.map((h) => ({ label: `${h.name} · Local Hazards`, supplies: h.supplies })),
    { label: `${own.name} · your tier`, supplies: own.supplies },
    ...foundations.map((t) => ({ label: `${t.name} · foundation`, supplies: t.supplies })),
  ];
  const collapsible = tiers.length > 1;
  const seen = new Set();
  const sections = [];
  for (const { label, supplies } of groups) {
    const list = supplies.filter((s) => s.cat === cat && !seen.has(s.name));
    list.forEach((s) => seen.add(s.name));
    if (!list.length) continue;
    const entries = list.map((supply) => ({ supply, have: Boolean(items) && ownsSupply(supply, items) }));
    sections.push({ label, entries, toBuy: entries.filter((e) => !e.have).length, collapsible, open: !collapsible });
  }
  if (collapsible) {
    const first = sections.find((s) => s.toBuy > 0);
    if (first) first.open = true;
  }
  return sections;
}
