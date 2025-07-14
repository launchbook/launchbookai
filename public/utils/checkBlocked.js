// ✅ public/utils/checkBlocked.js
window.utils = window.utils || {};

window.utils.checkIfBlocked = async function () {
  const supabase = window.supabase;
  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData?.user) {
    alert("⚠️ Please log in again.");
    return true;
  }

  const { data: dbUser, error } = await supabase
    .from("users")
    .select("blocked")
    .eq("id", userData.user.id)
    .single();

  if (error) {
    console.error("Error checking block status:", error.message);
    return false;
  }

  if (dbUser?.blocked) {
    alert("⚠️ Your account has been blocked. Please contact support.");
    return true;
  }

  return false;
};
