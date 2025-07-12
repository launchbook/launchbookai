// launchbookai/src/frontend/regen.js

// ✅ This module handles: Regeneration of cover, content section, or images

import { showSpinner, hideSpinner, showToast } from "./utils.js";

let currentUser = null;
const BASE_URL = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://ebook-pdf-generator.onrender.com';

export async function initRegenHandlers() {
  // Cover Image Regen Button
  document.querySelectorAll(".regen-cover-btn").forEach(btn => {
    btn.addEventListener("click", () => regenerateCover());
  });

  // Image Regen Button
  document.querySelectorAll(".regen-img-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const imgId = e.target.dataset.imageId;
      regenerateImage(imgId);
    });
  });

  // Text Section Regen Button
  document.querySelectorAll(".regen-text-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const blockId = e.target.dataset.blockId;
      regenerateText(blockId);
    });
  });
}

// 🔁 Regenerate Cover
async function regenerateCover() {
  showSpinner();
  try {
    const res = await fetch(`${BASE_URL}/regenerate-cover-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to regenerate cover");

    document.getElementById("cover_preview").src = result.cover_url;
    showToast("✅ Cover image regenerated");
  } catch (err) {
    alert("❌ " + err.message);
  }
  hideSpinner();
}

// 🔁 Regenerate Individual Image
async function regenerateImage(imageId) {
  showSpinner();
  try {
    const res = await fetch(`${BASE_URL}/regenerate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id, image_id: imageId })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to regenerate image");

    const img = document.querySelector(`[data-image-id='${imageId}']`);
    img.src = result.image_url;
    showToast("✅ Image regenerated");
  } catch (err) {
    alert("❌ " + err.message);
  }
  hideSpinner();
}

// 🔁 Regenerate Individual Text Block
async function regenerateText(blockId) {
  showSpinner();
  try {
    const res = await fetch(`${BASE_URL}/regenerate-text-block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id, block_id: blockId })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to regenerate text");

    const block = document.querySelector(`[data-block-id='${blockId}']`);
    block.innerHTML = result.new_html;
    showToast("✅ Text block regenerated");
  } catch (err) {
    alert("❌ " + err.message);
  }
  hideSpinner();
}

