let useOwnAPIKey = false;
let verifiedAPIKey = null;
let generatedContent = null;
let currentUser = null;
let blocks = [];

// ✅ Init generator UI + handlers
window.initGenerator = async function () {
  await loadUserCredits();
  await loadFormattingPreset();
  if (typeof setupTemplatePicker === 'function') setupTemplatePicker();
  if (typeof updateCoverPreview === 'function') updateCoverPreview();
  setupAPIKeyLogic();
  setupGenerateHandler();
  setupStickySaveButton();

  // ✅ Auto Apply Audience Formatting on audience change
  document.getElementById("audience")?.addEventListener("change", applyAudienceFormatting);

  // ✅ Watch template change (disable formatting)
  setInterval(() => {
    const isTemplateApplied = !!window.selectedTemplateClass;
    document.querySelectorAll("#font_type, #font_size, #line_spacing, #text_alignment").forEach(el => {
      el.disabled = isTemplateApplied;
    });
  }, 500);

  // ✅ Toggle affiliate link input
  document.getElementById("include_affiliate_links")?.addEventListener("change", (e) => {
    const fields = document.getElementById("affiliateLinkFields");
    fields.classList.toggle("hidden", !e.target.checked);
  });
};

async function loadFormattingPreset() {
  const data = await loadPresetFromSupabase();
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

function setupAPIKeyLogic() {
  const apiInput = document.getElementById("openai_api_key");
  const apiStatus = document.getElementById("api_status");
  const apiClear = document.getElementById("clear_api_btn");

  apiInput.addEventListener("input", () => {
    const key = apiInput.value.trim();
    if (key.startsWith("sk-")) {
      useOwnAPIKey = true;
      verifiedAPIKey = key;
      window.userApiKey = key;
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

function setupGenerateHandler() {
  document.getElementById("generateBtn").addEventListener("click", async () => {
    const url = document.getElementById("source_url").value.trim();
    const inputType = document.querySelector("input[name='input_type']:checked")?.value || "url";
    const title = document.getElementById("titleInput").value.trim();
    const format = document.querySelector("input[name='output_format']:checked").value;

    if (!title) return alert("❌ Title is required");
    if (inputType === "url" && !url) return alert("❌ URL is required for URL to eBook");

    const imageCount = parseInt(document.getElementById("image_count").value) || 0;
    const withCover = !!document.getElementById("cover_preview")?.src;
    const wordCount = parseInt(document.getElementById("word_count")?.value || "8000");
    const dynamicCost = estimateCreditCost({ wordCount, imageCount, withCover, isRegeneration: false });

    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) return window.location.href = "/login";
    currentUser = session.user;

    const creditOK = await checkCredits(currentUser.id, dynamicCost);
    if (!creditOK) return;

    const payload = {
      user_id: currentUser.id,
      title,
      source_url: url,
      topic: document.getElementById("topicInput").value || "",
      description: document.getElementById("descInput").value || "",
      ai_instructions: document.getElementById("ai_instructions").value || "",
      cover_url: document.getElementById("cover_preview").src,
      coverPrompt: document.getElementById("coverPromptInput").value,
      output_format: format,
      inputType,
      image_count: imageCount,
      useOwnAPIKey,
      apiKey: verifiedAPIKey,
      formatting: collectFormatting(),
      template_class: window.selectedTemplateClass || "",
      audience: document.getElementById("audience").value,
      tone: document.getElementById("tone").value,
      purpose: document.getElementById("purpose").value,
      language: document.getElementById("language").value || "English",
    };

    if (document.getElementById("include_affiliate_links")?.checked) {
      const link = document.getElementById("affiliate_link_url").value.trim();
      const label = document.getElementById("affiliate_cta_label").value.trim();
      const keywords = document.getElementById("affiliate_keywords").value.trim();

      if (!link.startsWith("http")) return alert("❌ Invalid affiliate link");

      payload.affiliate = {
        enabled: true,
        url: link,
        label: label || "Buy Now",
        keywords: keywords.split(",").map(k => k.trim()).filter(Boolean)
      };
    }

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

      await logUsage(currentUser.id, currentUser.email, url ? "generate_from_url" : (format === "epub" ? "generate_epub" : "generate_pdf"), {
        pages: result.total_pages,
        format,
        with_images: !!imageCount,
        from_url: !!url,
        source_url: url,
        dynamic_cost: dynamicCost,
      });

      document.getElementById("regenerate-pdf")?.classList.remove("hidden");
      if (payload.cover_url) document.getElementById("regenerate-image")?.classList.remove("hidden");

      showToast("✅ eBook Generated Successfully");
      loadUserCredits();
    } catch (err) {
      alert("❌ " + err.message);
    }

    hideSpinner();
  });
}

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

function renderPreview(result) {
  const container = document.getElementById("ebook_preview_area");
  container.innerHTML = "";

  blocks = result.blocks || [];
  blocks.forEach(block => {
    const section = renderSection(block);
    container.appendChild(section);
  });

  document.getElementById("saveBtn")?.classList.remove("hidden");
}

function renderSection(block) {
  const container = document.createElement("div");
  container.className = "block mb-6";

  switch (block.type) {
    case "heading":
      container.innerHTML = `<h2 class="text-2xl font-bold mb-2 editable" contenteditable="true">${block.text}</h2>`;
      break;
    case "subheading":
      container.innerHTML = `<h3 class="text-xl font-semibold mb-2 editable" contenteditable="true">${block.text}</h3>`;
      break;
    case "paragraph":
      container.innerHTML = `<p class="text-base mb-2 editable" contenteditable="true">${block.text}</p>`;
      break;
    case "image":
      container.innerHTML = `<div class="relative group w-full max-w-xl mx-auto">
        <img src="${block.url}" class="w-full h-auto rounded shadow" />
        <button class="regen-img-btn absolute top-2 right-2 hidden group-hover:block text-sm bg-white px-2 py-1 rounded shadow text-blue-600" data-image-id="${block.id}">♻️ Regenerate</button>
      </div>`;
      break;
    case "cta":
      container.innerHTML = `<div class="template-cta text-center my-6 p-4 border rounded bg-blue-50 shadow-sm">
        <label class="block text-sm text-gray-700 mb-1">🔗 CTA Label</label>
        <input class="cta-label-input w-full px-3 py-2 border rounded mb-2 text-center font-semibold text-lg" value="${block.label || "Buy Now"}" />
        <label class="block text-sm text-gray-700 mb-1">🔗 CTA Link</label>
        <input class="cta-url-input w-full px-3 py-2 border rounded text-sm" value="${block.url || "https://"}" />
      </div>`;
      break;
    default:
      container.innerHTML = `<div class="text-gray-500 text-sm">Unknown block type: ${block.type}</div>`;
  }

  return container;
}

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

function showSpinner() {
  document.getElementById("generateBtn").disabled = true;
  document.getElementById("spinner")?.classList.remove("hidden");
}
function hideSpinner() {
  document.getElementById("generateBtn").disabled = false;
  document.getElementById("spinner")?.classList.add("hidden");
}

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow z-50";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function applyAudienceFormatting() {
  const autoApply = document.getElementById("autoFormatByAudience")?.checked;
  const audience = document.getElementById("audience")?.value;

  if (!autoApply || window.selectedTemplateClass) return;

  const fontMap = {
    "Kids":           { font: "Comic Sans",     size: "14pt", spacing: "2",   align: "center" },
    "Teens":          { font: "Inter",          size: "13pt", spacing: "1.8", align: "left" },
    "Students":       { font: "Merriweather",   size: "13pt", spacing: "1.6", align: "justify" },
    "Parents":        { font: "Georgia",        size: "14pt", spacing: "1.6", align: "left" },
    "Teachers":       { font: "Merriweather",   size: "14pt", spacing: "1.5", align: "left" },
    "Professionals":  { font: "Inter",          size: "12pt", spacing: "1.5", align: "justify" },
    "Entrepreneurs":  { font: "Poppins",        size: "13pt", spacing: "1.6", align: "justify" },
    "Freelancers":    { font: "Open Sans",      size: "13pt", spacing: "1.6", align: "justify" },
    "Experts":        { font: "Lora",           size: "13pt", spacing: "1.7", align: "justify" },
    "General Public": { font: "Roboto",         size: "13pt", spacing: "1.5", align: "left" },
    "Hobbyists":      { font: "Quicksand",      size: "14pt", spacing: "1.8", align: "center" },
    "Lifelong Learners": { font: "Merriweather", size: "14pt", spacing: "1.7", align: "justify" },
  };

  const preset = fontMap[audience] || {
    font: "Merriweather",
    size: "12pt",
    spacing: "1.5",
    align: "justify",
  };

  document.getElementById("font_type").value = preset.font;
  document.getElementById("font_size").value = preset.size;
  document.getElementById("line_spacing").value = preset.spacing;
  document.getElementById("text_alignment").value = preset.align;
}
