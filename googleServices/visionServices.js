const vision = require('@google-cloud/vision');

const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_VISION_KEYFILE,
});


async function analyzeImageLabels(image, isBuffer = false) {
  if (!image) {
    console.warn("[Vision Debug] No image provided");
    return { candidates: [], debug: {} };
  }

  console.log(`[Vision Debug] Starting analysis for image`);

  try {
    const request = {
      image: isBuffer
        ? { content: image }
        : { source: { imageUri: image } },
      features: [
        { type: "LABEL_DETECTION", maxResults: 10 },
        { type: "WEB_DETECTION", maxResults: 10 },
        { type: "OBJECT_LOCALIZATION", maxResults: 10 },
      ],
    };

    // Annotate image
    const [response] = await visionClient.batchAnnotateImages({ requests: [request] });

    const res = response.responses[0];
    if (!res) {
      console.warn("[Vision Debug] No response from Vision API");
      return { candidates: [], debug: {} };
    }

    // Collect candidates
    const candidates = [];
    if (res.labelAnnotations) res.labelAnnotations.forEach(l => l.description && candidates.push(l.description));
    if (res.webDetection?.webEntities) res.webDetection.webEntities.forEach(e => e.description && candidates.push(e.description));
    if (res.localizedObjectAnnotations) res.localizedObjectAnnotations.forEach(o => o.name && candidates.push(o.name));

    // Prepare debug info
    const debug = {
      topLabels: (res.labelAnnotations || [])
        .slice(0, 5)
        .map(l => `${l.description}:${l.score?.toFixed(2) || '0.00'}`),
      topWeb: (res.webDetection?.webEntities || [])
        .slice(0, 5)
        .map(e => `${e.description}:${e.score?.toFixed(2) || '0.00'}`),
      topObjects: (res.localizedObjectAnnotations || [])
        .slice(0, 5)
        .map(o => `${o.name}:${o.score?.toFixed(2) || '0.00'}`),
    };

    console.log("[Vision Debug] Candidates:", candidates);
    console.log("[Vision Debug] Debug info:", debug);

    return { candidates, debug };
  } catch (err) {
    console.error("[Vision Debug] Error in analyzeBufferOrUrl:", err.message || err);
    throw err;
  }
}

module.exports = { analyzeImageLabels };
