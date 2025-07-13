// src/admin/admin-credits.js

window.AdminModules = window.AdminModules || {};
window.AdminModules["credits"] = {
  init: async function (container) {
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading user credits...</p>`;
    const supabase = window.supabase;

    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, email, name, credits")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!users.length) {
        container.innerHTML = `<p class="text-gray-500 italic">No users found.</p>`;
        return;
      }

      container.innerHTML = `
        <table class="w-full text-sm border dark:border-gray-700">
          <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th class="text-left p-2">👤 User</th>
              <th class="text-left p-2">📧 Email</th>
              <th class="text-left p-2">💳 Credits</th>
              <th class="text-left p-2">⚙️ Action</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr class="border-t dark:border-gray-700" data-user-id="${user.id}">
                <td class="p-2">${user.name || "—"}</td>
                <td class="p-2">${user.email}</td>
                <td class="p-2 font-mono" id="credit-${user.id}">${user.credits}</td>
                <td class="p-2">
                  <button class="adjust-credit-btn text-blue-600 hover:underline" data-user-id="${user.id}">➕ Adjust</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      // 🛠 Credit Adjustment Dialog
      container.querySelectorAll(".adjust-credit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const userId = btn.dataset.userId;
          const amount = prompt("Enter credit adjustment (positive to add, negative to subtract):");
          if (!amount) return;

          const parsed = parseInt(amount, 10);
          if (isNaN(parsed)) return alert("❌ Invalid number.");

          const note = prompt("Optional note for log (e.g. Manual top-up, refund correction, etc):");

          adjustUserCredits(userId, parsed, note);
        });
      });

      async function adjustUserCredits(userId, delta, note = "") {
        const { data: userData, error: fetchErr } = await supabase
          .from("users")
          .select("credits")
          .eq("id", userId)
          .single();

        if (fetchErr) return alert("❌ Failed to fetch user credits.");

        const newCredit = Math.max((userData.credits || 0) + delta, 0);

        const { error: updateErr } = await supabase
          .from("users")
          .update({ credits: newCredit })
          .eq("id", userId);

        if (updateErr) return alert("❌ Failed to update credits.");

        // Log the adjustment
        await supabase.from("credit_logs").insert({
          user_id: userId,
          delta,
          new_balance: newCredit,
          note: note || null
        });

        // Update DOM
        const creditCell = document.getElementById(`credit-${userId}`);
        if (creditCell) creditCell.textContent = newCredit;
        alert("✅ Credits updated.");
      }

    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading credits: ${err.message}</p>`;
    }
  }
};

