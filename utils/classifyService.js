const serviceMap = require("./serviceMap");
const stringSimilarity = require("string-similarity");

const blacklist = new Set([
  "getty images",
  "stock photography",
  "image",
  "photo",
  "photograph",
  "photography",
  "illustration",
  "graphic",
  "vector",
  "drawing",
  "logo",
  "brand",
  "label",
  "trademark",
  "icon",
  "product",
  "object",
  "material",
  "composite material",
  "equipment",
  "item",
  "thing",
  "room",
  "wall",
  "floor",
  "ceiling",
  "interior design",
  "indoor",
  "indoor space",
  "background",
  "service",
  "industry",
  "business",
  "enterprise",
  "company",
  "commercial",
  "retail",
  "modern",
  "minimalist",
  "decoration",
  "design",
  "style",
  "furniture",
  "table",
  "chair",
  "pattern",
  "texture",
  "color",
  "shape",
  "shadow",
  "light",
  "reflection",
  "composition",
  "homepage",
  "banner",
  "template",
  "stock",
  "clipart",
  "people",
  "person",
  "man",
  "woman",
  "human",
  "nobody",
  "portrait",
  "blur",
  "machine",
  "used",
  "brand name",
  "gree",
  "haier",
  "whirlpool",
  "bosch",
  "floor",
  "flooring",
  "wood",
  "wood flooring",
  "furniture",
  "material",
  "moisture",
  "damp",
  "Outside of School",
  "FRVME PRFCT",
  "Jar",
  "Sea glass",
]);

const boostMap = {
  clog: "Plumber",
  "clogged drain": "Plumber",
  "drain cleaner": "Plumber",
  "pipe leak": "Plumber",
  sewer: "Plumber",
  "water leak": "Plumber",
  plumbing: "Plumber",
  "blocked drain": "Plumber",
  pipe: "Plumber",
  leak: "Plumber",
  "slow drain": "Plumber",
  "pipe blockage": "Plumber",

  // Glazier
  "broken mirror": "Glazier",
  "mirror repair": "Glazier",
  "cracked glass": "Glazier",
  shattered: "Glazier",
  "glass repair": "Glazier",
  "glass door": "Glazier",
  "window pane": "Glazier",
  "shattered glass": "Glazier",
  "broken glass": "Glazier",
  "tempered glass": "Glazier",

  "garage stuck": "GarageDoorRepair",
  "garage jammed": "GarageDoorRepair",
  "garage door repair": "GarageDoorRepair",
  "broken garage": "GarageDoorRepair",

  "air conditioner": "HVAC",
  "air conditioning": "HVAC",
  "ductless air conditioner": "HVAC",
  hvac: "HVAC",
  "damaged ac": "HVAC",
  "ac repair": "HVAC",
  "broken ac": "HVAC",
  "heating, ventilation, and air conditioning": "HVAC",
  "split ac": "HVAC",
  "outdoor unit": "HVAC",
  "burnt ac": "HVAC",

  "short circuit": "Electrician",
  "electric panel": "Electrician",
  "circuit breaker": "Electrician",

  "lost key": "Locksmith",
  "lock rekey": "Locksmith",
  unlock: "Locksmith",
  "car lockout": "Locksmith",
  "key stuck": "Locksmith",

  cockroach: "PestControl",
  termite: "PestControl",
  infestation: "PestControl",
  "bed bug": "PestControl",
  "bug infestation": "PestControl",

  // Handyman
  "tv mount": "Handyman",
  "door adjustment": "Handyman",
  "small repairs": "Handyman",
  "light fixture": "Handyman",
  "curtain rod": "Handyman",
  "handle replacement": "Handyman",

  // Painter
  "wall paint": "Painting",
  "house paint": "Painting",
  "paint touch-up": "Painting",
  "ceiling paint": "Painting",

  // Appliance Repair
  "washing machine": "ApplianceRepair",
  refrigerator: "ApplianceRepair",
  dryer: "ApplianceRepair",
  stove: "ApplianceRepair",
  dishwasher: "ApplianceRepair",
  microwave: "ApplianceRepair",
  oven: "ApplianceRepair",
  washer: "ApplianceRepair",
  "ice maker": "ApplianceRepair",

  // Auto Repair
  "flat tire": "AutoRepair",
  "car engine": "AutoRepair",
  "auto service": "AutoRepair",
  "vehicle repair": "AutoRepair",
  "check engine": "AutoRepair",
  brake: "AutoRepair",

  // Waterproofing
  mold: "Waterproofing",
  "indoor mold": "Waterproofing",
  "mold remediation": "Waterproofing",
  "black mold": "Waterproofing",
  moist: "Waterproofing",
  efflorescence: "Waterproofing",
  "wet basement": "Waterproofing",
  "leaky basement": "Waterproofing",

  // Landscaping
  yard: "Landscaping",
  grass: "Landscaping",
  mowing: "Landscaping",
  "tree trimming": "Landscaping",
  hedge: "Landscaping",
  lawn: "Landscaping",
  garden: "Landscaping",
  mulch: "Landscaping",
  planting: "Landscaping",
  landscaping: "Landscaping",
  "landscape design": "Landscaping",
  "outdoor cleanup": "Landscaping",
  "weed removal": "Landscaping",

  // Roofing
  roof: "Roofing",
  "roof leak": "Roofing",
  "roof repair": "Roofing",
  "roof damage repair": "Roofing",
  roofing: "Roofing",
  "roof replacement": "Roofing",
  shingles: "Roofing",
  "broken roof": "Roofing",
};

function classifyServiceWithScore(labels) {
  const normalizedLabels = labels.map((l) => l.toLowerCase().trim());
  const filteredLabels = normalizedLabels.filter((l) => !blacklist.has(l));
  const source = filteredLabels.length > 0 ? filteredLabels : normalizedLabels;

  // Immediate match from boost map
  for (const label of source) {
    if (boostMap[label]) {
      return {
        category: capitalizeCategory(boostMap[label]),
        match: label,
        confidence: 1.0,
      };
    }
  }

  const categoryScores = {};

  for (const [category, keywords] of Object.entries(serviceMap)) {
    const scores = [];
    let bestScore = 0;
    let bestMatch = "";

    for (const keyword of keywords) {
      for (const label of source) {
        const score = stringSimilarity.compareTwoStrings(label, keyword);

        if (score > 0.6) {
          scores.push(score);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = label;
          }
        }
      }
    }

    const avg = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    categoryScores[category] = {
      confidence: bestScore,
      match: bestMatch,
      avg,
    };
  }

  // Pick the category with the best average + confidence
  const [bestCategory, bestData] = Object.entries(categoryScores).reduce(
    (best, current) => {
      const currentScore = current[1].avg + current[1].confidence;
      const bestScore = best[1].avg + best[1].confidence;
      return currentScore > bestScore ? current : best;
    },
    ["Handyman", { confidence: 0, match: "", avg: 0 }]
  );

  if (bestData.confidence < 0.5) {
    console.warn("Low-confidence classification:", {
      labels: source,
      pickedCategory: bestCategory,
      match: bestData.match,
      score: bestData.confidence.toFixed(2),
    });
  }

  return {
    category: capitalizeCategory(bestCategory),
    match: bestData.match,
    confidence: bestData.confidence,
  };
}

function capitalizeCategory(category) {
  return category
    .split(/[_\s]/g)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
}
module.exports = { classifyServiceWithScore };
