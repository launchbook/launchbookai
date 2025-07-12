// ✅ This module handles: Regeneration of cover, content section, or images (CommonJS version)

let currentUser = null;
const BASE_URL = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://ebook-pdf-generator.onrender.com';

// 🔄 Spinner & Toast from window.utils
function showSpinner() {
  document.getElementById("spinner")?.classList.remove("hidden");
}
function hideSpinner() {
  document.getElementById("spinner")?.classList.add("hidden");
}
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow z-50";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ✅ Main initializer
window.initRegenHandlers = async function () {
  // Ensure currentUser is fetched
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.href = "/login";
  currentUser = session.user;

  // Cover Regen Button
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

  // Text Block Regen Button
  document.querySelectorAll(".regen-text-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const blockId = e.target.dataset.blockId;
      regenerateText(blockId);
    });
  });
};

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

// 🔁 Regenerate Text Block
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
