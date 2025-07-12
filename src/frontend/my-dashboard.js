// launchbookai/src/frontend/my-dashboard.js
// User Dashboard JS

// ✅ Globals
let currentUser = null;
const BASE_URL = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://ebook-pdf-generator.onrender.com';

// ✅ Supabase Init
import { supabase } from '/supabaseClient.js';

// ✅ Tabs
const tabs = document.querySelectorAll(".tab-btn");
const panes = document.querySelectorAll(".tab-pane");

function switchTab(tab) {
  tabs.forEach(btn => btn.classList.remove("border-blue-600", "text-blue-600"));
  panes.forEach(p => p.classList.add("hidden"));
  document.getElementById(`tab-${tab}`).classList.remove("hidden");
  document.querySelector(`[data-tab='${tab}']`).classList.add("border-blue-600", "text-blue-600");
}

// ✅ Fetch Plan Summary
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

// ✅ Auth
async function getUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.href = "/login";
  currentUser = session.user;
  document.getElementById("user-name").textContent = currentUser.email.split("@")[0];
}

// ✅ Init
window.addEventListener("DOMContentLoaded", async () => {
  await getUser();
  await loadSummary();
  switchTab("ebooks");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  // TODO: Load eBooks, covers, logs, presets, settings
});

