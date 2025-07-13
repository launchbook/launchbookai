// ✅ Advanced Template Picker with Animation, Toggle Preview, Supabase-Ready

let templates = [];
let selectedTemplate = null;
let livePreviewEnabled = true;

// ✅ Supabase fallback templates
const fallbackTemplates = [
  {
    id: "template-classic-kids-1",
    name: "Classic Kids #1",
    category: "Kids",
    preview: "/templates/template-classic-kids-1.png",
    cssClass: "template-classic-kids-1",
  },
  {
    id: "template-modern-edu-1",
    name: "Modern Education #1",
    category: "Teachers",
    preview: "/templates/template-modern-edu-1.png",
    cssClass: "template-modern-edu-1",
  },
  {
    id: "template-elegant-pro-1",
    name: "Elegant Pro #1",
    category: "Professionals",
    preview: "/templates/template-elegant-pro-1.png",
    cssClass: "template-elegant-pro-1",
  },
];

// ✅ Setup Template Picker
window.setupTemplatePicker = async function () {
  await loadTemplatesFromSupabase();
  renderTemplateModal();
  renderTemplateGrid("All");

  const openBtn = document.getElementById("templateSelectBtn");
  openBtn?.addEventListener("click", () => {
    document.getElementById("templateModal").classList.remove("hidden");
    renderTemplateGrid("All");
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "templateCategoryFilter") {
      renderTemplateGrid(e.target.value);
    }
    if (e.target.id === "livePreviewToggle") {
      livePreviewEnabled = e.target.checked;
    }
  });

  document.getElementById("applyTemplateBtn").addEventListener("click", () => {
    if (!selectedTemplate) return;
    const match = templates.find(t => t.id === selectedTemplate);
    if (!match) return;

    window.selectedTemplateClass = match.cssClass;

    const preview = document.getElementById("ebook_preview_area");
    if (preview) {
      preview.classList.remove(...templates.map(t => t.cssClass));
      preview.classList.add(match.cssClass);
    }

    showToast(`✅ ${match.name} applied`);
    document.getElementById("templateModal").classList.add("hidden");
  });
};

// ✅ Load Templates (from Supabase or fallback)
async function loadTemplatesFromSupabase() {
  try {
    const { data, error } = await supabase.from("template_presets").select("*");
    templates = Array.isArray(data) && data.length ? data : fallbackTemplates;
  } catch (err) {
    console.warn("⚠️ Supabase load failed. Using fallback templates.");
    templates = fallbackTemplates;
  }
}

// ✅ Inject Modal HTML
function renderTemplateModal() {
  if (document.getElementById("templateModal")) return;

  const modal = document.createElement("div");
  modal.id = "templateModal";
  modal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 hidden";

  modal.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-fade-in">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">🎨 Choose Your Design Template</h2>
        <button onclick="document.getElementById('templateModal').classList.add('hidden')" class="text-gray-500 hover:text-red-600">✖</button>
      </div>

      <div class="flex flex-wrap gap-4 items-center mb-4">
        <label class="font-semibold">Filter by Audience:</label>
        <select id="templateCategoryFilter" class="border rounded px-2 py-1 text-sm">
          <option value="All">All</option>
          ${[...new Set(templates.map(t => t.category))].map(cat => `<option value="${cat}">${cat}</option>`).join("")}
        </select>

        <label class="flex items-center text-sm gap-2">
          <input type="checkbox" id="livePreviewToggle" checked>
          Live Preview in eBook
        </label>
      </div>

      <div id="templateGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"></div>

      <div class="mt-6 flex justify-end gap-3">
        <button id="applyTemplateBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50">Apply</button>
        <button onclick="document.getElementById('templateModal').classList.add('hidden')" class="text-gray-600 hover:underline">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ✅ Render Cards by Filter
function renderTemplateGrid(filter = "All") {
  const grid = document.getElementById("templateGrid");
  if (!grid) return;

  const visible = templates.filter(t => filter === "All" || t.category === filter);

  grid.innerHTML = visible.map(t => `
    <div class="template-card border rounded-lg overflow-hidden shadow hover:ring-2 hover:ring-blue-500 cursor-pointer transition-transform transform hover:scale-[1.02]" data-template-id="${t.id}">
      <img src="${t.preview}" alt="${t.name}" class="w-full h-48 object-cover">
      <div class="p-3 text-center">
        <p class="font-semibold">${t.name}</p>
        <p class="text-xs text-gray-400 mb-1">🎯 ${t.category}</p>
        <p class="text-sm text-green-600 hidden selected-badge animate-bounce">✅ Selected</p>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".template-card").forEach(card => {
    card.addEventListener("click", () => {
      selectedTemplate = card.dataset.templateId;

      document.querySelectorAll(".template-card").forEach(c => {
        c.querySelector(".selected-badge")?.classList.add("hidden");
      });

      card.querySelector(".selected-badge")?.classList.remove("hidden");

      if (livePreviewEnabled) {
        const preview = document.getElementById("ebook_preview_area");
        if (preview) {
          preview.classList.remove(...templates.map(t => t.cssClass));
          const selected = templates.find(t => t.id === selectedTemplate);
          if (selected) preview.classList.add(selected.cssClass);
        }
      }
    });
  });
}

// ✅ Toast
function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast-item fixed right-5 z-50 px-4 py-2 mt-2 rounded shadow text-white ${type === "success" ? "bg-green-600" : "bg-red-600"}`;
  t.style.top = `${document.querySelectorAll('.toast-item').length * 60 + 20}px`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

document.getElementById("applyTemplateBtn").addEventListener("click", async () => {
  const selected = document.querySelector(".template-card[data-selected='true']");
  if (!selected) return alert("❌ Please select a template");

  const templateClass = selected.dataset.templateId;
  window.selectedTemplateClass = templateClass;

  // ✅ Load template from Supabase
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("template_class", templateClass)
    .single();

  if (error) {
    console.warn("❌ Failed to fetch template:", error.message);
  } else if (data) {
    // Optional: apply default font
    if (!document.getElementById("font_type").value)
      document.getElementById("font_type").value = data.default_font;

    // Optional: load CSS
    if (data.default_css) {
      const styleTag = document.getElementById("template-css") || document.createElement("style");
      styleTag.id = "template-css";
      styleTag.innerHTML = data.default_css;
      document.head.appendChild(styleTag);
    }

    // Optional: store structure if needed later
    window.templateStructure = data.html_structure;
  }

  document.getElementById("templateModal").classList.add("hidden");
  showToast("✅ Template applied");
});

