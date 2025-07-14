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

// ✅ Notifications tab for admins
window.AdminModules["notifications"] = {
  init: async function (container) {
    const supabase = window.supabase;
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading notifications...</p>`;

    try {
      const { data: logs, error } = await supabase
        .from("notifications")
        .select("*, user:users(email)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!logs.length) {
        container.innerHTML = `<p class="text-gray-500 italic">No notifications yet.</p>`;
        return;
      }

      container.innerHTML = `
        <h2 class="text-lg font-semibold mb-4">🔔 Notifications</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b font-semibold">
                <th class="text-left py-2 px-3">Date</th>
                <th class="text-left py-2 px-3">Type</th>
                <th class="text-left py-2 px-3">Message</th>
                <th class="text-left py-2 px-3">User</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr class="border-b">
                  <td class="py-2 px-3">${new Date(log.created_at).toLocaleString()}</td>
                  <td class="py-2 px-3">${log.type}</td>
                  <td class="py-2 px-3">${log.message}</td>
                  <td class="py-2 px-3 text-gray-500">${log.user?.email || log.user_id}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p class="text-red-600">❌ Failed to load notifications: ${err.message}</p>`;
    }
  }
};

// ✅ Bind tab buttons and auto-load modules
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // 🟢 Default tab
  switchTab("users");

  // 🔄 Auto-load any pre-rendered tabs
  tabContents.forEach(content => {
    const tabName = content.id.replace("tab-", "");
    if (!loadedTabs.has(tabName) && AdminModules[tabName]?.init) {
      AdminModules[tabName].init(content);
      loadedTabs.add(tabName);
    }
  });
});
