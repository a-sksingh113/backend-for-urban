const vision = require('@google-cloud/vision');

const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_VISION_KEYFILE,
});


async function analyzeImageLabels(imageUrl, topN = 5) {
  if (!imageUrl) return [];
  try {
    const [result] = await visionClient.labelDetection(imageUrl);
    const labels = (result.labelAnnotations || [])
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topN)
      .map((l) => ({ description: l.description, score: l.score }));
    return labels;
  } catch (err) {
    console.error('visionService.analyzeImageLabels error:', err.message || err);
    throw err;
  }
}

module.exports = { analyzeImageLabels };
