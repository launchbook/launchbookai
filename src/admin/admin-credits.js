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

      // Render UI
      container.innerHTML = `
        <div class="mb-4 flex justify-between items-center">
          <input id="creditSearchInput" type="text" placeholder="🔍 Search by name or email..." class="w-full max-w-md px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
        </div>

        <div class="overflow-auto border rounded">
          <table class="w-full text-sm table-auto">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-2 text-left">👤 Name</th>
                <th class="p-2 text-left">📧 Email</th>
                <th class="p-2 text-left">💳 Credits</th>
                <th class="p-2 text-left">⚙️ Actions</th>
              </tr>
            </thead>
            <tbody id="creditTableBody" class="divide-y dark:divide-gray-700">
              ${users.map(user => `
                <tr data-user-id="${user.id}">
                  <td class="p-2">${user.name || "—"}</td>
                  <td class="p-2">${user.email}</td>
                  <td class="p-2 font-mono" id="credit-${user.id}">${user.credits}</td>
                  <td class="p-2 space-x-2">
                    <button class="adjust-credit-btn text-blue-600 hover:underline" data-user-id="${user.id}" data-email="${user.email}">➕ Adjust</button>
                    <button class="view-credits-btn text-gray-500 hover:underline text-sm" data-user-id="${user.id}" data-email="${user.email}">📊 View</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      // 🔍 Search filter
      document.getElementById("creditSearchInput").addEventListener("input", e => {
        const val = e.target.value.toLowerCase();
        container.querySelectorAll("#creditTableBody tr").forEach(row => {
          row.style.display = row.innerText.toLowerCase().includes(val) ? "" : "none";
        });
      });

      // ➕ Adjust credits
      container.querySelectorAll(".adjust-credit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const userId = btn.dataset.userId;
          const userEmail = btn.dataset.email;

          const amount = prompt(`Enter credit adjustment for ${userEmail}:\n(positive to add, negative to subtract)`);
          if (!amount) return;

          const delta = parseInt(amount, 10);
          if (isNaN(delta)) return alert("❌ Invalid number.");

          const note = prompt("Optional note for log (e.g. Manual top-up, refund correction, etc):");

          adjustUserCredits(userId, delta, note);
        });
      });

      // 📊 View credit history
     // 🧠 Core logic: adjust and log
async function adjustUserCredits(userId, delta, note = "") {
  const { data: userData, error: fetchErr } = await supabase
    .from("users")
    .select("credits, email")
    .eq("id", userId)
    .single();

  if (fetchErr) return alert("❌ Failed to fetch user credits.");
  const newCredit = Math.max((userData.credits || 0) + delta, 0);

  const { error: updateErr } = await supabase
    .from("users")
    .update({ credits: newCredit })
    .eq("id", userId);

  if (updateErr) return alert("❌ Failed to update credits.");

  await supabase.from("credit_logs").insert({
    user_id: userId,
    delta,
    new_balance: newCredit,
    note: note || null
  });

  // ✅ Auto-notify admin
  await supabase.functions.invoke("notify_admin", {
    body: {
      user_id: userId,
      type: delta > 0 ? "manual_credit_add" : "manual_credit_deduct",
      message: `Admin ${delta > 0 ? "added" : "deducted"} ${Math.abs(delta)} credits`,
      metadata: { delta, note, new_balance: newCredit, email: userData.email }
    }
  });

  // Update DOM
  const creditCell = document.getElementById(`credit-${userId}`);
  if (creditCell) creditCell.textContent = newCredit;
  alert("✅ Credits updated and logged.");
}


    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading credits: ${err.message}</p>`;
    }
  }
};

await supabase.functions.invoke("notify_admin", {
  body: {
    user_id: userData.user.id,
    type: "credit_purchase", // or "plan_upgrade", etc.
    message: `User bought 10,000 credits`,
    metadata: { credits: 10000 }
  }
});

