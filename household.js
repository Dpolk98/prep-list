// Who you're preparing for: how many adults and children, whether anyone
// takes prescription or other special medications, and whether there are
// pets. Saved in the app's data as `adults`, `children`, `meds` and `pets`.
//
// `people` (adults plus children) is still saved next to them. Water and food
// estimates count everyone the same, and older versions of the app, and
// backups made with them, only know `people`.
//
// The two checkboxes hide or show suggestions across the app. A What to buy
// suggestion, item type, or grab list entry marked `needs: 'meds'` or
// `needs: 'pets'` only appears when its box is ticked.

const HOUSEHOLD_MAX = 99;

function clampCount(n, min) {
  return Math.min(HOUSEHOLD_MAX, Math.max(min, Math.round(Number(n)) || 0));
}

// Data saved before the split only has `people`: everyone counts as an adult,
// and medications and pets stay on, so nothing that was showing disappears.
function normalizeHousehold(data = {}) {
  const split = data.adults !== undefined || data.children !== undefined;
  const adults = clampCount(split ? data.adults : data.people ?? 2, 1);
  const children = clampCount(split ? data.children : 0, 0);
  return {
    adults,
    children,
    people: adults + children,
    meds: data.meds === undefined ? true : Boolean(data.meds),
    pets: data.pets === undefined ? true : Boolean(data.pets),
  };
}

// True when the household needs this suggestion, item type, or entry.
function householdNeeds(thing, household) {
  return !thing?.needs || Boolean(household[thing.needs]);
}

function forHousehold(list, household) {
  return list.filter((x) => householdNeeds(x, household));
}

// "2 adults and 1 child", "1 adult".
function householdText({ adults, children }) {
  const part = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  return children > 0
    ? `${part(adults, 'adult', 'adults')} and ${part(children, 'child', 'children')}`
    : part(adults, 'adult', 'adults');
}
