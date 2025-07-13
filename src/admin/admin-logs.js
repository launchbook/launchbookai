// src/admin/admin-logs.js

window.AdminModules = window.AdminModules || {};
window.AdminModules["logs"] = {
  init: async function (container) {
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading logs...</p>`;
    const supabase = window.supabase;

    try {
      const { data: logs, error } = await supabase
        .from("generation_logs")
        .select("id, user_id, type, credits_used, created_at, metadata, users(email)")
        .order("created_at", { ascending: false })
        .limit(100); // Latest 100 logs

      if (error) throw error;

      if (!logs.length) {
        container.innerHTML = `<p class="text-gray-500 italic">No logs found.</p>`;
        return;
      }

      container.innerHTML = `
        <table class="w-full text-sm border dark:border-gray-700">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="p-2 text-left">📅 Date</th>
              <th class="p-2 text-left">👤 User</th>
              <th class="p-2 text-left">⚙️ Type</th>
              <th class="p-2 text-left">💳 Credits</th>
              <th class="p-2 text-left">🧠 Metadata</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr class="border-t dark:border-gray-700">
                <td class="p-2">${new Date(log.created_at).toLocaleString()}</td>
                <td class="p-2 text-sm">${log.users?.email || log.user_id}</td>
                <td class="p-2 font-mono">${log.type}</td>
                <td class="p-2">${log.credits_used || 0}</td>
                <td class="p-2 text-xs text-gray-500">${log.metadata || "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <p class="text-xs text-gray-400 mt-2">Showing latest 100 logs only.</p>
      `;
    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading logs: ${err.message}</p>`;
    }
  }
};

