// src/admin/admin-users.js

window.AdminModules = window.AdminModules || {};
window.AdminModules["users"] = {
  init: async function (container) {
    container.innerHTML = `<div class="text-sm text-gray-600 mb-4">Loading users...</div>`;
    const supabase = window.supabase;

    try {
      const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });

      if (error) throw error;

      if (!users.length) {
        container.innerHTML = `<p class="text-gray-500 text-sm italic">No users found.</p>`;
        return;
      }

      container.innerHTML = `
        <div class="mb-4">
          <input id="userSearchInput" type="text" placeholder="🔍 Search by name or email..." class="w-full md:w-96 px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
        </div>
        <div class="overflow-auto">
          <table class="min-w-full text-sm table-auto border border-gray-200 dark:border-gray-700">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-2 text-left">Name</th>
                <th class="p-2 text-left">Email</th>
                <th class="p-2">Credits</th>
                <th class="p-2">Plan</th>
                <th class="p-2">Joined</th>
                <th class="p-2">Actions</th>
              </tr>
            </thead>
            <tbody id="userTableBody" class="divide-y dark:divide-gray-700">
              ${users.map(user => `
                <tr data-user-id="${user.id}" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="p-2">${user.full_name || '—'}</td>
                  <td class="p-2">${user.email}</td>
                  <td class="p-2 text-center">${user.credits ?? 0}</td>
                  <td class="p-2 text-center">${user.plan || 'Free'}</td>
                  <td class="p-2 text-xs">${new Date(user.created_at).toLocaleDateString()}</td>
                  <td class="p-2 text-center space-x-2">
                    <button class="text-blue-600 hover:underline view-user-btn">🔍</button>
                    <button class="text-red-600 hover:underline delete-user-btn">🗑️</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      // 🔍 Search logic
      document.getElementById("userSearchInput").addEventListener("input", e => {
        const val = e.target.value.toLowerCase();
        const rows = container.querySelectorAll("tbody tr");
        rows.forEach(row => {
          const text = row.innerText.toLowerCase();
          row.style.display = text.includes(val) ? "" : "none";
        });
      });

      // 🗑️ Delete logic
      container.querySelectorAll(".delete-user-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const row = btn.closest("tr");
          const userId = row.dataset.userId;
          const confirmed = confirm("⚠️ Are you sure you want to delete this user?");
          if (!confirmed) return;

          const { error } = await supabase.from("users").delete().eq("id", userId);
          if (error) return alert("❌ Failed to delete user.");
          row.remove();
        });
      });

      // 🔍 View logic (can expand later)
      container.querySelectorAll(".view-user-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const row = btn.closest("tr");
          const email = row.children[1].innerText;
          alert(`ℹ️ Detailed view coming soon for: ${email}`);
        });
      });

    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading users: ${err.message}</p>`;
    }
  }
};

