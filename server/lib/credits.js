// lib/credits.js

const CREDIT_COSTS = {
  generate_pdf: 1000,
  generate_epub: 1000,
  generate_from_url: 800,
  regen_pdf: 500,
  regen_image: 100,
  generate_cover: 150,
  send_email: 30,
};

// 🧠 Dynamic Credit Calculation
function estimateCreditCost({ wordCount = 0, imageCount = 0, withCover = false, isRegeneration = false }) {
  const base = Math.ceil(wordCount / 200) * 40;      // 40 credits per 200 words
  const imageCost = imageCount * 120;                // 120 credits per image
  const coverCost = withCover ? CREDIT_COSTS.generate_cover : 0;

  const total = base + imageCost + coverCost;
  const floor = isRegeneration ? CREDIT_COSTS.regen_pdf : CREDIT_COSTS.generate_pdf;
  return Math.max(total, floor);
}

function estimateURLConversionCost({ wordCount = 0, imageCount = 0 }) {
  const base = Math.ceil(wordCount / 200) * 40;
  const images = imageCount * 120;
  return Math.max(base + images, CREDIT_COSTS.generate_from_url);
}

function estimateCoverImageCost() {
  return CREDIT_COSTS.generate_cover;
}

function estimateEmailCost() {
  return CREDIT_COSTS.send_email;
}

module.exports = {
  CREDIT_COSTS,
  estimateCreditCost,
  estimateURLConversionCost,
  estimateCoverImageCost,
  estimateEmailCost
};
