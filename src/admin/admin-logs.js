// src/admin/admin-logs.js

window.AdminModules = window.AdminModules || {};
window.AdminModules["logs"] = {
  init: async function (container) {
    const supabase = window.supabase;
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading logs...</p>`;

    try {
      const { data: logs, error } = await supabase
        .from("generation_logs")
        .select("id, user_id, type, credits_used, created_at, metadata, users(email)")
        .order("created_at", { ascending: false })
        .limit(500); // You can increase this limit if needed

      if (error) throw error;

      if (!logs.length) {
        container.innerHTML = `<p class="text-gray-500 italic">No logs found.</p>`;
        return;
      }

      // ✅ Render table + controls
      container.innerHTML = `
        <div class="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <input id="logSearchInput" type="text" placeholder="🔍 Search logs (user, type, metadata...)" class="w-full md:w-96 px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
          <button id="exportLogsCSV" class="bg-blue-600 text-white px-4 py-2 rounded text-sm">📁 Export CSV</button>
        </div>

        <div class="overflow-auto border rounded">
          <table class="min-w-full text-sm table-auto">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-2">📅 Date</th>
                <th class="p-2">👤 User</th>
                <th class="p-2">⚙️ Type</th>
                <th class="p-2">💳 Credits</th>
                <th class="p-2">🧠 Metadata</th>
              </tr>
            </thead>
            <tbody id="logTableBody" class="divide-y dark:divide-gray-700">
              ${logs.map(log => `
                <tr>
                  <td class="p-2 text-xs">${new Date(log.created_at).toLocaleString()}</td>
                  <td class="p-2 text-xs">${log.users?.email || log.user_id || "—"}</td>
                  <td class="p-2 text-xs font-mono">${log.type}</td>
                  <td class="p-2 text-center">${log.credits_used ?? "—"}</td>
                  <td class="p-2 text-xs text-gray-500">${log.metadata || "—"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <p class="text-xs text-gray-400 mt-2">Showing latest ${logs.length} logs only.</p>
      `;

      // 🔍 Search filter
      document.getElementById("logSearchInput").addEventListener("input", e => {
        const val = e.target.value.toLowerCase();
        container.querySelectorAll("#logTableBody tr").forEach(row => {
          row.style.display = row.innerText.toLowerCase().includes(val) ? "" : "none";
        });
      });

      // 📁 CSV Export
      document.getElementById("exportLogsCSV").addEventListener("click", () => {
        const csv = [
          ["Date", "User", "Type", "Credits", "Metadata"],
          ...logs.map(log => [
            new Date(log.created_at).toLocaleString(),
            `"${log.users?.email || log.user_id || ""}"`,
            `"${log.type}"`,
            log.credits_used ?? "",
            `"${(log.metadata || "").replace(/"/g, '""')}"`
          ])
        ].map(row => row.join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `launchbook_logs_export.csv`;
        link.click();
      });

    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading logs: ${err.message}</p>`;
    }
  }
};
