import { supabase } from './supabase.js';

export async function validateActivePlan(userId) {
  const { data, error } = await supabase
    .from("users_plan")
    .select("is_active, plan_type, start_date, end_date")
    .eq("user_id", userId)
    .single();

  if (error || !data) return { allowed: false, reason: "Plan not found or error." };
  if (data.plan_type === "lifetime") return { allowed: true };

  const now = new Date();
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);

  if (!data.is_active || now > end) {
    return { allowed: false, reason: "Your plan has expired. Please renew or upgrade." };
  }

  return { allowed: true };
}
