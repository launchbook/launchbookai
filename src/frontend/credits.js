// launchbookai/src/frontend/credit.js

let currentUser = null;
let remainingCredits = 0;

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

// ✅ Load Preset
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

// 🌍 Attach all to global `window` so frontend can use them
window.loadUserCredits = loadUserCredits;
window.savePresetToSupabase = savePresetToSupabase;
window.loadPresetFromSupabase = loadPresetFromSupabase;
