// launchbookai/src/frontend/cover.js
// ✅ Handles cover preview, generation, regeneration, deletion, and upload

let currentCoverURL = "";

// Utility to update the visible cover preview + related UI buttons
function updateCoverPreview(url) {
  const preview = document.getElementById("coverPreview");
  const deleteBtn = document.getElementById("deleteCoverBtn");
  const regenerateBtn = document.getElementById("regenerateCoverBtn");
  const uploadLabel = document.getElementById("uploadCoverLabel");

  preview.src = url;
  currentCoverURL = url;

  preview.classList.remove("hidden");
  deleteBtn.classList.remove("hidden");
  regenerateBtn.classList.remove("hidden");
  uploadLabel.classList.add("hidden");
}

// 📤 Upload own image as cover
export function handleCoverUpload() {
  const input = document.getElementById("uploadCoverInput");
  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// ♻️ Regenerate AI cover image
export async function regenerateCoverImage(prompt, userApiKey = "") {
  const btn = document.getElementById("regenerateCoverBtn");
  const spinner = document.getElementById("spinner");
  btn.disabled = true;
  spinner.classList.remove("hidden");

  try {
    const response = await fetch("/regenerate-cover-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": userApiKey || undefined,
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    if (data?.cover_url) {
      updateCoverPreview(data.cover_url);
    }
  } catch (err) {
    alert("Error generating cover. Try again.");
  } finally {
    btn.disabled = false;
    spinner.classList.add("hidden");
  }
}

// ❌ Delete uploaded/generated cover
export function deleteCoverImage() {
  const preview = document.getElementById("coverPreview");
  const deleteBtn = document.getElementById("deleteCoverBtn");
  const regenerateBtn = document.getElementById("regenerateCoverBtn");
  const uploadLabel = document.getElementById("uploadCoverLabel");
  
  currentCoverURL = "";
  preview.src = "";
  preview.classList.add("hidden");
  deleteBtn.classList.add("hidden");
  regenerateBtn.classList.add("hidden");
  uploadLabel.classList.remove("hidden");
}

// Returns the current selected/previewed cover URL
export function getCoverURL() {
  return currentCoverURL;
}

