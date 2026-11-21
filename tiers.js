// Prep tiers. Each tier builds on the ones before it.
//
// days:          how long the tier is meant to cover (null = user-chosen horizon)
// waterGoalDays: stored-water target shown in the summary. It caps at 30 days:
//                past a month, the plan shifts from storing water to sourcing
//                and purifying it.
// supplies:      reference list of things to buy (or, for Plans and Skills, to
//                set up) at this tier, shown on each category page.
//                { cat, name, note }

const TIERS = [
  {
    id: 'week',
    name: '1 Week',
    days: 7,
    title: 'Shelter in place',
    mindset:
      'Ride out a short disruption (a storm, a power outage, a boil-water notice) with what you already have. ' +
      'Focus on stored supplies that need no power, no running water, and no trip to the store.',
    waterGoalDays: 7,
    savingsNote: 'Keep part of it as cash in small bills. Card readers and ATMs often stop working in outages.',
    supplies: [
      { cat: 'Water', name: 'Bottled water', note: '1 gallon per person per day: 7 gallons each' },
      { cat: 'Water', name: 'Food-grade water jugs', note: 'If you fill your own; replace the water every 6 months' },

      { cat: 'Food', name: 'Canned meat, fish, and beans', note: 'Ready-to-eat protein, no cooking needed' },
      { cat: 'Food', name: 'Canned fruit and vegetables', note: 'Packed in juice or water, so the liquid counts too' },
      { cat: 'Food', name: 'Peanut butter, crackers, and nuts', note: 'Calorie-dense and shelf-stable' },
      { cat: 'Food', name: 'Granola and protein bars', note: 'Easy grab-and-go meals' },
      { cat: 'Food', name: 'Comfort foods and drink mixes', note: 'Morale matters during an outage' },
      { cat: 'Food', name: 'Manual can opener', note: 'Electric ones won’t work without power' },
      { cat: 'Food', name: 'Paper plates, cups, and utensils', note: 'Saves water on dishes' },

      { cat: 'Medical and First Aid', name: 'First aid kit', note: 'Bandages, gauze, tape, antiseptic wipes, tweezers' },
      { cat: 'Medical and First Aid', name: 'Pain and fever reliever', note: 'Ibuprofen and acetaminophen' },
      { cat: 'Medical and First Aid', name: 'Extra prescriptions', note: 'At least a week beyond your normal supply' },
      { cat: 'Medical and First Aid', name: 'Antidiarrheal and antacids', note: 'Common problems when routines are disrupted' },
      { cat: 'Medical and First Aid', name: 'Spare glasses or contacts', note: 'Plus contact solution' },

      { cat: 'Toiletries and Hygiene', name: 'Toilet paper', note: 'About 1 roll per person every few days' },
      { cat: 'Toiletries and Hygiene', name: 'Wet wipes and hand sanitizer', note: 'For washing up without running water' },
      { cat: 'Toiletries and Hygiene', name: 'Bar soap and toothpaste', note: 'Bar soap stores longer than liquid' },
      { cat: 'Toiletries and Hygiene', name: 'Heavy-duty garbage bags', note: 'Trash, sanitation, and makeshift ponchos' },
      { cat: 'Toiletries and Hygiene', name: 'Menstrual products and diapers', note: 'As needed for your household' },

      { cat: 'Light and Power', name: 'Flashlights or headlamps', note: 'One per person; headlamps keep hands free' },
      { cat: 'Light and Power', name: 'Batteries', note: 'Extra sets for every device you own' },
      { cat: 'Light and Power', name: 'NOAA weather radio', note: 'Hand-crank or battery powered' },
      { cat: 'Light and Power', name: 'Power bank', note: 'Keep it charged; enough for a few phone charges' },

      { cat: 'Documents', name: 'Waterproof document pouch', note: 'Keeps copies dry and together' },
      { cat: 'Documents', name: 'Copies of IDs and insurance', note: 'Plus prescriptions and pet records' },
      { cat: 'Documents', name: 'Printed contact list', note: 'Your phone may be dead' },

      { cat: 'Plans and Skills', name: 'Family meeting place', note: 'One near home and one outside your neighborhood' },
      { cat: 'Plans and Skills', name: 'Out-of-area contact', note: 'Long-distance calls often go through when local ones don’t' },
      { cat: 'Plans and Skills', name: 'Utility shut-offs', note: 'Know how to turn off water, gas, and electricity' },

      { cat: 'Other', name: 'Multitool and duct tape', note: 'Quick repairs of almost anything' },
      { cat: 'Other', name: 'Go-bag', note: 'Packed in case you have to leave, with a whistle and N95 masks' },
      { cat: 'Other', name: 'Pet food and supplies', note: 'A week of food, water, and any medications' },
      { cat: 'Other', name: 'Books, cards, and games', note: 'Entertainment without power' },
      { cat: 'Other', name: 'Baby supplies', note: 'Formula, bottles, and diapers if needed' },
    ],
  },
  {
    id: 'month',
    name: '1 Month',
    days: 30,
    title: 'Extended disruption',
    mindset:
      'Utilities or supply chains could be down for weeks. Stockpiles alone get heavy and run out, ' +
      'so add the ability to cook without power, treat your own water, and handle sanitation yourself.',
    waterGoalDays: 30,
    savingsNote: 'Enough to cover a month of bills and essentials if income stops or prices spike.',
    supplies: [
      { cat: 'Water', name: 'Portable water filter', note: 'Squeeze or pump style, rated for bacteria and protozoa' },
      { cat: 'Water', name: 'Water purification tablets', note: 'Lightweight backup to a filter' },
      { cat: 'Water', name: 'Unscented household bleach', note: 'About 8 drops per gallon of clear water' },
      { cat: 'Water', name: 'Stackable water containers', note: '5–7 gallon containers for 30 days of storage' },

      { cat: 'Food', name: 'Rice, pasta, and oats', note: 'Cheap, filling calories that store well' },
      { cat: 'Food', name: 'Dried beans and lentils', note: 'Protein that lasts for years' },
      { cat: 'Food', name: 'Cooking oil', note: 'Fat and calories; rotate yearly' },
      { cat: 'Food', name: 'Powdered milk', note: 'For cooking, cereal, and kids' },
      { cat: 'Food', name: 'Salt, spices, and bouillon', note: 'Makes plain staples worth eating' },
      { cat: 'Food', name: 'Camp stove', note: 'Cook outdoors only, never indoors' },
      { cat: 'Food', name: 'Stove fuel', note: 'A 1 lb propane canister cooks for about 1–2 hours' },
      { cat: 'Food', name: 'Cast-iron pot or pan', note: 'Works on a stove, grill, or fire' },

      { cat: 'Medical and First Aid', name: '30-day prescription supply', note: 'Ask your doctor or insurer about a refill buffer' },
      { cat: 'Medical and First Aid', name: 'Wound care supplies', note: 'Gauze rolls, medical tape, butterfly closures' },
      { cat: 'Medical and First Aid', name: 'Antibiotic ointment and hydrocortisone', note: 'For cuts, rashes, and bites' },
      { cat: 'Medical and First Aid', name: 'Electrolyte packets', note: 'For illness, heat, and heavy work' },
      { cat: 'Medical and First Aid', name: 'Thermometer', note: 'Digital, with spare batteries' },
      { cat: 'Medical and First Aid', name: 'Allergy medicine', note: 'Antihistamine tablets' },

      { cat: 'Toiletries and Hygiene', name: 'Bucket toilet kit', note: '5-gallon bucket, toilet seat lid, and heavy bags' },
      { cat: 'Toiletries and Hygiene', name: 'Kitty litter or sawdust', note: 'Absorbent for the bucket toilet' },
      { cat: 'Toiletries and Hygiene', name: 'Disinfectant', note: 'Bleach or disinfecting spray for surfaces' },
      { cat: 'Toiletries and Hygiene', name: 'A month of toiletries', note: 'Toothpaste, deodorant, shampoo, razors' },
      { cat: 'Toiletries and Hygiene', name: 'Laundry soap and a washboard', note: 'For washing clothes by hand' },

      { cat: 'Light and Power', name: 'Solar charger', note: 'Folding panel for phones and power banks' },
      { cat: 'Light and Power', name: 'Portable power station or generator', note: 'Run generators outdoors only' },
      { cat: 'Light and Power', name: 'Fuel with stabilizer', note: 'Stored safely, away from the house' },
      { cat: 'Light and Power', name: 'Lanterns', note: 'Light a whole room, not just a spot' },

      { cat: 'Documents', name: 'Encrypted USB drive', note: 'Scans of important documents and photos' },
      { cat: 'Documents', name: 'Paper maps', note: 'Your area and evacuation routes' },

      { cat: 'Plans and Skills', name: 'Communication plan', note: 'How to reach each other without cell service' },
      { cat: 'Plans and Skills', name: 'First aid and CPR class', note: 'At least one person in the household' },
      { cat: 'Plans and Skills', name: 'Rotation schedule', note: 'Eat and replace stored food and water before it expires' },

      { cat: 'Other', name: 'Bedding for any season', note: 'Sleeping bags and wool blankets, plus a battery fan for summer' },
      { cat: 'Other', name: 'Shut-off wrench and work gloves', note: 'For the gas meter, water main, and cleanup' },
      { cat: 'Other', name: 'Fire extinguisher', note: 'ABC rated, one per floor' },
      { cat: 'Other', name: 'A month of pet supplies', note: 'Food, litter, and medications' },
      { cat: 'Other', name: 'Rodent-proof storage bins', note: 'Protect stored food from pests' },
      { cat: 'Other', name: 'Sewing kit', note: 'Mend clothes and gear' },
    ],
  },
  {
    id: 'year',
    name: '1 Year',
    days: 365,
    title: 'Long-term self-reliance',
    mindset:
      'You can’t store a year of everything. Shift from stockpiling to producing and renewing: ' +
      'a water source you can treat indefinitely, bulk staples, power you generate yourself, ' +
      'and the skills to keep it all running.',
    waterGoalDays: 30,
    savingsNote: 'Protects against a long job loss or a prolonged economic downturn.',
    supplies: [
      { cat: 'Water', name: 'Rain barrels with first-flush diverter', note: 'Collect water from your roof (check local rules)' },
      { cat: 'Water', name: 'Gravity water filter', note: 'Filters gallons a day with no pumping' },
      { cat: 'Water', name: 'Spare filter elements', note: 'Enough for a year of daily use' },
      { cat: 'Water', name: 'Water test strips', note: 'Check collected water before treating it' },

      { cat: 'Food', name: 'Bulk staples in mylar bags', note: 'Wheat, rice, and beans, with oxygen absorbers' },
      { cat: 'Food', name: 'Food-grade buckets with gamma lids', note: 'Pest-proof and easy to open' },
      { cat: 'Food', name: 'Freeze-dried food (#10 cans)', note: 'Lasts 25 years; good for variety' },
      { cat: 'Food', name: 'Heirloom seeds', note: 'Non-hybrid, so you can save seed each year' },
      { cat: 'Food', name: 'Pressure canner and jars', note: 'Preserve what you grow' },
      { cat: 'Food', name: 'Food dehydrator', note: 'Dry fruit, vegetables, and jerky' },
      { cat: 'Food', name: 'Hand-crank grain mill', note: 'Turn stored wheat into flour' },
      { cat: 'Food', name: 'Bulk cooking fuel', note: 'Refillable propane tanks, plus charcoal for a grill' },

      { cat: 'Medical and First Aid', name: 'Trauma kit', note: 'Tourniquet, pressure bandage, chest seal' },
      { cat: 'Medical and First Aid', name: 'Dental first aid kit', note: 'Temporary fillings and pain relief' },
      { cat: 'Medical and First Aid', name: 'Medical reference book', note: 'For when a doctor isn’t available' },
      { cat: 'Medical and First Aid', name: 'Bulk OTC medicines', note: 'Pain relievers, antihistamines, antidiarrheals' },

      { cat: 'Toiletries and Hygiene', name: 'Bulk soap and shampoo', note: 'A year’s worth; bar soap stores longest' },
      { cat: 'Toiletries and Hygiene', name: 'Composting toilet supplies', note: 'Long-term sanitation without plumbing' },
      { cat: 'Toiletries and Hygiene', name: 'Reusable menstrual products', note: 'Menstrual cups or cloth pads' },
      { cat: 'Toiletries and Hygiene', name: 'Clothes wringer and drying line', note: 'Laundry without a machine' },

      { cat: 'Light and Power', name: 'Solar panels', note: 'Sized for your essential loads' },
      { cat: 'Light and Power', name: 'Deep-cycle battery bank', note: 'Stores solar power for the night' },
      { cat: 'Light and Power', name: 'Charge controller and inverter', note: 'Connects panels, batteries, and appliances' },
      { cat: 'Light and Power', name: 'Rechargeable batteries and solar charger', note: 'Replaces disposable batteries' },

      { cat: 'Documents', name: 'Reference library', note: 'Gardening, repair, food preservation guides' },
      { cat: 'Documents', name: 'Property and ownership records', note: 'Deeds, titles, and insurance policies' },

      { cat: 'Plans and Skills', name: 'Mutual aid group', note: 'Neighbors who share resources and skills' },
      { cat: 'Plans and Skills', name: 'A producing garden', note: 'Start small and expand each season' },
      { cat: 'Plans and Skills', name: 'Canning and preservation skills', note: 'Practice before you need it' },
      { cat: 'Plans and Skills', name: 'Wilderness first aid course', note: 'For care when help is far away' },

      { cat: 'Other', name: 'Hand and garden tools', note: 'Hammer, saws, wrenches, shovel, and rake, none needing power' },
      { cat: 'Other', name: 'Wood stove and firewood tools', note: 'Heat and cooking, plus an axe, saw, and maul' },
      { cat: 'Other', name: 'Repair supplies', note: 'Fasteners, wire, lumber, and tarps' },
      { cat: 'Other', name: 'Year of pet food', note: 'Or a plan to feed pets from what you produce' },
      { cat: 'Other', name: 'Spare clothing and shoes', note: 'Including the next size up for kids' },
    ],
  },
  {
    id: 'beyond',
    name: 'Beyond',
    days: null,
    title: 'Sustainable living',
    mindset:
      'Indefinite self-sufficiency. Supplies become a buffer; what keeps you going is production, skills ' +
      'and community. Build systems that renew themselves, with a backup for each one.',
    waterGoalDays: 30,
    savingsNote: 'Past a year, money goes less far than skills, tools, and community. Choose how many years to cover.',
    supplies: [
      { cat: 'Water', name: 'Well hand pump', note: 'Draws water when the electric pump can’t' },
      { cat: 'Water', name: 'Second purification method', note: 'UV purifier or water distiller as a backup' },
      { cat: 'Water', name: 'Cistern or spring box', note: 'Large-scale storage from a natural source' },

      { cat: 'Food', name: 'Chickens and a coop', note: 'Eggs and meat from a small flock' },
      { cat: 'Food', name: 'Seed-saving supplies', note: 'Envelopes, labels, and a cool, dry storage spot' },
      { cat: 'Food', name: 'Root cellar', note: 'Store harvests without refrigeration' },
      { cat: 'Food', name: 'Fishing and hunting gear', note: 'Plus the licenses and know-how' },
      { cat: 'Food', name: 'Fruit trees and perennial crops', note: 'Food that comes back every year' },

      { cat: 'Medical and First Aid', name: 'Advanced medical supplies', note: 'Matched to your group’s training' },
      { cat: 'Medical and First Aid', name: 'Medicinal herb garden', note: 'With a trusted reference guide' },

      { cat: 'Toiletries and Hygiene', name: 'Soap-making supplies', note: 'Lye, fats, and molds' },
      { cat: 'Toiletries and Hygiene', name: 'Manual washing machine', note: 'Hand-crank or plunger style' },

      { cat: 'Light and Power', name: 'Second power source', note: 'Wind or micro-hydro alongside solar' },
      { cat: 'Light and Power', name: 'Spare power components', note: 'Inverter, charge controller, fuses, and wiring' },

      { cat: 'Documents', name: 'Skills and inventory records', note: 'Who knows what, and what the group has' },

      { cat: 'Plans and Skills', name: 'A tradeable skill', note: 'Repair, medicine, carpentry, or food production' },
      { cat: 'Plans and Skills', name: 'Community roles and plans', note: 'Shared responsibilities within your network' },

      { cat: 'Other', name: 'Workshop and spare parts', note: 'A bench, vise, and spares for pumps, stoves, and vehicles' },
      { cat: 'Other', name: 'Treadle sewing machine', note: 'Plus fabric, to make and mend clothes without power' },
      { cat: 'Other', name: 'Livestock feed and fencing', note: 'For animals you raise' },
    ],
  },
];
