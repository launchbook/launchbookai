// src/admin/email_logs.js

window.AdminModules = window.AdminModules || {};
window.AdminModules["email_logs"] = {
  init: async function (container) {
    const supabase = window.supabase;

    const renderLogs = async (filters = {}) => {
      container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading email logs...</p>`;

      let query = supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(200);

      // Apply filters
      if (filters.user_id) query = query.eq("user_id", filters.user_id);
      if (filters.email) query = query.ilike("to", `%${filters.email}%`);
      if (filters.type) query = query.eq("type", filters.type);
      if (filters.subject) query = query.ilike("subject", `%${filters.subject}%`);

      const { data: logs, error } = await query;

      if (error) {
        container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading email logs: ${error.message}</p>`;
        return;
      }

      if (!logs.length) {
        container.innerHTML = `<p class="text-gray-500 italic">No email logs found for this filter.</p>`;
        return;
      }

      const tableRows = logs.map(log => `
        <tr class="border-b dark:border-gray-700">
          <td class="p-2">${log.to}</td>
          <td class="p-2">${log.subject || "—"}</td>
          <td class="p-2">${log.user_id || "—"}</td>
          <td class="p-2">${log.type || "—"}</td>
          <td class="p-2">${log.status || "sent"}</td>
          <td class="p-2">${new Date(log.created_at).toLocaleString()}</td>
          <td class="p-2">
            ${log.status === "failed" ? `<button class="resend-btn text-blue-600 underline text-sm" data-id="${log.id}">Resend</button>` : "—"}
          </td>
        </tr>
      `).join("");

      container.innerHTML = `
        <div class="mb-4 space-y-2">
          <div class="flex flex-wrap gap-2 items-center text-sm">
            <input id="filter-email" placeholder="📧 Email" class="border p-1 rounded w-36" />
            <input id="filter-user" placeholder="👤 User ID" class="border p-1 rounded w-32" />
            <input id="filter-subject" placeholder="📝 Subject" class="border p-1 rounded w-40" />
            <input id="filter-type" placeholder="📦 Type" class="border p-1 rounded w-32" />
            <button id="apply-email-filters" class="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
            <button id="reset-email-filters" class="text-sm text-gray-600 underline">Reset</button>
            <button id="download-email-csv" class="bg-green-600 text-white px-3 py-1 rounded">⬇️ CSV</button>
          </div>
        </div>

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
                <th class="text-left p-2">🔁</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      `;

      // 🔁 Bind resend buttons
      container.querySelectorAll(".resend-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          btn.innerText = "Resending...";
          const { error } = await supabase.functions.invoke("resend_email", { body: { id } });
          btn.innerText = error ? "❌ Failed" : "✅ Sent";
        });
      });
    };

    // 🔃 First load
    renderLogs();

    // 🔍 Filters
    container.addEventListener("click", (e) => {
      if (e.target.id === "apply-email-filters") {
        const filters = {
          email: container.querySelector("#filter-email").value,
          user_id: container.querySelector("#filter-user").value,
          subject: container.querySelector("#filter-subject").value,
          type: container.querySelector("#filter-type").value,
        };
        renderLogs(filters);
      }

      if (e.target.id === "reset-email-filters") {
        container.querySelectorAll("input").forEach(input => input.value = "");
        renderLogs();
      }

      if (e.target.id === "download-email-csv") {
        const rows = Array.from(container.querySelectorAll("table tbody tr")).map(tr =>
          Array.from(tr.children).slice(0, 6).map(td => td.textContent.trim())
        );
        const csv = ["To,Subject,User ID,Type,Status,Sent At", ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "email_logs.csv";
        a.click();
      }
    });
  }
};
