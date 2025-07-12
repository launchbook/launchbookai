// launchbookai/src/frontend/generate.js

// ✅ This module handles: URL + AI generation, formatting presets, API key, sticky preview, and download/save

// ✅ CommonJS-compatible frontend logic (no `import`/`export`)

let useOwnAPIKey = false;
let verifiedAPIKey = null;
let generatedContent = null;
let currentUser = null;

// 🌟 Init generator UI + handlers
window.initGenerator = async function () {
  await loadFormattingPreset();
  if (typeof setupTemplatePicker === 'function') setupTemplatePicker();
  if (typeof updateCoverPreview === 'function') updateCoverPreview();
  setupAPIKeyLogic();
  setupGenerateHandler();
  setupStickySaveButton();
};

// 🧠 Load latest formatting preset (if available)
async function loadFormattingPreset() {
  const { data } = await supabase
    .from("generated_files")
    .select("*")
    .eq("user_id", currentUser?.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return;
  document.getElementById("font_type").value = data.font_type;
  document.getElementById("font_size").value = data.font_size;
  document.getElementById("line_spacing").value = data.line_spacing;
  document.getElementById("paragraph_spacing").value = data.paragraph_spacing;
  document.getElementById("margin_top").value = data.margin_top;
  document.getElementById("margin_right").value = data.margin_right;
  document.getElementById("margin_bottom").value = data.margin_bottom;
  document.getElementById("margin_left").value = data.margin_left;
  document.getElementById("page_size").value = data.page_size;
  document.getElementById("text_alignment").value = data.text_alignment;
}

// 🔑 API Key Verification
function setupAPIKeyLogic() {
  const apiInput = document.getElementById("openai_api_key");
  const apiStatus = document.getElementById("api_status");
  const apiClear = document.getElementById("clear_api_btn");

  apiInput.addEventListener("input", () => {
    const key = apiInput.value.trim();
    if (key.startsWith("sk-")) {
      useOwnAPIKey = true;
      verifiedAPIKey = key;
      window.userApiKey = key; // ✅ now accessible globally
      apiStatus.innerHTML = "<span class='text-green-500'>✅ Verified</span>";
      apiClear.classList.remove("hidden");
    } else {
      useOwnAPIKey = false;
      verifiedAPIKey = null;
      window.userApiKey = null;
      apiStatus.innerHTML = "<span class='text-red-500'>❌ Invalid Key</span>";
      apiClear.classList.add("hidden");
    }
  });

  apiClear.addEventListener("click", () => {
    apiInput.value = "";
    apiStatus.innerHTML = "";
    useOwnAPIKey = false;
    verifiedAPIKey = null;
    window.userApiKey = null;
    apiClear.classList.add("hidden");
  });
}

  apiClear.addEventListener("click", () => {
    apiInput.value = "";
    apiStatus.innerHTML = "";
    useOwnAPIKey = false;
    verifiedAPIKey = null;
    apiClear.classList.add("hidden");
  });
}

// 🚀 Main Generate Handler
function setupGenerateHandler() {
  document.getElementById("generateBtn").addEventListener("click", async () => {
    const url = document.getElementById("source_url").value.trim();
    const inputType = document.querySelector("input[name='input_type']:checked").value;

    const payload = {
      url,
      inputType,
      formatting: collectFormatting(),
      cover_url: document.getElementById("cover_preview").src,
      output_format: document.querySelector("input[name='output_format']:checked").value,
      image_count: parseInt(document.getElementById("image_count").value),
      useOwnAPIKey,
      apiKey: verifiedAPIKey,
    };

    showSpinner();

    try {
      const res = await fetch(`${BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");

      generatedContent = result;
      renderPreview(result);
      showToast("✅ eBook Generated Successfully");
    } catch (err) {
      alert("❌ " + err.message);
    }

    hideSpinner();
  });
}

// 🧾 Collect formatting values
function collectFormatting() {
  return {
    font_type: document.getElementById("font_type").value,
    font_size: document.getElementById("font_size").value,
    line_spacing: document.getElementById("line_spacing").value,
    paragraph_spacing: document.getElementById("paragraph_spacing").value,
    margin_top: document.getElementById("margin_top").value,
    margin_right: document.getElementById("margin_right").value,
    margin_bottom: document.getElementById("margin_bottom").value,
    margin_left: document.getElementById("margin_left").value,
    page_size: document.getElementById("page_size").value,
    text_alignment: document.getElementById("text_alignment").value,
  };
}

// 📖 Render output
function renderPreview(result) {
  const container = document.getElementById("ebook_preview_area");
  container.innerHTML = result.html_preview;
  document.getElementById("saveBtn").classList.remove("hidden");
}

// 💾 Save + Download handler
function setupStickySaveButton() {
  document.getElementById("saveBtn").addEventListener("click", async () => {
    if (!generatedContent) return;
    showSpinner();

    try {
      const res = await fetch(`${BASE_URL}/save-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedContent),
      });
      const result = await res.json();
      if (result.download_url) {
        window.open(result.download_url, "_blank");
      } else {
        throw new Error("Download URL missing");
      }
    } catch (err) {
      alert("❌ " + err.message);
    }

    hideSpinner();
  });
}

// 🔄 Spinner handlers
function showSpinner() {
  document.getElementById("generateBtn").disabled = true;
  document.getElementById("spinner").classList.remove("hidden");
}
function hideSpinner() {
  document.getElementById("generateBtn").disabled = false;
  document.getElementById("spinner").classList.add("hidden");
}

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow z-50";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
