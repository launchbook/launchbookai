// launchbookai/src/frontend/credit.js

let currentUser = null;
let remainingCredits = 0;

const CREDIT_COSTS = {
  generate_pdf: 1000,
  regen_pdf: 500,
  regen_image: 100,
  generate_epub: 1000,
  send_email: 30,
  generate_cover: 300,
  generate_from_url: 800,
};

// ✅ Load user and credit info
async function loadUserCredits() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.href = "/login";
  currentUser = session.user;

  const { data: plan } = await supabase
    .from("users_plan")
    .select("credit_limit, credits_used")
    .eq("user_id", currentUser.id)
    .single();

  remainingCredits = plan.credit_limit - plan.credits_used;

  const creditDisplay = document.getElementById("creditBadge");
  if (creditDisplay) {
    creditDisplay.textContent = `🔋 ${remainingCredits} credits left`;
  }
}

// ✅ Save Formatting to Supabase
async function savePresetToSupabase(presetData) {
  if (!currentUser) return;

  await supabase.from("generated_files").insert({
    user_id: currentUser.id,
    ...presetData
  });

  alert("✅ Formatting saved!");
}

// ✅ Load Formatting Preset
async function loadPresetFromSupabase() {
  if (!currentUser) return null;

  const { data } = await supabase
    .from("generated_files")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data || null;
}

// ✅ Check Credit Balance
async function checkCredits(userId, cost) {
  const { data: plan } = await supabase
    .from("users_plan")
    .select("credit_limit, credits_used")
    .eq("user_id", userId)
    .single();

  const remaining = plan.credit_limit - plan.credits_used;

  if (remaining < cost) {
    alert(`🚫 Not enough credits. Required: ${cost}, You have: ${remaining}`);
    return false;
  }
  return true;
}

// ✅ Log credit usage
async function logUsage(userId, action_type, credits_used, metadata = {}) {
  await supabase.from("user_usage_logs").insert([
    {
      user_id: userId,
      action_type,
      credits_used,
      metadata,
    }
  ]);
}

// 🌍 Make available globally to all modules
window.CREDIT_COSTS = CREDIT_COSTS;
window.loadUserCredits = loadUserCredits;
window.savePresetToSupabase = savePresetToSupabase;
window.loadPresetFromSupabase = loadPresetFromSupabase;
window.checkCredits = checkCredits;
window.logUsage = logUsage;
