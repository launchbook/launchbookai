// src/admin/admin.js

const tabButtons = document.querySelectorAll(".admin-tab-btn");
const tabContents = document.querySelectorAll(".admin-tab-content");

// 🧠 Global registry: Each admin module must register like AdminModules['users'] = { init: fn }
window.AdminModules = {};
const loadedTabs = new Set();

function switchTab(tabName) {
  // UI update
  tabButtons.forEach(btn => {
    btn.classList.toggle("border-blue-600", btn.dataset.tab === tabName);
    btn.classList.toggle("text-blue-600", btn.dataset.tab === tabName);
  });

  tabContents.forEach(content => {
    content.classList.toggle("hidden", content.id !== `tab-${tabName}`);
  });

  // First-time load
  if (!loadedTabs.has(tabName) && AdminModules[tabName]?.init) {
    const container = document.getElementById(`tab-${tabName}`);
    AdminModules[tabName].init(container);
    loadedTabs.add(tabName);
  }
}

// Bind all buttons
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

// 🟢 Default load
switchTab("users");

