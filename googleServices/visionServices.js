const vision = require('@google-cloud/vision');

const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_VISION_KEYFILE,
});

async function analyzeImageLabels(imageUrl, topN = 5) {
  if (!imageUrl) {
    console.warn("[Vision Debug] No imageUrl provided");
    return [];
  }

  console.log(`[Vision Debug] Starting label detection for: ${imageUrl}`);
  console.log(`[Vision Debug] topN requested: ${topN}`);

  try {
    const [result] = await visionClient.labelDetection(imageUrl);

    if (!result) {
      console.warn("[Vision Debug] No result returned from labelDetection");
      return [];
    }

    console.log("[Vision Debug] Raw result keys:", Object.keys(result));
    console.log(
      "[Vision Debug] Label annotations count:",
      result.labelAnnotations?.length || 0
    );

    const labels = (result.labelAnnotations || [])
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topN)
      .map((l) => ({
        description: l.description,
        score: l.score,
      }));

    console.log("[Vision Debug] Final labels:", labels);
    return labels;
  } catch (err) {
    console.error(
      "[Vision Debug] visionService.analyzeImageLabels error:",
      err.message || err
    );
    throw err;
  }
}

module.exports = { analyzeImageLabels };
