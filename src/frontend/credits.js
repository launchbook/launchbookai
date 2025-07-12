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

// ✅ Load and show credit badge
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

// ✅ Save formatting
async function savePresetToSupabase(presetData) {
  if (!currentUser) return;
  await supabase.from("generated_files").insert({
    user_id: currentUser.id,
    ...presetData,
  });
  alert("✅ Formatting saved!");
}

// ✅ Load formatting
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

// ✅ Dynamic Cost Estimator for content
function estimateCreditCost({ 
  wordCount = 0, 
  imageCount = 0, 
  withCover = false, 
  isRegeneration = false 
}) {
  const base = Math.ceil(wordCount / 200) * 40;
  const imageCost = imageCount * 120;
  const coverCost = withCover ? 150 : 0;
  const regenPenalty = 0; // disabled
  const total = base + imageCost + coverCost + regenPenalty;
  const floor = isRegeneration ? 500 : 1000;
  return Math.max(total, floor);
}

function showCreditEstimate({ wordCount, imageCount, withCover, isRegeneration }) {
  const estimated = estimateCreditCost({ wordCount, imageCount, withCover, isRegeneration });
  const badge = document.getElementById("credit-estimate-msg");
  if (badge) badge.textContent = `Estimated credits: ${estimated}`;
}

// ✅ Special Estimators
function estimateCoverImageCost({ style = "default" }) {
  return 150;
}
function estimateURLConversionCost({ wordCount = 0, imageCount = 0 }) {
  const base = Math.ceil(wordCount / 200) * 40;
  const images = imageCount * 120;
  return Math.max(base + images, 800); // floor 800
}
function estimateEmailCost() {
  return 30;
}

// ✅ Fetch user credit info for deeper checks
async function getUserCredits(userId) {
  const { data, error } = await supabase
    .from("users_plan")
    .select("credit_limit, credits_used, is_active, plan_type")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("❌ Failed to fetch user credits:", error.message);
    return null;
  }

  return data;
}

// ✅ Check credit balance dynamically
async function checkCredits(userId, costEstimate) {
  const plan = await getUserCredits(userId);
  if (!plan || !plan.is_active) {
    alert("❌ Your plan is inactive or expired. Please upgrade to continue.");
    return false;
  }

  const remaining = plan.credit_limit - plan.credits_used;
  if (costEstimate > remaining) {
    alert(`❌ Not enough credits. You need ${costEstimate}, but have only ${remaining}.`);
    return false;
  }

  return true;
}

// ✅ Log usage and deduct credits
async function logUsage(userId, email, actionType, details = {}) {
  let cost = CREDIT_COSTS[actionType] || 0;

  // 🧠 Dynamic credit deduction
  if (actionType === "generate_from_url" && details.dynamic_cost) {
    cost = details.dynamic_cost;
  }

  const { error: logError } = await supabase.from("user_usage_logs").insert({
    user_id: userId,
    email,
    action_type: actionType,
    credits_used: cost,
    metadata: details,
  });
  if (logError) console.error("❌ Logging failed:", logError.message);

  const { error: updateError } = await supabase.rpc("increment_credits_used", {
    p_user_id: userId,
    p_increment: cost,
  });
  if (updateError) console.error("❌ RPC credit update failed:", updateError.message);
}

// 🌍 Expose to all modules
window.CREDIT_COSTS = CREDIT_COSTS;
window.remainingCredits = remainingCredits;
window.loadUserCredits = loadUserCredits;
window.savePresetToSupabase = savePresetToSupabase;
window.loadPresetFromSupabase = loadPresetFromSupabase;
window.estimateCreditCost = estimateCreditCost;
window.estimateCoverImageCost = estimateCoverImageCost;
window.estimateEmailCost = estimateEmailCost;
window.estimateURLConversionCost = estimateURLConversionCost;
window.showCreditEstimate = showCreditEstimate;
window.checkCredits = checkCredits;
window.logUsage = logUsage;
window.getUserCredits = getUserCredits;
