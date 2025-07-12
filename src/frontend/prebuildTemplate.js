// ✅ Prebuilt Template Picker – CommonJS-Compatible

const templates = [
  {
    id: "template-classic",
    name: "Classic",
    preview: "/templates/classic-preview.png",
    cssClass: "template-classic",
  },
  {
    id: "template-modern",
    name: "Modern",
    preview: "/templates/modern-preview.png",
    cssClass: "template-modern",
  },
  {
    id: "template-elegant",
    name: "Elegant",
    preview: "/templates/elegant-preview.png",
    cssClass: "template-elegant",
  }
];

// 🧱 Inject the Modal HTML only once
function renderTemplateModal() {
  if (document.getElementById("templateModal")) return;

  const modal = document.createElement("div");
  modal.id = "templateModal";
  modal.className = "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 hidden";

  modal.innerHTML = `
    <div class="bg-white p-6 rounded-lg w-full max-w-4xl relative">
      <h2 class="text-xl font-bold mb-4">Choose Design Template</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        ${templates.map(t => `
          <div class="border rounded-lg p-2 group cursor-pointer hover:ring-2" data-template-id="${t.id}">
            <img src="${t.preview}" class="w-full h-40 object-cover rounded mb-2">
            <div class="text-center font-semibold">${t.name}</div>
            <div class="text-green-500 text-sm text-center hidden group-[data-selected='true']:block">✅ Selected</div>
          </div>
        `).join("")}
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button id="applyTemplateBtn" class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">Apply</button>
        <button onclick="document.getElementById('templateModal').classList.add('hidden')" class="text-gray-600">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ✅ Publicly exposed function (use in <script> HTML directly)
window.setupTemplatePicker = function () {
  renderTemplateModal();

  let selectedTemplate = null;

  const openBtn = document.getElementById("templateSelectBtn");
  if (!openBtn) return;

  openBtn.addEventListener("click", () => {
    document.getElementById("templateModal").classList.remove("hidden");
  });

  document.querySelectorAll("[data-template-id]").forEach(card => {
    card.addEventListener("click", () => {
      selectedTemplate = card.dataset.templateId;
      document.querySelectorAll("[data-template-id]").forEach(c => {
        c.setAttribute("data-selected", c.dataset.templateId === selectedTemplate);
      });
    });
  });

  document.getElementById("applyTemplateBtn").addEventListener("click", () => {
    if (!selectedTemplate) return;
    applyTemplate(selectedTemplate);
    document.getElementById("templateModal").classList.add("hidden");
  });
};

// ✅ Applies selected template CSS to preview container
function applyTemplate(templateId) {
  const container = document.getElementById("ebook_preview_area");
  if (!container) return;

  container.classList.remove(...templates.map(t => t.cssClass));

  const selected = templates.find(t => t.id === templateId);
  if (selected) {
    container.classList.add(selected.cssClass);
    showToast(`✅ ${selected.name} template applied`);
  }
}

// 🔔 Fallback toast if not globally defined
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow z-50";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
