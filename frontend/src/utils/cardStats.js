// Realistic Clash Royale stats data and heuristics generator for all cards

const SPECIFIC_STATS = {
  "knight": {
    hp: 1450, damage: 167, dps: 139, hitSpeed: "1.2s", speed: "Medium", range: "Melee",
    description: "A tough melee fighter. The Knight's handsome mustache and thick armor make him a solid tank for cheap cycle decks.",
    evoDescription: "Shielded Dash: The Evolution Knight takes 60% less damage while moving. Deals double damage on dash contact."
  },
  "archers": {
    hp: 304, damage: 108, dps: 120, hitSpeed: "0.9s", speed: "Medium", range: "Ranged (5.0)",
    description: "A pair of unarmored ranged attackers. They are great for taking out air swarms or supporting tanks.",
    evoDescription: "Power Shot: Deals double damage when hitting targets at maximum range (4.5 to 5.0 tiles)."
  },
  "giant": {
    hp: 3500, damage: 242, dps: 161, hitSpeed: "1.5s", speed: "Slow", range: "Melee (Targets Buildings)",
    description: "Slow but durable, only attacks buildings. When he reaches a tower, he deals massive punches.",
    evoDescription: null
  },
  "pekka": {
    hp: 3760, damage: 678, dps: 376, hitSpeed: "1.8s", speed: "Slow", range: "Melee",
    description: "A heavily armored, slow melee fighter. Rips through high-HP targets like Giants or Golems easily but is easily distracted by swarms.",
    evoDescription: "Soul Harvest: Heals 10% of max HP on every kill she secures."
  },
  "mini-pekka": {
    hp: 1200, damage: 598, dps: 373, hitSpeed: "1.6s", speed: "Fast", range: "Melee",
    description: "The Arena's certified pancake lover. High DPS single-target destroyer that runs fast but has medium health.",
    evoDescription: null
  },
  "hog-rider": {
    hp: 1408, damage: 264, dps: 165, hitSpeed: "1.6s", speed: "Very Fast", range: "Melee (Targets Buildings)",
    description: "Fast ground troop that bypasses obstacles by jumping over the river. Only hits buildings. Hog Riderrr!",
    evoDescription: null
  },
  "golem": {
    hp: 5120, damage: 286, dps: 114, hitSpeed: "2.5s", speed: "Slow", range: "Melee (Targets Buildings)",
    description: "Slow, heavy building-attacker. Explodes upon death into two smaller Golemites, dealing area damage and pushing back units.",
    evoDescription: null
  },
  "witch": {
    hp: 838, damage: 134, dps: 121, hitSpeed: "1.1s", speed: "Medium", range: "Ranged (5.0, Splash)",
    description: "Summons Skeletons continuously and shoots magical splash energy balls that hit both ground and air units.",
    evoDescription: null
  },
  "musketeer": {
    hp: 720, damage: 218, dps: 200, hitSpeed: "1.1s", speed: "Medium", range: "Ranged (6.0)",
    description: "Don't be fooled by her delicately coiffed hair; the Musketeer is a sharp-shooting defense anchor against heavy air threats.",
    evoDescription: null
  },
  "baby-dragon": {
    hp: 1152, damage: 154, dps: 102, hitSpeed: "1.5s", speed: "Fast", range: "Ranged (3.5, Splash)",
    description: "Flying baby dragon that spits fireball splash projectiles. Fills the crucial role of flying tank and splasher.",
    evoDescription: null
  },
  "skeleton-army": {
    hp: 81, damage: 81, dps: 81, hitSpeed: "1.0s", speed: "Fast", range: "Melee",
    description: "Spawns a massive swarm of 15 fragile skeletons. High DPS defense against single-target killers, but countered instantly by spells.",
    evoDescription: null
  },
  "skeletons": {
    hp: 81, damage: 81, dps: 81, hitSpeed: "1.0s", speed: "Fast", range: "Melee",
    description: "Three weak melee fighters. Excellent for cycling, pulling threat cards, and minor defense stalling.",
    evoDescription: "Recruit Surge: Skeletons multiply! Hits spawn more skeletons, up to a maximum stack of 6 units."
  },
  "the-log": {
    hp: 0, damage: 290, dps: 0, hitSpeed: "N/A", speed: "N/A", range: "Width 3.9, Roll 10.1",
    description: "A spilt bottle of Rage turned an innocent tree log into a rolling spike cylinder, crushing everything on the ground.",
    evoDescription: null
  },
  "zap": {
    hp: 0, damage: 192, dps: 0, hitSpeed: "N/A", speed: "N/A", range: "Radius 2.5",
    description: "Stuns targets for 0.5 seconds, resetting charge abilities (like Sparky or Inferno Dragon) and clearing weak swarms.",
    evoDescription: "Lightning Storm: Zaps the field 3 times in a row, expanding in size with each pulse."
  },
  "fireball": {
    hp: 0, damage: 689, dps: 0, hitSpeed: "N/A", speed: "N/A", range: "Radius 2.5",
    description: "Deals high area damage and knocks back support troops. A core spell to resolve high-HP support defensive walls.",
    evoDescription: null
  },
  "poison": {
    hp: 0, damage: 720, dps: 90, hitSpeed: "1.0s", speed: "N/A", range: "Radius 3.5",
    description: "Covers the area in a toxic sticky mist, dealing tick damage over 8 seconds and slowing down attack speeds.",
    evoDescription: null
  },
  "cannon": {
    hp: 887, damage: 212, dps: 265, hitSpeed: "0.8s", speed: "Static", range: "Ranged (5.5)",
    description: "A defensive building that shoots heavy cannonballs. Cheap, high fire-rate defense against ground pushes.",
    evoDescription: null
  },
  "tesla": {
    hp: 1152, damage: 218, dps: 200, hitSpeed: "1.1s", speed: "Static", range: "Ranged (5.5)",
    description: "Defensive building that retreats underground when no enemies are nearby, making it immune to spells like Fireball or Earthquake.",
    evoDescription: "Pulse Barrier: Releases a circular electrical shockwave upon popping up, pushing back and damaging units."
  },
  "inferno-tower": {
    hp: 1728, damage: "43 - 870", dps: "50 - 1000+", hitSpeed: "0.4s", speed: "Static", range: "Ranged (6.0)",
    description: "Defensive building that shoots a thermal laser beam, heating up over time. Destroys Giants, Golems, and Pekkas in seconds.",
    evoDescription: null
  },
  "valkyrie": {
    hp: 1650, damage: 221, dps: 147, hitSpeed: "1.5s", speed: "Medium", range: "Melee (360° Splash)",
    description: "Tough melee fighter that spins her double-sided axe, dealing area splash damage around herself to destroy swarms instantly.",
    evoDescription: "Tornado Spin: Pulls nearby enemies toward herself with each spin, clustering support units."
  },
  "little-prince": {
    hp: 700, damage: 110, dps: 183, hitSpeed: "0.6s", speed: "Medium", range: "Ranged (5.5)",
    description: "Rapid-fire ranged royalty. Shoots faster the longer he fires continuously at a single target.",
    heroAbility: {
      name: "Royal Rescue",
      cost: 3,
      description: "Summons his giant Guardian who charges onto the field, dealing heavy knockback area damage."
    }
  },
  "monk": {
    hp: 2150, damage: 190, dps: 211, hitSpeed: "0.9s", speed: "Medium", range: "Melee",
    description: "A martial arts master. His third hit pushes back units, and his meditative ability deflects spells.",
    heroAbility: {
      name: "Pensive Protection",
      cost: 1,
      description: "Creates a defensive shield reducing incoming damage by 80% and reflecting all enemy projectiles and spells back."
    }
  },
  "archer-queen": {
    hp: 1000, damage: 225, dps: 187, hitSpeed: "1.2s", speed: "Medium", range: "Ranged (5.0)",
    description: "She is elegant and deadly. Her rapid crossbow bolts pierce through heavy air and ground targets alike.",
    heroAbility: {
      name: "Cloaking Crossbow",
      cost: 1,
      description: "Becomes fully invisible for 3 seconds while increasing her attack speed by 200% for rapid bursts."
    }
  },
  "golden-knight": {
    hp: 1800, damage: 160, dps: 177, hitSpeed: "0.9s", speed: "Medium", range: "Melee",
    description: "A dashing warrior with beautiful golden hair. Dashes from target to target, clearing swarms easily.",
    heroAbility: {
      name: "Dashing Dash",
      cost: 1,
      description: "Launches a chained dashing attack, striking up to 10 targets in sequence and moving forward."
    }
  },
  "skeleton-king": {
    hp: 2300, damage: 205, dps: 128, hitSpeed: "1.6s", speed: "Medium", range: "Melee (Splash)",
    description: "Collects the souls of fallen troops. He uses these souls to summon a skeleton army of his own.",
    heroAbility: {
      name: "Soul Summoning",
      cost: 2,
      description: "Summons a wave of Skeletons around himself. The quantity scales with the souls collected (up to 16)."
    }
  },
  "void": {
    hp: 0, damage: "120 - 480", dps: 0, hitSpeed: "N/A", speed: "N/A", range: "Radius 2.0",
    description: "A dark spatial anomaly spell. Deals massive damage to single targets, medium to pairs, and low damage to crowds.",
    evoDescription: null
  },
  "goblin-demolisher": {
    hp: 920, damage: 135, dps: 90, hitSpeed: "1.5s", speed: "Medium", range: "Ranged (Splash)",
    description: "Thrives on explosions! When his health drops below 50%, he runs forward and self-destructs on targets.",
    evoDescription: null
  },
  "goblin-machine": {
    hp: 2200, damage: 180, dps: 150, hitSpeed: "1.2s", speed: "Slow", range: "Melee",
    description: "A lumbering mech that punches ground targets while firing a rocket at random air or ground units on the map.",
    evoDescription: null
  },
  "suspicious-bush": {
    hp: 450, damage: 210, dps: 150, hitSpeed: "1.4s", speed: "Very Fast", range: "Melee (Targets Buildings)",
    description: "Just an innocent looking bush walking towards your tower... until it breaks to reveal hidden recruits!",
    evoDescription: null
  },
  "goblin-stein": {
    hp: 1100, damage: 140, dps: 116, hitSpeed: "1.2s", speed: "Static", range: "Ranged (5.0)",
    description: "A heavy static generator. Zap-stuns targets while spawning charging Goblins from its core.",
    evoDescription: null
  },
  "goblin-curse": {
    hp: 0, damage: 110, dps: 18, hitSpeed: "1.0s", speed: "N/A", range: "Radius 3.0",
    description: "A dark goblin fog spell. Enemies caught inside take small damage and turn into fragile Goblins upon death.",
    evoDescription: null
  },
  "balloon-hero": {
    hp: 2200, damage: 850, dps: 283, hitSpeed: "3.0s", speed: "Medium", range: "Melee (Targets Buildings)",
    description: "A legendary captain of the skies. This armored airship drops massive bombs on buildings and defends itself with air cannons.",
    heroAbility: {
      name: "Elixir Drop",
      cost: 2,
      description: "Drops an active Elixir collector crate onto the battlefield that explodes and grants 3 Elixir to your bar."
    }
  },
  "mini-pekka-hero": {
    hp: 1950, damage: 720, dps: 480, hitSpeed: "1.5s", speed: "Very Fast", range: "Melee",
    description: "The ultimate pancake champion. Fast-running, hard-hitting sword fighter who can charge and slice with high precision.",
    heroAbility: {
      name: "Pancake Shield",
      cost: 1,
      description: "Deploys a giant metal skillet shield, blocking all ranged attacks for 4 seconds while healing 15% HP."
    }
  }
};

export const getCardDetailedStats = (card) => {
  if (!card) return null;
  
  // Return custom mapping if available
  if (SPECIFIC_STATS[card.key]) {
    return {
      ...card,
      ...SPECIFIC_STATS[card.key]
    };
  }

  // Otherwise calculate realistic fallbacks based on metadata
  let hp = 600;
  let damage = 150;
  let hitSpeed = "1.3s";
  let speed = "Medium";
  let range = card.targets === "air-ground" || card.role.includes("spell") ? "Ranged (5.0)" : "Melee";
  
  // Calculate based on elixir & role
  if (card.type === "Spell") {
    hp = 0;
    damage = card.elixir * 130;
    hitSpeed = "N/A";
    speed = "N/A";
    range = "Area Damage";
  } else if (card.type === "Building") {
    hp = card.elixir * 320;
    damage = card.elixir * 50;
    hitSpeed = "1.0s";
    speed = "Static";
  } else {
    // Troop fallbacks
    if (card.role === "tank") {
      hp = card.elixir * 550;
      damage = card.elixir * 40;
    } else if (card.role === "tank-killer") {
      hp = card.elixir * 250;
      damage = card.elixir * 100;
      hitSpeed = "1.5s";
    } else if (card.role === "cycle") {
      hp = card.elixir * 120;
      damage = card.elixir * 60;
      speed = "Very Fast";
    } else {
      hp = card.elixir * 200;
      damage = card.elixir * 45;
    }
  }

  const dps = hp === 0 ? 0 : Math.round(damage / parseFloat(hitSpeed));

  return {
    ...card,
    hp,
    damage,
    dps,
    hitSpeed,
    speed,
    range,
    description: `A formidable ${card.rarity.toLowerCase()} ${card.type.toLowerCase()} unlocked in Arena ${card.arena}. Excels as a ${card.role.replace('-', ' ')} unit targeting ${card.targets}.`,
    evoDescription: card.isEvo ? "Evolution improves core speed, targets, and grants a secondary special ability in combat." : null
  };
};
