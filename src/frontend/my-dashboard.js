// launchbookai/src/frontend/my-dashboard.js

let currentUser = null;
const BASE_URL = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://ebook-pdf-generator.onrender.com';

const tabs = document.querySelectorAll(".tab-btn");
const panes = document.querySelectorAll(".tab-pane");

function switchTab(tab) {
  tabs.forEach(btn => btn.classList.remove("border-blue-600", "text-blue-600"));
  panes.forEach(p => p.classList.add("hidden"));
  document.getElementById(`tab-${tab}`).classList.remove("hidden");
  document.querySelector(`[data-tab='${tab}']`).classList.add("border-blue-600", "text-blue-600");
}

// ✅ Global user getter (used in generate.js or cover.js)
window.getCurrentUser = async function () {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

// ✅ Global credits logger (used in generate.js or email.js)
window.logCredits = async function ({ user_id, credits_used, action_type, metadata }) {
  await supabase.from("user_usage_logs").insert([{
    user_id,
    credits_used,
    action_type,
    metadata,
  }]);
};

// ✅ Global spinner helpers (used across modules)
window.showSpinner = function (msg = "Processing...") {
  const loading = document.getElementById("loading");
  loading.classList.remove("hidden");
  loading.querySelector("p").textContent = msg;
};

window.hideSpinner = function () {
  const loading = document.getElementById("loading");
  loading.classList.add("hidden");
};

async function getUser() {
  const user = await window.getCurrentUser();
  if (!user) return window.location.href = "/login";
  currentUser = user;
  document.getElementById("avatarName").textContent = user.email.split("@")[0];
}

async function loadSummary() {
  const { data: plan } = await supabase.from("users_plan").select("*").eq("user_id", currentUser.id).single();
  const used = plan.credits_used;
  const total = plan.credit_limit;
  const remain = total - used;
  const pct = Math.round((remain / total) * 100);
  const planName = plan.plan_name;
  document.getElementById("summary-cards").innerHTML = `
    <div class="bg-white p-4 rounded shadow">
      <h3 class="text-sm font-medium">🔋 Credits Remaining</h3>
      <p class="text-2xl font-bold">${remain} / ${total}</p>
      <div class="h-2 bg-gray-200 rounded mt-2">
        <div class="h-2 bg-blue-500 rounded" style="width: ${pct}%"></div>
      </div>
    </div>
    <div class="bg-white p-4 rounded shadow">
      <h3 class="text-sm font-medium">📦 Current Plan</h3>
      <p class="text-xl font-semibold">${planName}</p>
    </div>
    <div class="bg-white p-4 rounded shadow">
      <h3 class="text-sm font-medium">🗓 Valid Until</h3>
      <p class="text-xl font-semibold">${plan.end_date || 'Lifetime'}</p>
    </div>
  `;
}

// 🔁 Pagination + Filter State
let currentPage = 1;
const pageSize = 10;

async function loadEbooks(page = 1) {
  showSpinner("Loading eBooks...");

  const title = document.getElementById("searchTitle").value.trim();
  const format = document.getElementById("filterFormat").value;
  const from = document.getElementById("filterFrom").value;
  const to = document.getElementById("filterTo").value;

  const query = supabase.from("ebooks")
    .select("*", { count: 'exact' })
    .eq("user_id", currentUser.id)
    .eq("deleted", false);

  if (title) query.ilike("title", `%${title}%`);
  if (format) query.eq("output_format", format);
  if (from) query.gte("created_at", from);
  if (to) query.lte("created_at", to);

  query.order("created_at", { ascending: false });
  query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count } = await query;

  hideSpinner();

  const container = document.getElementById("ebook-table-container");
  const paginator = document.getElementById("ebook-pagination");

  if (!data || data.length === 0) {
    container.innerHTML = `<p class='text-gray-500'>No eBooks found.</p>`;
    paginator.classList.add("hidden");
    return;
  }

  container.innerHTML = `<table class='w-full text-sm'><thead><tr><th>Title</th><th>Pages</th><th>Date</th><th>Format</th><th>Credits</th><th>Action</th></tr></thead><tbody>
    ${data.map(e => {
      const date = new Date(e.created_at).toLocaleDateString();
      return `<tr class='border-b'>
        <td>${e.title}</td>
        <td>${e.total_pages || '--'}</td>
        <td>${date}</td>
        <td>${e.output_format.toUpperCase()}</td>
        <td>${e.estimated_credits || '—'}</td>
        <td>
          <a class='text-blue-600 underline' href="${e.download_url}" target="_blank">🔽 Download</a>
          <button class='text-red-600 ml-2 delete-ebook' data-id='${e.id}'>🗑 Delete</button>
        </td>
      </tr>`;
    }).join("\n")}</tbody></table>`;

  document.querySelectorAll(".delete-ebook").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this eBook?")) return;
      await supabase.from("ebooks").update({ deleted: true }).eq("id", btn.dataset.id);
      loadEbooks(currentPage);
      showToast("eBook deleted", "success");
    });
  });

  // Pagination UI
  const totalPages = Math.ceil(count / pageSize);
  currentPage = page;
  paginator.classList.remove("hidden");
  document.getElementById("pageInfo").textContent = `Page ${page} of ${totalPages}`;
  document.getElementById("prevPage").disabled = page === 1;
  document.getElementById("nextPage").disabled = page === totalPages;

  highlightFilters();
}

async function loadCovers() {
  const { data } = await supabase
    .from("cover_history")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  const container = document.getElementById("tab-covers");
  if (!data || data.length === 0) {
    container.innerHTML = `<p class='text-gray-500'>No covers found.</p>`;
    return;
  }

  container.innerHTML = `<div class='grid grid-cols-2 sm:grid-cols-4 gap-4'>
    ${data.map(c => `
      <div class='relative border rounded shadow group'>
        <img src='${c.cover_url}' class='w-full h-32 object-cover rounded-t'>
        <div class='p-2 text-sm flex justify-between items-center'>
          <span class='text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded'>${c.type.toUpperCase()}</span>
          <div class='flex gap-2 opacity-0 group-hover:opacity-100 transition'>
            <a href='${c.cover_url}' download target='_blank' class='text-blue-600 hover:underline'>🔽</a>
            <button class='text-red-600 delete-cover' data-id='${c.id}'>🗑</button>
          </div>
        </div>
      </div>`).join("")}
    </div>`;

  document.querySelectorAll(".delete-cover").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this cover from your history?")) return;
      await supabase.from("cover_history").update({ deleted: true }).eq("id", btn.dataset.id);
      loadCovers();
      showToast("Cover deleted", "success");
    });
  });
}

async function loadLogs() {
  const { data } = await supabase.from("user_usage_logs").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false });
  const container = document.getElementById("tab-logs");
  if (!data || data.length === 0) {
    container.innerHTML = `<p class='text-gray-500'>No usage history found.</p>`;
    return;
  }
  container.innerHTML = `<table class='w-full text-sm'><thead><tr><th>Date</th><th>Action</th><th>Credits</th><th>Notes</th></tr></thead><tbody>
    ${data.map(log => {
      const date = new Date(log.created_at).toLocaleDateString();
      const creditColor = log.credits_used > 0 ? 'text-red-600' : 'text-green-600';
      let icon = '⚙️';
      if (log.action_type.includes('pdf')) icon = '📘';
      else if (log.action_type.includes('epub')) icon = '📗';
      else if (log.action_type.includes('email')) icon = '📩';
      else if (log.action_type.includes('topup')) icon = '🎁';
      else if (log.action_type.includes('cover')) icon = '♻️';
      return `<tr class='border-b'>
        <td>${date}</td>
        <td>${icon} ${log.action_type.replace(/_/g, ' ')}</td>
        <td class='${creditColor}'>${log.credits_used > 0 ? '-' + log.credits_used : '+' + Math.abs(log.credits_used)}</td>
        <td>${log.metadata?.note || ''}</td>
      </tr>`;
    }).join("\n")}</tbody></table>`;
}

async function loadPresets() {
  const { data } = await supabase.from("generated_files").select("*").eq("user_id", currentUser.id).single();
  const container = document.getElementById("tab-presets");
  if (!data) {
    container.innerHTML = `<p class='text-gray-500'>No formatting preset saved.</p>`;
    return;
  }
  container.innerHTML = `<div class='bg-white p-4 rounded shadow text-sm'>
    <p><strong>Font:</strong> ${data.font_type}</p>
    <p><strong>Size:</strong> ${data.font_size}</p>
    <p><strong>Spacing:</strong> ${data.line_spacing} line, ${data.paragraph_spacing} para</p>
    <p><strong>Margins:</strong> ${data.margin_top}/${data.margin_right}/${data.margin_bottom}/${data.margin_left}</p>
    <p><strong>Page Size:</strong> ${data.page_size}</p>
    <p><strong>Alignment:</strong> ${data.text_alignment}</p>
  </div>`;
}

function highlightFilters() {
  const search = document.getElementById("searchTitle").value;
  const format = document.getElementById("filterFormat").value;
  const from = document.getElementById("filterFrom").value;
  const to = document.getElementById("filterTo").value;
  const isActive = search || format || from || to;
  const applyBtn = document.getElementById("applyFilters");
  applyBtn.classList.toggle("bg-blue-700", isActive);
  applyBtn.classList.toggle("bg-blue-600", !isActive);
  applyBtn.classList.toggle("ring-2", isActive);
}

// 🔃 Main Init
window.addEventListener("DOMContentLoaded", async () => {
  await getUser();
  await loadSummary();
  await loadEbooks();
  await loadCovers();
  await loadLogs();
  await loadPresets();
  switchTab("ebooks");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.getElementById("applyFilters").addEventListener("click", () => {
    loadEbooks(1);
    highlightFilters();
  });

  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchTitle").value = "";
    document.getElementById("filterFormat").value = "";
    document.getElementById("filterFrom").value = "";
    document.getElementById("filterTo").value = "";
    loadEbooks(1);
    highlightFilters();
  });

  document.getElementById("prevPage").addEventListener("click", () => loadEbooks(currentPage - 1));
  document.getElementById("nextPage").addEventListener("click", () => loadEbooks(currentPage + 1));
});
