// ✅ showToast: global toast with success/error styles
window.showToast = function (msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `
    toast-item fixed right-5 z-50 px-4 py-2 mt-2 rounded shadow
    ${type === "success" ? "bg-green-600" : "bg-red-600"} text-white
  `;
  toast.style.top = `${document.querySelectorAll('.toast-item').length * 60 + 20}px`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// ✅ Spinner helpers (used in generate, email, etc.)
window.showSpinner = function (msg = "Processing...") {
  const loading = document.getElementById("loading");
  if (loading) {
    loading.classList.remove("hidden");
    loading.querySelector("p").textContent = msg;
  }
};

window.hideSpinner = function () {
  const loading = document.getElementById("loading");
  if (loading) loading.classList.add("hidden");
};

// ✅ Get current user (safe fallback)
window.getCurrentUser = async function () {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

// ✅ Log credit usage to Supabase (standard format)
window.logCredits = async function ({ user_id, credits_used, action_type, metadata }) {
  try {
    await supabase.from("user_usage_logs").insert([{
      user_id,
      credits_used,
      action_type,
      metadata,
    }]);
  } catch (err) {
    console.error("Failed to log usage", err);
  }
};
