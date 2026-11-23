// Local Hazards. Chosen during onboarding or on the Settings page; each one adds a few
// suggestions to the What to buy lists (and to Plans and Skills), whatever
// the tier, since they depend on the place rather than how long you're
// preparing for.
//
// supplies: { cat, name, note }, in the same shape as tiers.js. A name that
// appears under more than one chosen hazard is only listed once.
// reference: ids of related Quick reference cards (reference.js), shown when
// a hazard is tapped on the Overview.

const HAZARDS = [
  {
    id: 'winter',
    name: 'Winter storms',
    icon: 'snowflake',
    reference: ['warm', 'co', 'outage'],
    supplies: [
      { cat: 'Other', name: 'Carbon monoxide alarm', note: 'Battery-powered or with a battery backup. Important with any fuel-burning heater or generator' },
      { cat: 'Other', name: 'Warm sleeping bags and blankets', note: 'Rated for cold, one per person, in case the heat goes out' },
      { cat: 'Other', name: 'Hats, gloves, and thermal layers', note: 'Layers keep you warmer than one heavy coat' },
      { cat: 'Other', name: 'Hand warmers', note: 'Air-activated packs that last for hours' },
      { cat: 'Other', name: 'Snow shovel and ice melt', note: 'Pet-safe ice melt if you have animals' },
      { cat: 'Other', name: 'Car winter kit', note: 'Blanket, ice scraper, jumper cables, and kitty litter for traction' },
      { cat: 'Plans and Skills', name: 'Keeping pipes from freezing', note: 'On very cold nights, let faucets drip and open the cabinets under sinks' },
    ],
  },
  {
    id: 'heat',
    name: 'Extreme heat',
    icon: 'sun',
    reference: ['cool', 'outage'],
    supplies: [
      { cat: 'Water', name: 'Extra water for hot days', note: 'Plan on more than a gallon per person per day in high heat' },
      { cat: 'Light and Power', name: 'Battery-powered fans', note: 'With a damp cloth, they help when the air conditioning is out' },
      { cat: 'Medical and First Aid', name: 'Instant cold packs', note: 'For cooling someone down quickly' },
      { cat: 'Other', name: 'Cooling towels', note: 'Soak, wring out, and drape over the neck' },
      { cat: 'Other', name: 'Blackout curtains or window film', note: 'Keep the sun out of rooms during the hottest hours' },
      { cat: 'Plans and Skills', name: 'Nearest cooling center', note: 'Libraries and community centers often open as cooling centers in a heat wave' },
      { cat: 'Plans and Skills', name: 'Signs of heat illness', note: 'Know heat exhaustion from heat stroke, which needs 911 right away' },
    ],
  },
  {
    id: 'hurricane',
    name: 'Hurricanes',
    icon: 'wind',
    reference: ['outage', 'water', 'food', 'co'],
    supplies: [
      { cat: 'Water', name: 'Bathtub water storage bag', note: 'Fill it before the storm for washing and flushing' },
      { cat: 'Food', name: 'Cooler and ice packs', note: 'Keeps food cold for a day or two after the power goes out' },
      { cat: 'Light and Power', name: 'Full gas tank and fuel cans', note: 'Fill up early, since stations can close or lose power' },
      { cat: 'Documents', name: 'Home inventory photos', note: 'Photos or video of each room, for insurance claims' },
      { cat: 'Other', name: 'Storm shutters or plywood', note: 'Cut and labelled for each window ahead of time' },
      { cat: 'Plans and Skills', name: 'Evacuation zone and routes', note: 'Look up your zone, and plan two ways out' },
    ],
  },
  {
    id: 'tornado',
    name: 'Tornadoes',
    icon: 'tornado',
    reference: ['firstaid', 'contact'],
    supplies: [
      { cat: 'Other', name: 'Helmets for everyone', note: 'Bike or sports helmets help protect against head injuries' },
      { cat: 'Other', name: 'Sturdy shoes in your shelter spot', note: 'Broken glass and debris are common afterward' },
      { cat: 'Other', name: 'Whistle in your shelter spot', note: 'To signal for help if you’re trapped' },
      { cat: 'Plans and Skills', name: 'Shelter spot', note: 'A basement, or an inside room on the lowest floor away from windows' },
      { cat: 'Plans and Skills', name: 'Emergency alerts on your phone', note: 'Check that they’re turned on in your phone’s settings' },
    ],
  },
  {
    id: 'flood',
    name: 'Floods',
    icon: 'waves',
    reference: ['water', 'sanitation', 'utilities'],
    supplies: [
      { cat: 'Light and Power', name: 'Sump pump battery backup', note: 'Keeps the pump running in an outage' },
      { cat: 'Documents', name: 'Flood insurance policy', note: 'Most home policies don’t cover floods, and new flood policies often take 30 days to start' },
      { cat: 'Documents', name: 'Home inventory photos', note: 'Photos or video of each room, for insurance claims' },
      { cat: 'Other', name: 'Sandbags or flood barriers', note: 'For doorways and other low spots' },
      { cat: 'Other', name: 'Waterproof boots and gloves', note: 'Floodwater can carry sewage and sharp debris' },
      { cat: 'Plans and Skills', name: 'Never drive through floodwater', note: 'Six inches of moving water can knock you down, and a foot can carry a car away' },
    ],
  },
  {
    id: 'wildfire',
    name: 'Wildfire',
    icon: 'flame',
    reference: ['contact', 'outage'],
    supplies: [
      { cat: 'Medical and First Aid', name: 'Eye drops', note: 'For eyes irritated by smoke' },
      { cat: 'Other', name: 'N95 masks for smoke', note: 'Cloth and surgical masks don’t filter smoke' },
      { cat: 'Other', name: 'HEPA air purifier', note: 'Or a box fan with a furnace filter attached, to keep one room’s air clean' },
      { cat: 'Other', name: 'Garden hose that reaches around the house', note: 'Long enough to reach every side of your home' },
      { cat: 'Plans and Skills', name: 'Defensible space', note: 'Clear dry brush, leaves, and firewood from within 30 feet of your home' },
      { cat: 'Plans and Skills', name: 'Leaving early', note: 'Know when you’d go, and pack the car on red flag days' },
    ],
  },
  {
    id: 'earthquake',
    name: 'Earthquakes',
    icon: 'activity',
    reference: ['utilities', 'firstaid', 'water'],
    supplies: [
      { cat: 'Water', name: 'Strapped water heater', note: 'Its 30 to 50 gallons can be used in an emergency, if it stays upright' },
      { cat: 'Other', name: 'Furniture straps and anchors', note: 'Secure tall furniture, TVs, and the water heater' },
      { cat: 'Other', name: 'Sturdy shoes near your bed', note: 'Broken glass is common after a quake' },
      { cat: 'Plans and Skills', name: 'Drop, cover, and hold on', note: 'Practice it, and know the safe spots in each room' },
      { cat: 'Plans and Skills', name: 'When to shut off the gas', note: 'Only if you smell gas or hear a leak. Once it’s off, the gas company has to turn it back on' },
    ],
  },
];
