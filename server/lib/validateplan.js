// server/lib/validatePlan.js

const { supabase } = require('./supabase');

async function validateActivePlan(userId) {
  const { data, error } = await supabase
    .from("users_plan")
    .select("is_active, plan_type, start_date, end_date")
    .eq("user_id", userId)
    .single();

  if (error || !data) return { allowed: false, reason: "Plan not found or error." };
  if (data.plan_type === "lifetime") return { allowed: true };

  const now = new Date();
  const start = data.start_date ? new Date(data.start_date) : null;
  const end = data.end_date ? new Date(data.end_date) : null;

  if (!data.is_active || !start || !end || now > end) {
    return { allowed: false, reason: "Your plan has expired. Please renew or upgrade." };
  }

  return { allowed: true };
}

module.exports = { validateActivePlan };
