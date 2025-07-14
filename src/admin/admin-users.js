// src/admin/admin-users.js

window.AdminModules = window.AdminModules || {};
window.AdminModules["users"] = {
  init: async function (container) {
    const supabase = window.supabase;
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading users...</p>`;

    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("*, ebooks(count), logs(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!users.length) {
        container.innerHTML = `<p class="text-gray-500 italic">No users found.</p>`;
        return;
      }

      // UI Layout
      container.innerHTML = `
        <div class="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <input id="userSearchInput" type="text" placeholder="🔍 Search by name, email or ID..." class="w-full md:w-96 px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
          <div class="flex gap-2">
            <input type="date" id="userStartDate" class="px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-600" />
            <input type="date" id="userEndDate" class="px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-600" />
            <button id="exportCsvBtn" class="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">📤 Export CSV</button>
            <button id="openAddUserModal" class="bg-blue-600 text-white px-4 py-2 rounded text-sm">➕ Add User</button>
          </div>
        </div>

        <div class="overflow-auto border rounded">
          <table class="min-w-full text-sm table-auto">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-2 text-left">Name</th>
                <th class="p-2 text-left">Email</th>
                <th class="p-2 text-left">User ID</th>
                <th class="p-2 text-center">Credits</th>
                <th class="p-2 text-center">eBooks</th>
                <th class="p-2 text-center">Activity</th>
                <th class="p-2 text-center">Joined</th>
                <th class="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="userTableBody" class="divide-y dark:divide-gray-700">
              ${users.map(user => `
                <tr data-user-id="${user.id}" data-joined="${user.created_at}">
                  <td class="p-2">
                    <input type="text" value="${user.full_name || ''}" class="user-name-input w-full px-2 py-1 rounded border dark:bg-gray-800 dark:border-gray-700" />
                  </td>
                  <td class="p-2">${user.email}</td>
                  <td class="p-2 text-xs">${user.id}</td>
                  <td class="p-2 text-center">${user.credits ?? 0}</td>
                  <td class="p-2 text-center">${user.ebooks?.length || 0}</td>
                  <td class="p-2 text-center">${user.logs?.length || 0}</td>
                  <td class="p-2 text-center">${new Date(user.created_at).toLocaleDateString()}</td>
                  <td class="p-2 text-center space-x-2">
                    <button class="save-name-btn text-blue-600 hover:underline text-xs">💾 Save</button>
                    <button class="add-credit-btn text-green-600 hover:underline text-xs">➕ Credits</button>
                    <button class="view-logs-btn text-purple-600 hover:underline text-xs">📜 Logs</button>
                    <button class="delete-user-btn text-red-600 hover:underline text-xs">🗑️ Delete</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- Add User Modal -->
        <div id="addUserModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
          <div class="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-md space-y-4">
            <h2 class="text-lg font-bold mb-2">➕ Add New User</h2>
            <input id="newUserEmail" type="email" placeholder="Email" class="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <input id="newUserName" type="text" placeholder="Full Name" class="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <input id="newUserCredits" type="number" placeholder="Initial Credits (optional)" class="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <div class="flex justify-end space-x-3">
              <button id="cancelAddUserBtn" class="text-gray-600 hover:underline">Cancel</button>
              <button id="submitAddUserBtn" class="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
            </div>
          </div>
        </div>

        <!-- Logs Modal -->
        <div id="userLogsModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
          <div class="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 class="text-lg font-bold mb-4">📜 User Logs</h2>
            <div id="userLogsContent" class="text-sm"></div>
            <div class="text-right mt-4">
              <button id="closeLogsBtn" class="text-gray-600 hover:underline">Close</button>
            </div>
          </div>
        </div>
      `;

      // 🔍 Search
      document.getElementById("userSearchInput").addEventListener("input", e => {
        const val = e.target.value.toLowerCase();
        container.querySelectorAll("tbody tr").forEach(row => {
          row.style.display = row.innerText.toLowerCase().includes(val) ? "" : "none";
        });
      });

      // 📅 Date Filter
      ["userStartDate", "userEndDate"].forEach(id => {
        document.getElementById(id).addEventListener("change", () => {
          const start = new Date(document.getElementById("userStartDate").value);
          const end = new Date(document.getElementById("userEndDate").value);
          container.querySelectorAll("tbody tr").forEach(row => {
            const joined = new Date(row.dataset.joined);
            const visible = (!isNaN(start) ? joined >= start : true) && (!isNaN(end) ? joined <= end : true);
            row.style.display = visible ? "" : "none";
          });
        });
      });

      // 💾 Save Name
      container.querySelectorAll(".save-name-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const row = btn.closest("tr");
          const userId = row.dataset.userId;
          const nameInput = row.querySelector(".user-name-input").value;
          const { error } = await supabase.from("users").update({ full_name: nameInput }).eq("id", userId);
          if (error) return alert("❌ Failed to save name.");
          alert("✅ Name updated.");
        });
      });

      // ➕ Add Credits
      container.querySelectorAll(".add-credit-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const userId = btn.closest("tr").dataset.userId;
          const amount = prompt("Enter credits to add:");
          const parsed = parseInt(amount);
          if (!parsed || parsed <= 0) return alert("Invalid amount.");

          const { error } = await supabase.rpc("add_user_credits", { user_id_input: userId, amount_input: parsed });
          if (error) return alert("❌ Failed to add credits.");
          alert(`✅ ${parsed} credits added.`);
          this.init(container);
        });
      });

      // 🗑️ Delete User
      container.querySelectorAll(".delete-user-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const userId = btn.closest("tr").dataset.userId;
          if (!confirm("Are you sure you want to permanently delete this user?")) return;
          const { error } = await supabase.from("users").delete().eq("id", userId);
          if (error) return alert("❌ Failed to delete user.");
          alert("✅ User deleted.");
          this.init(container);
        });
      });

      // 📜 View Logs
      container.querySelectorAll(".view-logs-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const userId = btn.closest("tr").dataset.userId;
          const { data: logs, error } = await supabase.from("logs").select("*").eq("user_id", userId).order("created_at", { ascending: false });
          if (error) return alert("❌ Failed to fetch logs.");

          const logContent = logs.map(log => `<div class="py-1 border-b dark:border-gray-700">[${new Date(log.created_at).toLocaleString()}] ${log.type}</div>`).join("");
          document.getElementById("userLogsContent").innerHTML = logContent || `<p class="text-sm italic text-gray-500">No logs found.</p>`;
          document.getElementById("userLogsModal").classList.remove("hidden");
        });
      });

      document.getElementById("closeLogsBtn").addEventListener("click", () => {
        document.getElementById("userLogsModal").classList.add("hidden");
      });

      // 📤 Export CSV
      document.getElementById("exportCsvBtn").addEventListener("click", () => {
        const rows = [["Name", "Email", "User ID", "Credits", "eBooks", "Activity", "Joined"]];
        container.querySelectorAll("tbody tr").forEach(row => {
          const cells = row.querySelectorAll("td");
          rows.push(Array.from(cells).slice(0, 7).map(td => td.innerText));
        });
        const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "launchbook_users.csv";
        link.click();
      });

      // ➕ Add User Modal Handlers
      document.getElementById("openAddUserModal").addEventListener("click", () => {
        document.getElementById("addUserModal").classList.remove("hidden");
      });

      document.getElementById("cancelAddUserBtn").addEventListener("click", () => {
        document.getElementById("addUserModal").classList.add("hidden");
      });

      document.getElementById("submitAddUserBtn").addEventListener("click", async () => {
        const email = document.getElementById("newUserEmail").value.trim();
        const full_name = document.getElementById("newUserName").value.trim();
        const credits = parseInt(document.getElementById("newUserCredits").value) || 0;

        if (!email) return alert("Email required.");
        const { error } = await supabase.from("users").insert([{ email, full_name, credits }]);
        if (error) return alert("❌ Failed to add user.");
        alert("✅ User added.");
        document.getElementById("addUserModal").classList.add("hidden");
        this.init(container);
      });

    } catch (err) {
      container.innerHTML = `<p class="text-red-600">❌ Error loading users: ${err.message}</p>`;
    }
  }
};
// src/admin/admin-credits.js

window.AdminModules = window.AdminModules || {};
window.AdminModules["credits"] = {
  init: async function (container) {
    const supabase = window.supabase;
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading credit logs...</p>`;

    try {
      const { data: logs, error } = await supabase
        .from("credits_log")
        .select("*, users(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filters
      container.innerHTML = `
        <div class="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <input id="creditSearchInput" type="text" placeholder="🔍 Search by email, name or reason..." class="w-full md:w-96 px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
          <div class="flex gap-2">
            <button id="exportCreditCsvBtn" class="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">📤 Export CSV</button>
          </div>
        </div>

        <div class="overflow-auto border rounded">
          <table class="min-w-full text-sm table-auto">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-2 text-left">User</th>
                <th class="p-2 text-left">Email</th>
                <th class="p-2 text-left">Reason</th>
                <th class="p-2 text-center">Amount</th>
                <th class="p-2 text-center">Date</th>
              </tr>
            </thead>
            <tbody id="creditLogTableBody" class="divide-y dark:divide-gray-700">
              ${logs.map(log => `
                <tr>
                  <td class="p-2">${log.users?.full_name || "-"}</td>
                  <td class="p-2 text-xs">${log.users?.email || "-"}</td>
                  <td class="p-2">${log.reason}</td>
                  <td class="p-2 text-center ${log.amount > 0 ? 'text-green-600' : 'text-red-600'}">${log.amount}</td>
                  <td class="p-2 text-center">${new Date(log.created_at).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      // 🔍 Search
      document.getElementById("creditSearchInput").addEventListener("input", e => {
        const val = e.target.value.toLowerCase();
        container.querySelectorAll("tbody tr").forEach(row => {
          row.style.display = row.innerText.toLowerCase().includes(val) ? "" : "none";
        });
      });

      // 📤 CSV Export
      document.getElementById("exportCreditCsvBtn").addEventListener("click", () => {
        const rows = [["User", "Email", "Reason", "Amount", "Date"]];
        container.querySelectorAll("tbody tr").forEach(row => {
          const cells = row.querySelectorAll("td");
          rows.push(Array.from(cells).map(td => td.innerText));
        });
        const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "launchbook_credits_log.csv";
        link.click();
      });

    } catch (err) {
      container.innerHTML = `<p class="text-red-600">❌ Error loading credit logs: ${err.message}</p>`;
    }
  }
};
window.AdminModules = window.AdminModules || {};
window.AdminModules["users"] = {
  init: async function (container) {
    const supabase = window.supabase;
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading users...</p>`;

    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("*, ebooks(count), logs(count), credits_log(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!users.length) {
        container.innerHTML = `<p class="text-gray-500 italic">No users found.</p>`;
        return;
      }

      // UI Layout
      container.innerHTML = 
        <div class="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <input id="userSearchInput" type="text" placeholder="🔍 Search by name, email or ID..." class="w-full md:w-96 px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
          <div class="flex gap-2">
            <input type="date" id="userStartDate" class="px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-600" />
            <input type="date" id="userEndDate" class="px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-600" />
            <button id="exportCsvBtn" class="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">📤 Export CSV</button>
            <button id="openAddUserModal" class="bg-blue-600 text-white px-4 py-2 rounded text-sm">➕ Add User</button>
          </div>
        </div>

        <div class="overflow-auto border rounded">
          <table class="min-w-full text-sm table-auto">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-2 text-left">Name</th>
                <th class="p-2 text-left">Email</th>
                <th class="p-2 text-left">User ID</th>
                <th class="p-2 text-center">Credits</th>
                <th class="p-2 text-center">eBooks</th>
                <th class="p-2 text-center">Activity</th>
                <th class="p-2 text-center">Joined</th>
                <th class="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="userTableBody" class="divide-y dark:divide-gray-700">
              ${users.map(user => 
                <tr data-user-id="${user.id}" data-joined="${user.created_at}">
                  <td class="p-2">
                    <input type="text" value="${user.full_name || ''}" class="user-name-input w-full px-2 py-1 rounded border dark:bg-gray-800 dark:border-gray-700" />
                  </td>
                  <td class="p-2">${user.email}</td>
                  <td class="p-2 text-xs">${user.id}</td>
                  <td class="p-2 text-center">${user.credits ?? 0}</td>
                  <td class="p-2 text-center">${user.ebooks?.length || 0}</td>
                  <td class="p-2 text-center">${user.logs?.length || 0}</td>
                  <td class="p-2 text-center">${new Date(user.created_at).toLocaleDateString()}</td>
                  <td class="p-2 text-center space-x-2">
                    <button class="save-name-btn text-blue-600 hover:underline text-xs">💾 Save</button>
                    <button class="add-credit-btn text-green-600 hover:underline text-xs">➕ Credits</button>
                    <button class="view-logs-btn text-purple-600 hover:underline text-xs">📜 Logs</button>
                    <button class="view-credits-btn text-yellow-600 hover:underline text-xs">📊 Credit History</button>
                    <button class="delete-user-btn text-red-600 hover:underline text-xs">🗑️ Delete</button>
                  </td>
                </tr>
              ).join("")}
            </tbody>
          </table>
        </div>

        <!-- Add User Modal -->
        <div id="addUserModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
          <div class="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-md space-y-4">
            <h2 class="text-lg font-bold mb-2">➕ Add New User</h2>
            <input id="newUserEmail" type="email" placeholder="Email" class="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <input id="newUserName" type="text" placeholder="Full Name" class="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <input id="newUserCredits" type="number" placeholder="Initial Credits (optional)" class="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <div class="flex justify-end space-x-3">
              <button id="cancelAddUserBtn" class="text-gray-600 hover:underline">Cancel</button>
              <button id="submitAddUserBtn" class="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
            </div>
          </div>
        </div>

        <!-- Logs Modal -->
        <div id="userLogsModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
          <div class="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 class="text-lg font-bold mb-4">📜 User Logs</h2>
            <div id="userLogsContent" class="text-sm"></div>
            <div class="text-right mt-4">
              <button id="closeLogsBtn" class="text-gray-600 hover:underline">Close</button>
            </div>
          </div>
        </div>

        <!-- Credit History Modal -->
        <div id="creditHistoryModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
          <div class="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 class="text-lg font-bold mb-4">📊 Credit History</h2>
            <div id="creditHistoryContent" class="text-sm"></div>
            <div class="text-right mt-4">
              <button id="closeCreditHistoryBtn" class="text-gray-600 hover:underline">Close</button>
            </div>
          </div>
        </div>
      ;

      document.querySelectorAll(".view-credits-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const userId = btn.closest("tr").dataset.userId;
          const { data: logs, error } = await supabase
            .from("credits_log")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (error) return alert("❌ Failed to fetch credit history.");

          const added = logs.filter(l => l.amount > 0).reduce((sum, l) => sum + l.amount, 0);
          const used = logs.filter(l => l.amount < 0).reduce((sum, l) => sum + l.amount, 0);

          const summary = <div class="mb-2 text-sm text-gray-700 dark:text-gray-300">
            Total Added: <strong class="text-green-600">${added}</strong><br>
            Total Used: <strong class="text-red-600">${used}</strong>
          </div>;

          const logContent = logs.map(log => <div class="py-1 border-b dark:border-gray-700">[${new Date(log.created_at).toLocaleString()}] ${log.amount > 0 ? '➕' : '➖'} ${log.amount} (${log.reason})</div>).join("");

          document.getElementById("creditHistoryContent").innerHTML = summary + (logContent || <p class="text-sm italic text-gray-500">No credit history found.</p>);
          document.getElementById("creditHistoryModal").classList.remove("hidden");
        });
      });

      document.getElementById("closeCreditHistoryBtn").addEventListener("click", () => {
        document.getElementById("creditHistoryModal").classList.add("hidden");
      });

    } catch (err) {
      container.innerHTML = `<p class="text-red-600">❌ Error loading users: ${err.message}</p>`;
    }
  }
}; 
