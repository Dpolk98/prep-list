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
