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

// Notifications tab logic
window.AdminModules["notifications"] = {
  init: async function (container) {
    const supabase = window.supabase;
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading notifications...</p>`;

    const { data: logs, error } = await supabase
      .from("notifications")
      .select("*, user:users(email)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      container.innerHTML = `<p class="text-red-600">❌ Failed to load notifications: ${error.message}</p>`;
      return;
    }

    if (!logs.length) {
      container.innerHTML = `<p class="text-gray-500 italic">No notifications yet.</p>`;
      return;
    }

    container.innerHTML = `
      <h2 class="text-lg font-semibold mb-4">🔔 Notifications</h2>
      <ul class="space-y-2 text-sm">
        ${logs.map(log => `
          <li class="border-b pb-2">
            <p><strong>${new Date(log.created_at).toLocaleString()}</strong></p>
            <p>${log.message}</p>
            <p class="text-gray-500">User: ${log.user?.email || log.user_id}</p>
          </li>
        `).join("")}
      </ul>
    `;
  }
};

// Bind all buttons
// ✅ Enhanced to dynamically include tabs like "email_logs" or "notifications" without modifying JS again
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // 🟢 Default load (safe fallback)
  switchTab("users");

  // ✅ Auto-load tabs defined in DOM but not explicitly initialized
  tabContents.forEach(content => {
    const tabName = content.id.replace("tab-", "");
    if (!loadedTabs.has(tabName) && AdminModules[tabName]?.init) {
      AdminModules[tabName].init(content);
      loadedTabs.add(tabName);
    }
  });
});
