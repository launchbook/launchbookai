// src/admin/admin-ebooks.js

window.AdminModules = window.AdminModules || {};
window.AdminModules["ebooks"] = {
  init: async function (container) {
    container.innerHTML = `<div class="text-sm text-gray-600 mb-4">Loading eBooks...</div>`;
    const supabase = window.supabase;

    try {
      const { data: ebooks, error } = await supabase
        .from("ebooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!ebooks.length) {
        container.innerHTML = `<p class="text-gray-500 text-sm italic">No eBooks found.</p>`;
        return;
      }

      container.innerHTML = `
        <div class="mb-4 flex flex-col md:flex-row md:items-center gap-3">
          <input id="ebookSearchInput" type="text" placeholder="🔍 Search by title or user ID..." class="w-full md:w-96 px-4 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
        </div>

        <div class="overflow-auto">
          <table class="min-w-full text-sm table-auto border border-gray-200 dark:border-gray-700">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-2 text-left">Title</th>
                <th class="p-2">User ID</th>
                <th class="p-2">Format</th>
                <th class="p-2">Pages</th>
                <th class="p-2">Images</th>
                <th class="p-2">Credits</th>
                <th class="p-2">Created</th>
                <th class="p-2">Download</th>
                <th class="p-2">Actions</th>
              </tr>
            </thead>
            <tbody id="ebookTableBody" class="divide-y dark:divide-gray-700">
              ${ebooks.map(ebook => `
                <tr data-ebook-id="${ebook.id}" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="p-2 max-w-xs truncate" title="${ebook.title}">${ebook.title || "Untitled"}</td>
                  <td class="p-2 text-xs">${ebook.user_id || "—"}</td>
                  <td class="p-2 text-center">${ebook.format || "—"}</td>
                  <td class="p-2 text-center">${ebook.page_count ?? "—"}</td>
                  <td class="p-2 text-center">${ebook.image_count ?? "—"}</td>
                  <td class="p-2 text-center">${ebook.credits_used ?? "—"}</td>
                  <td class="p-2 text-xs">${new Date(ebook.created_at).toLocaleString()}</td>
                  <td class="p-2 text-center">
                    ${ebook.download_url
                      ? `<a href="${ebook.download_url}" target="_blank" class="text-blue-600 hover:underline">⬇️ View</a>`
                      : "—"}
                  </td>
                  <td class="p-2 text-center">
                    <button class="text-red-600 hover:underline delete-ebook-btn">🗑️ Delete</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      // 🔍 Search functionality
      document.getElementById("ebookSearchInput").addEventListener("input", e => {
        const val = e.target.value.toLowerCase();
        const rows = container.querySelectorAll("tbody tr");
        rows.forEach(row => {
          const text = row.innerText.toLowerCase();
          row.style.display = text.includes(val) ? "" : "none";
        });
      });

      // 🗑️ Delete functionality
      container.querySelectorAll(".delete-ebook-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const row = btn.closest("tr");
          const ebookId = row.dataset.ebookId;
          const confirmed = confirm("Are you sure you want to permanently delete this eBook?");
          if (!confirmed) return;

          const { error } = await supabase.from("ebooks").delete().eq("id", ebookId);
          if (error) return alert("❌ Failed to delete eBook.");
          row.remove();
        });
      });

    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading eBooks: ${err.message}</p>`;
    }
  }
};
