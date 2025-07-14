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
          <div class="flex flex-wrap gap-2">
  <input type="date" id="userStartDate" class="px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-600" />
  <input type="date" id="userEndDate" class="px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-600" />
  <td class="p-2 text-center">
  <select data-plan="${user.plan || ''}" data-user-id="${user.id}" class="plan-select text-xs px-2 py-1 rounded capitalize dark:bg-gray-800 dark:border-gray-600 border">
    <option value="">Select Plan</option>
    <option value="starter" ${user.plan === "starter" ? "selected" : ""}>Starter</option>
    <option value="growth" ${user.plan === "growth" ? "selected" : ""}>Growth</option>
    <option value="pro" ${user.plan === "pro" ? "selected" : ""}>Pro</option>
    <option value="agency" ${user.plan === "agency" ? "selected" : ""}>Agency</option>
  </select>
</td>

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
                <th class="p-2 text-center">Plan</th>
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
// 📌 Plan Filter
document.getElementById("planFilter").addEventListener("change", () => {
  const selected = document.getElementById("planFilter").value;
  container.querySelectorAll("tbody tr").forEach(row => {
    const plan = (row.querySelector("[data-plan]")?.dataset.plan || "").toLowerCase();
    const match = selected === "all" || plan === selected;
    row.style.display = match ? "" : "none";
  });
});

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
      // 📝 Plan Change Handler
container.querySelectorAll(".plan-select").forEach(select => {
  select.addEventListener("change", async () => {
    const userId = select.dataset.userId;
    const newPlan = select.value;

    const { error } = await supabase
      .from("users")
      .update({ plan: newPlan })
      .eq("id", userId);

    if (error) {
      alert("❌ Failed to update plan.");
      return;
    }

    select.dataset.plan = newPlan;
    alert(`✅ Plan updated to ${newPlan}`);
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
        <td class="p-2 text-center">
  <span class="text-xs font-semibold px-2 py-1 rounded-full capitalize
    ${user.plan === 'starter' ? 'bg-blue-100 text-blue-700' :
      user.plan === 'growth' ? 'bg-green-100 text-green-700' :
      user.plan === 'pro' ? 'bg-orange-100 text-orange-700' :
      user.plan === 'agency' ? 'bg-purple-100 text-purple-700' :
      'bg-gray-100 text-gray-700'}">
    ${user.plan || 'N/A'}
  </span>
</td>

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

      const supabase = window.supabase;

document.querySelectorAll(".view-credits-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const userId = btn.closest("tr").dataset.userId;
    window.AdminModules["users"].openCreditHistory(userId);

    // Show modal early with loading state
    const modal = document.getElementById("creditHistoryModal");
    const content = document.getElementById("creditHistoryContent");
    content.innerHTML = `<p class="text-sm text-gray-500 italic">Loading...</p>`;
    modal.classList.remove("hidden");

    const { data: logs, error } = await supabase
      .from("credits_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      content.innerHTML = `<p class="text-red-600">❌ Failed to fetch credit history.</p>`;
      return;
    }

    const added = logs.filter(l => l.amount > 0).reduce((sum, l) => sum + l.amount, 0);
    const used = logs.filter(l => l.amount < 0).reduce((sum, l) => sum + l.amount, 0);
    const remaining = added + used;

    const summary = `
      <div class="mb-2 text-sm text-gray-700 dark:text-gray-300">
        Total Added: <strong class="text-green-600">${added}</strong><br>
        Total Used: <strong class="text-red-600">${used}</strong><br>
        Total Remaining: <strong class="text-blue-600">${remaining}</strong>
      </div>
    `;

    const logContent = logs.map(log => `
      <div class="py-1 border-b dark:border-gray-700">
        [${new Date(log.created_at).toLocaleString()}] 
        ${log.amount > 0 ? '➕' : '➖'} ${log.amount} 
        (${log.reason})
      </div>
    `).join("");

    content.innerHTML = summary + (logs.length ? logContent : `<p class="italic text-gray-500">No credit activity yet.</p>`);
  });
});

document.getElementById("closeCreditHistoryBtn").addEventListener("click", () => {
  document.getElementById("creditHistoryModal").classList.add("hidden");
});
// ✅ Expose modal opener (from other panels like global Credits tab)
window.AdminModules["users"].openCreditHistory = async function (userId) {
  const supabase = window.supabase;
  const modal = document.getElementById("creditHistoryModal");
  const content = document.getElementById("creditHistoryContent");

  content.innerHTML = `<p class="text-sm text-gray-500 italic">Loading...</p>`;
  modal.classList.remove("hidden");

  const { data: logs, error } = await supabase
    .from("credits_log")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    content.innerHTML = `<p class="text-red-600">❌ Failed to fetch credit history.</p>`;
    return;
  }

  const added = logs.filter(l => l.amount > 0).reduce((sum, l) => sum + l.amount, 0);
  const used = logs.filter(l => l.amount < 0).reduce((sum, l) => sum + l.amount, 0);
  const remaining = added + used;

  // 🧠 Store logs in DOM for filtering
  modal.dataset.logs = JSON.stringify(logs);

  const filterUI = `
    <div class="mb-3 flex flex-col md:flex-row md:items-center gap-2 text-sm">
      <input id="creditHistorySearch" type="text" placeholder="🔍 Filter by reason or amount..." class="w-full md:w-80 px-3 py-1 border rounded dark:bg-gray-800 dark:border-gray-600" />
      <select id="creditTypeFilter" class="px-3 py-1 border rounded dark:bg-gray-800 dark:border-gray-600">
        <option value="all">All</option>
        <option value="added">➕ Added Only</option>
        <option value="used">➖ Used Only</option>
      </select>
    </div>
  `;

  const summary = `
    <div class="mb-2 text-sm text-gray-700 dark:text-gray-300">
      Total Added: <strong class="text-green-600">${added}</strong><br>
      Total Used: <strong class="text-red-600">${used}</strong><br>
      Total Remaining: <strong class="text-blue-600">${remaining}</strong>
    </div>
  `;

  const renderLogs = (logsToRender) => {
    return logsToRender.map(log => `
      <div class="py-1 border-b dark:border-gray-700">
        [${new Date(log.created_at).toLocaleString()}] 
        ${log.amount > 0 ? '➕' : '➖'} ${log.amount} 
        (${log.reason})
      </div>
    `).join("") || `<p class="italic text-gray-500">No credit activity yet.</p>`;
  };

  // Initial render
  content.innerHTML = filterUI + summary + `<div id="creditLogFiltered">${renderLogs(logs)}</div>`;

  // ✅ Filters
  const applyFilter = () => {
    const allLogs = JSON.parse(modal.dataset.logs || "[]");
    const keyword = document.getElementById("creditHistorySearch").value.toLowerCase();
    const type = document.getElementById("creditTypeFilter").value;

    const filtered = allLogs.filter(log => {
      const matchKeyword = log.reason?.toLowerCase().includes(keyword) || String(log.amount).includes(keyword);
      const matchType =
        type === "all" ||
        (type === "added" && log.amount > 0) ||
        (type === "used" && log.amount < 0);
      return matchKeyword && matchType;
    });

    document.getElementById("creditLogFiltered").innerHTML = renderLogs(filtered);
  };

  document.getElementById("creditHistorySearch").addEventListener("input", applyFilter);
  document.getElementById("creditTypeFilter").addEventListener("change", applyFilter);
};

// Close Modal
document.getElementById("closeCreditHistoryBtn").addEventListener("click", () => {
  document.getElementById("creditHistoryModal").classList.add("hidden");
});
window.AdminModules = window.AdminModules || {};
window.AdminModules["users"] = {
  init: async function (container) {
    const supabase = window.supabase;
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading users...</p>`;

    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, created_at, blocked")
      .order("created_at", { ascending: false });

    if (error) {
      container.innerHTML = `<p class="text-red-600">❌ Failed to load users: ${error.message}</p>`;
      return;
    }

    container.innerHTML = `
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b">
            <th class="text-left py-2">Email</th>
            <th class="text-left py-2">Joined</th>
            <th class="text-left py-2">Blocked?</th>
            <th class="text-left py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr class="border-b">
              <td class="py-2">${user.email}</td>
              <td class="py-2">${new Date(user.created_at).toLocaleDateString()}</td>
              <td class="py-2">${user.blocked ? '🚫 Yes' : '✅ No'}</td>
              <td class="py-2 space-x-2">
                <button class="text-blue-600 text-xs" data-view-credits="${user.id}">📊 Credit History</button>
                <button class="text-red-600 text-xs" data-block="${user.id}">🚫 Block</button>
                <button class="text-green-600 text-xs" data-unblock="${user.id}">✅ Unblock</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div id="creditModal" class="fixed inset-0 hidden items-center justify-center bg-black bg-opacity-50 z-50">
        <div class="bg-white dark:bg-gray-900 p-6 rounded shadow-lg max-w-lg w-full">
          <h3 class="text-lg font-semibold mb-4">📊 Credit History</h3>
          <div id="creditLogsContent" class="text-sm max-h-[400px] overflow-y-auto"></div>
          <button id="closeCreditModal" class="mt-4 px-4 py-2 bg-gray-700 text-white rounded">Close</button>
        </div>
      </div>
    `;

    // Manual block logic
    container.querySelectorAll("[data-block]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.block;
        await supabase.from("users").update({ blocked: true }).eq("id", id);
        await supabase.from("blocked_logs").insert({
          user_id: id,
          reason: "Manual block from admin panel",
          triggered_by: "manual"
        });
        alert("🚫 User blocked");
        location.reload();
      });
    });

    container.querySelectorAll("[data-unblock]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.unblock;
        await supabase.from("users").update({ blocked: false }).eq("id", id);
        alert("✅ User unblocked");
        location.reload();
      });
    });

    // Credit history view
    container.querySelectorAll("[data-view-credits]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.viewCredits;
        const modal = document.getElementById("creditModal");
        const content = document.getElementById("creditLogsContent");
        modal.classList.remove("hidden");
        content.innerHTML = "Loading...";

        const { data: logs } = await supabase
          .from("credits_log")
          .select("created_at, credits_used, action")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (logs?.length) {
          content.innerHTML = `
            <ul class="list-disc pl-5 space-y-1">
              ${logs.map(log => `
                <li>
                  ${new Date(log.created_at).toLocaleString()}: <strong>${log.credits_used}</strong> credits used for <code>${log.action}</code>
                </li>
              `).join("")}
            </ul>
          `;
        } else {
          content.textContent = "No logs found.";
        }
      });
    });

    document.getElementById("closeCreditModal").addEventListener("click", () => {
      document.getElementById("creditModal").classList.add("hidden");
    });
  }
};

