function estimateCreditCost({ wordCount = 0, imageCount = 0, withCover = false, isRegeneration = false }) {
  const base = Math.ceil(wordCount / 200) * 40;
  const imageCost = imageCount * 120;
  const coverCost = withCover ? 300 : 0;
  const regenPenalty = 0;

  const total = base + imageCost + coverCost + regenPenalty;
  const floor = isRegeneration ? 500 : 1000;
  return Math.max(total, floor);
}

function estimateCoverImageCost({ style = "default" }) {
  return 300;
}

function estimateEmailCost() {
  return 30;
}

function estimateURLConversionCost({ wordCount = 0, imageCount = 0 }) {
  const base = Math.ceil(wordCount / 200) * 40;
  const images = imageCount * 120;
  return Math.max(base + images, 800); // Floor of 800
}

module.exports = {
  estimateCreditCost,
  estimateCoverImageCost,
  estimateEmailCost,
  estimateURLConversionCost
};
