window.AdminModules = window.AdminModules || {};

window.AdminModules["covers"] = {
  init: async function (container) {
    if (await window.utils.checkIfBlocked()) return;

    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading covers...</p>`;
    const supabase = window.supabase;

    try {
      const { data: covers, error } = await supabase
        .from("covers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!covers.length) {
        container.innerHTML = `<p class="text-gray-500 italic">No covers found.</p>`;
        return;
      }

      container.innerHTML = `
        <div class="mb-4">
          <input id="coverSearchInput" type="text" placeholder="🔍 Filter by user ID or eBook ID..." class="w-full md:w-96 px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="coverGrid">
          ${covers.map(cover => `
            <div class="border dark:border-gray-700 rounded shadow p-3 flex flex-col items-center text-sm relative" data-cover-id="${cover.id}">
              <img src="${cover.url || "/placeholder.jpg"}" alt="Cover" class="w-full h-48 object-cover rounded mb-2" />
              <div class="text-xs text-gray-600 dark:text-gray-400 w-full space-y-1">
                <p><strong>eBook ID:</strong> ${cover.ebook_id || "—"}</p>
                <p><strong>User:</strong> ${cover.user_id || "—"}</p>
                ${cover.credits_used ? `<p><strong>Credits Used:</strong> ${cover.credits_used}</p>` : ""}
                <p><strong>Created:</strong> ${new Date(cover.created_at).toLocaleString()}</p>
              </div>
              <button class="delete-cover-btn mt-2 text-red-600 hover:underline">🗑️ Delete</button>
            </div>
          `).join("")}
        </div>
      `;

      // 🔍 Filter/Search
      document.getElementById("coverSearchInput").addEventListener("input", e => {
        const val = e.target.value.toLowerCase();
        const cards = container.querySelectorAll("[data-cover-id]");
        cards.forEach(card => {
          const text = card.innerText.toLowerCase();
          card.style.display = text.includes(val) ? "" : "none";
        });
      });

      // 🗑️ Delete
      container.querySelectorAll(".delete-cover-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const card = btn.closest("[data-cover-id]");
          const coverId = card.dataset.coverId;
          const confirmed = confirm("Are you sure you want to delete this cover image?");
          if (!confirmed) return;

          const { error } = await supabase.from("covers").delete().eq("id", coverId);
          if (error) return alert("❌ Failed to delete cover.");
          card.remove();
        });
      });

    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading covers: ${err.message}</p>`;
    }
  }
};
