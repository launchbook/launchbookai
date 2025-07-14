// src/admin/email_logs.js

window.AdminModules = window.AdminModules || {};
window.AdminModules["email_logs"] = {
  init: async function (container) {
    const supabase = window.supabase;
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading email logs...</p>`;

    try {
      const { data: logs, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!logs || logs.length === 0) {
        container.innerHTML = `<p class="text-gray-500 italic">No email logs found.</p>`;
        return;
      }

      container.innerHTML = `
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm table-auto border-collapse">
            <thead>
              <tr class="border-b bg-gray-100 dark:bg-gray-800">
                <th class="text-left p-2">📧 To</th>
                <th class="text-left p-2">Subject</th>
                <th class="text-left p-2">User ID</th>
                <th class="text-left p-2">Type</th>
                <th class="text-left p-2">Status</th>
                <th class="text-left p-2">Sent At</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr class="border-b dark:border-gray-700">
                  <td class="p-2">${log.to}</td>
                  <td class="p-2">${log.subject || "—"}</td>
                  <td class="p-2">${log.user_id || "—"}</td>
                  <td class="p-2">${log.type || "—"}</td>
                  <td class="p-2">${log.status || "sent"}</td>
                  <td class="p-2">${new Date(log.created_at).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading email logs: ${err.message}</p>`;
    }
  }
};

