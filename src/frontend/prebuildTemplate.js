// ✅ Ultra Polished Template Picker with Live Preview – CommonJS-Compatible

// 🎨 Define all templates (just 3 now, but easily extend to 100+ later)
const templates = [
  {
    id: "template-classic-kids-1",
    name: "Classic Kids #1",
    category: "Kids",
    preview: "/templates/classic-kids-1.png",
    cssClass: "template-classic-kids-1",
  },
  {
    id: "template-modern-edu-1",
    name: "Modern Education #1",
    category: "Teachers",
    preview: "/templates/modern-edu-1.png",
    cssClass: "template-modern-edu-1",
  },
  {
    id: "template-elegant-pro-1",
    name: "Elegant Pro #1",
    category: "Professionals",
    preview: "/templates/elegant-pro-1.png",
    cssClass: "template-elegant-pro-1",
  }
  // 🔜 Add more (20–30 per category easily)
];

// 🧱 Inject Modal HTML
function renderTemplateModal() {
  if (document.getElementById("templateModal")) return;

  const modal = document.createElement("div");
  modal.id = "templateModal";
  modal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 hidden";

  modal.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl animate-fade-in">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">🎨 Choose Your Design Template</h2>
        <button onclick="document.getElementById('templateModal').classList.add('hidden')" class="text-gray-500 hover:text-red-600">✖</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        ${templates.map(t => `
          <div class="template-card border rounded-lg overflow-hidden shadow hover:ring-2 hover:ring-blue-500 cursor-pointer transition-transform transform hover:scale-[1.02]" data-template-id="${t.id}">
            <img src="${t.preview}" class="w-full h-48 object-cover">
            <div class="p-3">
              <p class="font-semibold text-center">${t.name}</p>
              <p class="text-xs text-center text-gray-400">🎯 ${t.category}</p>
              <p class="text-sm text-center text-green-600 hidden selected-badge">✅ Selected</p>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button id="applyTemplateBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Apply</button>
        <button onclick="document.getElementById('templateModal').classList.add('hidden')" class="text-gray-600 hover:underline">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// ✅ Setup event handlers for template picker
window.setupTemplatePicker = function () {
  renderTemplateModal();

  let selectedTemplate = null;

  const openBtn = document.getElementById("templateSelectBtn");
  if (!openBtn) return;

  openBtn.addEventListener("click", () => {
    document.getElementById("templateModal").classList.remove("hidden");
  });

  // ✅ Click on any card
  document.querySelectorAll(".template-card").forEach(card => {
    card.addEventListener("click", () => {
      selectedTemplate = card.dataset.templateId;

      document.querySelectorAll(".template-card").forEach(c => {
        c.querySelector(".selected-badge")?.classList.add("hidden");
      });

      card.querySelector(".selected-badge")?.classList.remove("hidden");

      // Live preview
      const preview = document.getElementById("ebook_preview_area");
      preview.classList.remove(...templates.map(t => t.cssClass));
      const match = templates.find(t => t.id === selectedTemplate);
      if (match) preview.classList.add(match.cssClass);
    });
  });

  // ✅ Apply Template
  document.getElementById("applyTemplateBtn").addEventListener("click", () => {
    if (!selectedTemplate) return;
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    // Persist for use in generate.js
    window.selectedTemplateClass = template.cssClass;

    showToast(`✅ ${template.name} template applied!`, "success");
    document.getElementById("templateModal").classList.add("hidden");
  });
};

// ✅ Clean fallback toast
function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast-item fixed right-5 z-50 px-4 py-2 mt-2 rounded shadow text-white ${type === "success" ? "bg-green-600" : "bg-red-600"}`;
  toast.style.top = `${document.querySelectorAll('.toast-item').length * 60 + 20}px`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
