// ROADBOUND - Campaign Missions & Dynamic World Events Data
export const MISSIONS_DATA = [
  {
    id: 'm1_arrival',
    number: '01',
    name: 'ARRIVAL & EXTRACTION',
    tagline: 'Infiltrate Docks & Recover Experimental Hypercar',
    description: 'Marcus touches down on Blackshore Island. Contact Elena Cross has pinpointed a locked-down container vessel in the cargo harbor holding the experimental Apex Vanguard. Infiltrate the terminal, claim the vehicle, and shake the harbor security tail before delivering it to the downtown safehouse.',
    rewardCash: 15000,
    rewardXp: 250,
    steps: [
      {
        text: 'Infiltrate the Cargo Harbor Terminal at Berth 04',
        target: { x: 380, y: 0.5, z: -250 },
        radius: 18,
        dialogue: {
          speaker: 'ELENA CROSS [RADIO]',
          text: 'Marcus, container ship 04 is docked on the east berth. Guards are rotating. Grab the Vanguard before Blackshore PD seals the perimeter!'
        }
      },
      {
        text: 'Take control of the Apex Vanguard hypercar',
        target: { x: 380, y: 0.5, z: -250 },
        radius: 8,
        requireInVehicle: true,
        dialogue: {
          speaker: 'ELENA CROSS [RADIO]',
          text: 'Telemetry is live! We got eyes on local patrol units heading your way. Floor it!'
        },
        triggerWanted: 2
      },
      {
        text: 'Evade police pursuit and deliver the hypercar to the Downtown Safehouse',
        target: { x: -35, y: 0.5, z: 35 },
        radius: 12,
        dialogue: {
          speaker: 'ELENA CROSS [RADIO]',
          text: 'Excellent driving! Pull into the safehouse bay. We will wipe the transponder and prep the garage.'
        }
      }
    ]
  },
  {
    id: 'm2_intercept',
    number: '02',
    name: 'HIGH-OCTANE INTERCEPT',
    tagline: 'Highway Takedown & Contraband Intercept',
    description: 'A rogue security convoy is transporting a military-grade telemetry drive across the coastal highway. Chase down the armored transport, disable the escort, and secure the package before they reach the airport causeway.',
    rewardCash: 25000,
    rewardXp: 500,
    steps: [
      {
        text: 'Speed to the Coastal Highway intercept waypoint',
        target: { x: -220, y: 0.5, z: 150 },
        radius: 20,
        dialogue: {
          speaker: 'ELENA CROSS [RADIO]',
          text: 'Convoy spotted moving south down the coastal stretch. Intercept and bring them to a halt!'
        }
      },
      {
        text: 'Disable the convoy vehicle with tactical ramming or precision fire',
        target: { x: -320, y: 0.5, z: 240 },
        radius: 15,
        triggerWanted: 3,
        dialogue: {
          speaker: 'ELENA CROSS [RADIO]',
          text: 'Transport immobilized! Grab the telemetry drive and ditch the 3-star heat!'
        }
      },
      {
        text: 'Lose the heat and return the drive to the Safehouse',
        target: { x: -35, y: 0.5, z: 35 },
        radius: 12,
        dialogue: {
          speaker: 'ELENA CROSS [RADIO]',
          text: 'Drive secured. The Blackshore syndicate won’t even know what hit them.'
        }
      }
    ]
  },
  {
    id: 'm3_blackout',
    number: '03',
    name: 'BLACKSHORE BLACKOUT',
    tagline: 'Night Summit Infiltration & Mountain Drift Escape',
    description: 'Scale the winding switchbacks of the Blackshore Mountain Pass under torrential storm cover to sabotage the primary surveillance relay compound, blinding the city grid.',
    rewardCash: 40000,
    rewardXp: 800,
    steps: [
      {
        text: 'Ascend the winding mountain pass road to Summit Relay Compound',
        target: { x: 320, y: 32, z: -280 },
        radius: 20,
        dialogue: {
          speaker: 'ELENA CROSS [RADIO]',
          text: 'Road surface is slick from the storm. Watch your drift angles on the switchback cliffs!'
        }
      },
      {
        text: 'Infiltrate compound and plant the surveillance jammer',
        target: { x: 380, y: 24, z: -360 },
        radius: 14,
        triggerWanted: 4,
        dialogue: {
          speaker: 'ELENA CROSS [RADIO]',
          text: 'Grid is going dark in 3... 2... 1... Full blackout! Now get down that mountain before the SWAT blockades form!'
        }
      },
      {
        text: 'Make a high-speed downhill descent escape back to the Safehouse',
        target: { x: -35, y: 0.5, z: 35 },
        radius: 14,
        dialogue: {
          speaker: 'ELENA CROSS [RADIO]',
          text: 'Blackshore is ours now, Marcus. Welcome to the top.'
        }
      }
    ]
  }
];

export const DYNAMIC_EVENTS_DATA = [
  {
    id: 'event_street_race',
    title: 'ILLEGAL MIDNIGHT SPRINT',
    reward: 12000,
    desc: 'Underground street racers gather on Downtown Boulevard. Challenge them to a 3-checkpoint sprint for high cash.'
  },
  {
    id: 'event_courier_ambush',
    title: 'ARMORED COURIER HEIST',
    reward: 18000,
    desc: 'An unescorted cash courier is stranded near the Harbor Gate. Ambush for instant contraband loot.'
  }
];
