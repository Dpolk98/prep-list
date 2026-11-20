// Prep tiers. Each tier builds on the ones before it.
//
// days:          how long the tier is meant to cover (null = user-chosen horizon)
// waterGoalDays: stored-water target shown in the summary. It caps at 30 days:
//                past a month, the plan shifts from storing water to sourcing
//                and purifying it.
// checklist:     capabilities to work toward. `autoWater: N` items are checked
//                automatically when the inventory holds N days of water.

const TIERS = [
  {
    id: 'week',
    name: '1 Week',
    days: 7,
    title: 'Shelter in place',
    mindset:
      'Ride out a short disruption (a storm, a power outage, a boil-water notice) with what you already have. ' +
      'Focus on stored supplies that need no power, no running water and no trip to the store.',
    waterGoalDays: 7,
    savingsNote: 'Keep part of it as cash in small bills. Card readers and ATMs often stop working in outages.',
    checklist: [
      { id: 'w-water', cat: 'Water', text: 'Stored water: 1 gallon per person per day for 7 days', autoWater: 7 },
      { id: 'w-food', cat: 'Food', text: '7 days of food that needs no cooking or refrigeration' },
      { id: 'w-opener', cat: 'Food', text: 'Manual can opener, plates and utensils' },
      { id: 'w-firstaid', cat: 'Medical & First Aid', text: 'Basic first aid kit' },
      { id: 'w-meds', cat: 'Medical & First Aid', text: '1 week of prescriptions, plus glasses or contacts' },
      { id: 'w-hygiene', cat: 'Toiletries & Hygiene', text: 'Toilet paper, wipes, soap, hand sanitizer, garbage bags' },
      { id: 'w-light', cat: 'Light & Power', text: 'Flashlights or headlamps with spare batteries' },
      { id: 'w-radio', cat: 'Light & Power', text: 'Battery or hand-crank NOAA weather radio' },
      { id: 'w-charge', cat: 'Light & Power', text: 'Charged power bank for phones' },
      { id: 'w-docs', cat: 'Documents & Cash', text: 'Copies of IDs, insurance and contacts in a waterproof bag' },
      { id: 'w-gobag', cat: 'Tools & Gear', text: 'Go-bag packed in case you have to leave' },
      { id: 'w-plan', cat: 'Plans & Skills', text: 'Family meeting place and an out-of-area contact' },
    ],
  },
  {
    id: 'month',
    name: '1 Month',
    days: 30,
    title: 'Extended disruption',
    mindset:
      'Utilities or supply chains could be down for weeks. Stockpiles alone get heavy and run out, ' +
      'so add the ability to cook without power, treat your own water and handle sanitation yourself.',
    waterGoalDays: 30,
    savingsNote: 'Enough to cover a month of bills and essentials if income stops or prices spike.',
    checklist: [
      { id: 'm-water', cat: 'Water', text: 'Stored water: 30 days at 1 gallon per person per day', autoWater: 30 },
      { id: 'm-purify', cat: 'Water', text: 'Backup purification: portable filter, tablets or unscented bleach' },
      { id: 'm-food', cat: 'Food', text: '30 days of shelf-stable food you already eat, rotated so it stays fresh' },
      { id: 'm-cook', cat: 'Food', text: 'A way to cook without grid power (camp stove and fuel)' },
      { id: 'm-meds', cat: 'Medical & First Aid', text: '30-day supply of prescriptions' },
      { id: 'm-firstaid', cat: 'Medical & First Aid', text: 'Expanded first aid: wound care, splints, common OTC medicines' },
      { id: 'm-sanitation', cat: 'Toiletries & Hygiene', text: 'Toilet plan without running water: bucket, bags, absorbent, bleach' },
      { id: 'm-hygiene', cat: 'Toiletries & Hygiene', text: 'A month of toiletries, including menstrual products and diapers if needed' },
      { id: 'm-power', cat: 'Light & Power', text: 'Solar charger or small generator with safely stored fuel' },
      { id: 'm-climate', cat: 'Tools & Gear', text: 'Stay warm or cool without HVAC: sleeping bags, blankets, battery fans' },
      { id: 'm-tools', cat: 'Tools & Gear', text: 'Basic tools: multitool, duct tape, utility shut-off wrench' },
      { id: 'm-comms', cat: 'Plans & Skills', text: 'Communication plan for when cell networks are down' },
      { id: 'm-cpr', cat: 'Plans & Skills', text: 'At least one household member trained in first aid and CPR' },
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
    checklist: [
      { id: 'y-source', cat: 'Water', text: 'Renewable water source: rain catchment, a well, or nearby surface water' },
      { id: 'y-filter', cat: 'Water', text: 'Gravity filter with enough spare cartridges for a year' },
      { id: 'y-staples', cat: 'Food', text: 'Bulk staples in long-term storage: rice, beans, oats, wheat (mylar bags, buckets, #10 cans)' },
      { id: 'y-garden', cat: 'Food', text: 'A working garden and a supply of non-hybrid seeds' },
      { id: 'y-preserve', cat: 'Food', text: 'Food preservation gear and know-how: canning, dehydrating' },
      { id: 'y-medical', cat: 'Medical & First Aid', text: 'Extended medical and dental supplies, plus reference books' },
      { id: 'y-training', cat: 'Medical & First Aid', text: 'Wilderness or advanced first aid training' },
      { id: 'y-sanitation', cat: 'Toiletries & Hygiene', text: 'Long-term sanitation: composting toilet or latrine plan, bulk soap' },
      { id: 'y-solar', cat: 'Light & Power', text: 'Solar panels with battery storage' },
      { id: 'y-heat', cat: 'Tools & Gear', text: 'Sustainable heat: wood stove and a fuel supply' },
      { id: 'y-handtools', cat: 'Tools & Gear', text: 'Hand tools and repair supplies that need no power' },
      { id: 'y-community', cat: 'Plans & Skills', text: 'Neighbors or a group to share resources and skills with' },
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
    savingsNote: 'Past a year, money goes less far than skills, tools and community. Choose how many years to cover.',
    checklist: [
      { id: 'b-water', cat: 'Water', text: 'A source you control (well or spring) with two independent ways to purify' },
      { id: 'b-garden', cat: 'Food', text: 'A garden that produces a real share of your calories' },
      { id: 'b-protein', cat: 'Food', text: 'A protein source: chickens, rabbits, fishing or hunting' },
      { id: 'b-seeds', cat: 'Food', text: 'Seed saving from season to season' },
      { id: 'b-medical', cat: 'Medical & First Aid', text: 'Advanced medical skills in your group, and knowledge of natural remedies' },
      { id: 'b-soap', cat: 'Toiletries & Hygiene', text: 'Make your own soap and cleaning supplies' },
      { id: 'b-power', cat: 'Light & Power', text: 'Off-grid power with redundancy and spare parts' },
      { id: 'b-workshop', cat: 'Tools & Gear', text: 'Workshop for repairing tools, clothing and equipment' },
      { id: 'b-trade', cat: 'Plans & Skills', text: 'A skill others will trade for: repair, medicine, carpentry, food' },
      { id: 'b-mutual', cat: 'Plans & Skills', text: 'Mutual-aid network with shared roles and plans' },
    ],
  },
];
