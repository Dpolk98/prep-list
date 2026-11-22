// Quick reference cards, shown on the Quick reference page and, if chosen,
// on the printed summary. Kept to widely published public health guidance
// (CDC, EPA, USDA, FEMA, and the Red Cross), written plainly.
//
// Each card: { id, title, icon, points, table? }. Points are trusted HTML
// written here, so they can use <strong>. A table is { head, rows }.

const REFERENCE = [
  {
    id: 'water',
    title: 'Purifying water',
    icon: 'droplet',
    points: [
      '<strong>Boiling is the most reliable method.</strong> Bring clear water to a rolling boil for 1 minute, or 3 minutes above 6,500 feet. Let it cool before drinking.',
      'If the water is cloudy, let it settle, then pour it through a clean cloth, paper towel, or coffee filter first.',
      '<strong>Bleach</strong> works when you can’t boil. Use plain, unscented household bleach, and check the label for its strength. Stir, then wait 30 minutes.',
      'The water should smell slightly of chlorine. If it doesn’t, add the same amount again and wait another 15 minutes.',
      'For purification tablets, follow the directions on the package.',
    ],
    table: {
      head: ['Bleach strength', 'Clear water, per gallon', 'Cloudy water, per gallon'],
      rows: [['6%', '8 drops', '16 drops'], ['8.25%', '6 drops', '12 drops']],
    },
  },
  {
    id: 'food',
    title: 'Keeping food safe without power',
    icon: 'utensils',
    points: [
      'Keep the refrigerator and freezer doors closed as much as you can.',
      'A closed refrigerator keeps food cold for about <strong>4 hours</strong>.',
      'A full freezer holds its temperature for about <strong>48 hours</strong>, or about 24 hours if it’s half full.',
      'Throw out meat, fish, eggs, milk, and leftovers that have been above 40°F for 2 hours or more.',
      'Food in the freezer that still has ice crystals, or is at 40°F or below, can be refrozen.',
      'Never taste food to check whether it’s safe. When in doubt, throw it out.',
    ],
  },
  {
    id: 'co',
    title: 'Generators, heaters, and carbon monoxide',
    icon: 'fuel',
    points: [
      '<strong>Run generators outdoors only</strong>, at least 20 feet from doors, windows, and vents. Never in a garage, basement, or carport, even with the door open.',
      'Never use a grill, camp stove, or charcoal indoors, and never heat your home with a gas oven or stove.',
      'Let a generator cool down before refueling it.',
      'Keep a carbon monoxide alarm with a battery backup on each floor, and near bedrooms.',
      'Headache, dizziness, weakness, nausea, or confusion can mean carbon monoxide poisoning. <strong>Get everyone into fresh air right away, then call 911.</strong>',
    ],
  },
  {
    id: 'utilities',
    title: 'Shutting off utilities',
    icon: 'wrench',
    points: [
      'Know where your main water valve, gas meter, and electrical panel are before you need them.',
      '<strong>Gas:</strong> turn it off only if you smell gas, hear a hiss, or are told to. Give the valve a quarter turn so it sits crosswise to the pipe, then leave the house. Once it’s off, the gas company has to turn it back on.',
      '<strong>Water:</strong> the main valve is usually where the water line enters the house. Turn it clockwise to close. Shut it off if a pipe bursts, or if you hear the water supply may be contaminated.',
      '<strong>Electricity:</strong> switch off the individual breakers first, then the main breaker. Don’t touch the panel if you’re standing in water.',
    ],
  },
  {
    id: 'outage',
    title: 'During a power outage',
    icon: 'flashlight',
    points: [
      'Use flashlights or lanterns rather than candles, which can start fires.',
      'Unplug appliances and electronics so a surge can’t damage them when the power comes back. Leave one lamp switched on so you’ll know when it does.',
      'Save your phone’s battery: turn on low power mode, lower the screen brightness, and close apps you aren’t using.',
      'Report the outage to your utility, and check on neighbors who may need help.',
      'When the power returns, turn things back on a few at a time.',
    ],
  },
  {
    id: 'warm',
    title: 'Staying warm',
    icon: 'snowflake',
    points: [
      'Dress in layers, with a hat and dry socks. Several thin layers keep you warmer than one heavy one.',
      'Gather in one room, close off the rest, and cover the windows at night.',
      'Eat regularly and drink warm drinks. Avoid alcohol, which makes the body lose heat faster.',
      'Shivering, confusion, slurred speech, or unusual sleepiness can be signs of hypothermia. <strong>Warm the person gradually with blankets and dry clothes, and call 911.</strong>',
    ],
  },
  {
    id: 'cool',
    title: 'Staying cool',
    icon: 'sun',
    points: [
      'Drink water regularly, even before you feel thirsty.',
      'Stay in the coolest room, on the lowest floor, and keep blinds closed during the day.',
      'Use damp cloths, cool showers, and fans. Save hard work for the cooler hours.',
      'Heavy sweating, weakness, and nausea can be heat exhaustion: move somewhere cooler, loosen clothing, and sip water.',
      'A very high temperature, confusion, or fainting can be heat stroke. <strong>Call 911, and cool the person with wet cloths while you wait.</strong>',
    ],
  },
  {
    id: 'sanitation',
    title: 'Toilets and sanitation',
    icon: 'soap',
    points: [
      'If the water is off but the sewer works, pour a bucket of water (about a gallon) into the bowl to flush.',
      'If the sewer isn’t working, line the toilet or a bucket with a heavy garbage bag. Add kitty litter or sawdust after each use, then tie the bag off and store it outside, away from water.',
      'Wash hands with soap and water, or use hand sanitizer with at least 60% alcohol.',
      'To disinfect surfaces, mix 5 tablespoons (1/3 cup) of bleach in a gallon of water.',
    ],
  },
  {
    id: 'firstaid',
    title: 'Basic first aid',
    icon: 'medkit',
    points: [
      'For anything serious, <strong>call 911</strong> and follow the dispatcher’s instructions.',
      '<strong>Bleeding:</strong> press firmly on the wound with a clean cloth and keep pressing. If blood soaks through, add more cloth on top rather than removing the first.',
      '<strong>Burns:</strong> cool the burn under cool (not cold) running water for at least 10 minutes. Don’t use ice or butter. Cover it loosely with a clean, dry dressing.',
      'A first aid and CPR class is the best preparation. The Red Cross and many hospitals offer them.',
    ],
  },
  {
    id: 'contact',
    title: 'Staying in touch',
    icon: 'radio',
    points: [
      'Text rather than call when you can: texts often get through when calls don’t, and they leave the lines free for emergencies.',
      'Keep calls short, and check in with your out-of-area contact.',
      'NOAA Weather Radio broadcasts on 162.400 to 162.550 MHz in the US.',
      'Make sure emergency alerts are turned on in your phone’s settings.',
    ],
  },
];
