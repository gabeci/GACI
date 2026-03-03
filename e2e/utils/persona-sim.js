function mulberry32(seed) {
  let t = seed;
  return function rng() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const firstNames = ["Ari", "Mina", "Leo", "Nora", "Kai", "Tess", "Ivy", "Rami", "Zoe", "Noah"];
const styles = ["direct", "reflective", "brief", "verbose", "structured"];

function generatePersonas(seed, count) {
  const rng = mulberry32(seed);

  return Array.from({ length: count }).map((_, index) => {
    const first = firstNames[Math.floor(rng() * firstNames.length)] || "User";
    const style = styles[Math.floor(rng() * styles.length)] || "direct";
    const id = `p-${seed}-${String(index + 1).padStart(2, "0")}`;

    return {
      id,
      name: `${first}-${index + 1}`,
      style
    };
  });
}

const scenarios = [
  {
    id: "work-pressure",
    expectedEventType: "slip",
    promoteToStar: false,
    message: (persona) =>
      `[${persona.id} ${persona.name}] I am overwhelmed by work pressure today and feel blocked. Keep it ${persona.style}.`
  },
  {
    id: "relationship-trigger",
    expectedEventType: "recovery",
    promoteToStar: false,
    message: (persona) =>
      `[${persona.id} ${persona.name}] I had a relationship trigger, trying to recover and reset with one next step. Keep it ${persona.style}.`
  },
  {
    id: "future-anxiety",
    expectedEventType: "lock",
    promoteToStar: true,
    message: (persona) =>
      `[${persona.id} ${persona.name}] I feel anxious about the future but want to stay grounded and aligned. Keep it ${persona.style}.`
  }
];

module.exports = { mulberry32, generatePersonas, scenarios };
