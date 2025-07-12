// launchbookai/src/frontend/cover.js
// ✅ Handles cover preview, generation, regeneration, deletion, and upload

let currentCoverURL = "";

// ✅ Update cover preview image in UI
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

// 📤 Upload user's own image
function handleCoverUpload() {
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

// ♻️ Regenerate cover via API with credit check + logging
async function regenerateCoverImage(prompt, userApiKey = "") {
  const btn = document.getElementById("regenerateCoverBtn");
  const spinner = document.getElementById("spinner");
  btn.disabled = true;
  spinner.classList.remove("hidden");

  try {
    // ✅ Get current user
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return window.location.href = "/login";

    const cost = CREDIT_COSTS.generate_cover;

    const allowed = await checkCredits(user.id, cost);
    if (!allowed) return;

    const response = await fetch("/regenerate-cover-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": userApiKey || undefined,
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    if (!response.ok || !data?.cover_url) throw new Error(data?.error || "Cover generation failed");

    updateCoverPreview(data.cover_url);
    showToast("✅ Cover regenerated successfully");

    await logUsage(user.id, user.email, "generate_cover", {
      used_api_key: !!userApiKey,
      prompt
    });

    loadUserCredits();
  } catch (err) {
    alert("❌ " + err.message);
  } finally {
    btn.disabled = false;
    spinner.classList.add("hidden");
  }
}

// ❌ Delete uploaded/generated cover
function deleteCoverImage() {
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

// 🔄 Get the selected cover URL
function getCoverURL() {
  return currentCoverURL;
}

// 🔔 Show toast message
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow z-50";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// 🌐 Expose functions to global window object
window.updateCoverPreview = updateCoverPreview;
window.handleCoverUpload = handleCoverUpload;
window.regenerateCoverImage = regenerateCoverImage;
window.deleteCoverImage = deleteCoverImage;
window.getCoverURL = getCoverURL;
