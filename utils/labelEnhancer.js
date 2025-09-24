const TRADE_MAPPING = require("./tradeMapping");

const DEBUG = process.env.DEBUG_LABEL_ENHANCER === "true" || process.env.NODE_ENV !== "production";
function logDebug(...args) { if (DEBUG) console.debug("[labelEnhancer DEBUG]", ...args); }

function escapeRegex(s = "") { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function getTradeFromLabel(label) {
  const lower = (label || "").toLowerCase().trim();
  if (!lower) return "handyman";

  // Try exact word/token match first
  for (const [trade, keywords] of Object.entries(TRADE_MAPPING)) {
    for (const kw of keywords) {
      if (!kw) continue;
      const key = kw.toLowerCase().trim();
      const re = new RegExp(`\\b${escapeRegex(key)}\\b`, "i");
      if (re.test(lower)) {
        logDebug(`Label "${label}" -> matched trade "${trade}" via keyword "${key}"`);
        return trade;
      }
    }
  }

  // fallback: token overlap
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
  for (const [trade, keywords] of Object.entries(TRADE_MAPPING)) {
    const kws = keywords.map(k => (k || "").toLowerCase().trim());
    if (tokens.some(tok => kws.includes(tok))) {
      logDebug(`Label "${label}" -> matched trade "${trade}" via token overlap`);
      return trade;
    }
  }

  logDebug(`No trade match for label "${label}" -> fallback "handyman"`);
  return "handyman";
}

function buildQueriesForTrade(trade, labelLower) {
  const out = new Set();
  switch (trade) {
    case "plumber":
      out.add("plumbing service"); out.add("plumber"); out.add("pipe repair"); out.add(`${labelLower} repair`); break;
    case "electrician":
    case "hvacElectrician":
    case "solarElectrician":
    case "applianceElectrician":
      out.add("electrician"); out.add("electrical repair service"); out.add("wiring repair"); break;
    case "carpenter":
    case "roofCarpenter":
      out.add("carpenter"); out.add("furniture repair service"); out.add(`${labelLower} repair`); break;
    case "roofer":
    case "roofGutter":
      out.add("roofer"); out.add("roof repair service"); break;
    case "glazier":
      out.add("glass repair service"); out.add("window replacement"); out.add("glazier"); break;
    case "hvac":
      out.add("AC repair service"); out.add("HVAC technician"); break;
    case "locksmith":
      out.add("locksmith"); out.add("lock repair service"); break;
    case "applianceRepair":
      out.add("appliance repair"); break;
    case "cleaning":
    case "paintingCleaning":
      out.add("cleaning service"); break;
    case "mason":
    case "masonryElectrician":
      out.add("masonry service"); out.add("wall repair"); break;
    case "painter":
      out.add("painter"); out.add("painting service"); break;
    case "pestcontrol":
    case "pestGardening":
      out.add("pest control"); break;
    case "gardening":
      out.add("gardener"); out.add("garden maintenance service"); break;
    case "internet":
      out.add("internet service provider"); out.add("wifi repair"); break;
    case "curtainBlinds":
      out.add("curtain repair"); out.add("blinds installation"); break;
    case "furnitureRepair":
      out.add("furniture repair"); break;
    case "securitySystem":
      out.add("security system installation"); out.add("CCTV service"); break;
    case "homeAutomation":
      out.add("home automation service"); break;
    case "poolMaintenance":
      out.add("pool maintenance service"); break;
    case "doorWindow":
      out.add("door repair"); out.add("window repair"); break;
    case "flooring":
      out.add("flooring service"); out.add("floor repair"); break;
    case "chimney":
      out.add("chimney cleaning"); out.add("chimney repair"); break;
    case "aquarium":
      out.add("aquarium maintenance service"); break;
    case "laundry":
      out.add("laundry appliance repair"); break;
    case "solar":
      out.add("solar panel installation"); out.add("solar panel repair"); break;
    default:
      out.add("handyman"); out.add("home repair service"); out.add(`${labelLower} repair`); break;
  }
  return Array.from(out);
}


function enhanceLabels(labels = [], options = {}) {
  const { excludeHandyman = true } = options;
  const normalized = (labels || []).map(l => {
    if (!l) return null;
    if (typeof l === "string") return { description: l.trim(), score: null };
    if (typeof l === "object") return { description: (l.description || "").trim(), score: (typeof l.score === "number" ? l.score : null) };
    return { description: String(l).trim(), score: null };
  }).filter(Boolean);

  logDebug("Normalized labels:", normalized);

  const results = [];
  for (const lbl of normalized) {
    const labelText = lbl.description;
    const labelLower = (labelText || "").toLowerCase();
    const trade = getTradeFromLabel(labelText);

    let queries = [];
    if (!(excludeHandyman && trade === "handyman")) {
      queries = buildQueriesForTrade(trade, labelLower);
    } else {
      logDebug(`Excluding handyman queries for label "${labelText}" (trade=${trade})`);
    }

    results.push({ label: labelText, trade, queries });
  }

  logDebug("enhanceLabels result:", results);
  return results;
}

module.exports = { enhanceLabels, getTradeFromLabel };
