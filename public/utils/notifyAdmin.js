// public/utils/notifyAdmin.js
window.utils = window.utils || {};

window.utils.notifyAdmin = async function (user_id, type, message, metadata = {}) {
  try {
    const supabase = window.supabase;
    await supabase.functions.invoke("notify_admin", {
      body: { user_id, type, message, metadata }
    });
  } catch (err) {
    console.warn("❌ Failed to notify admin:", err.message);
  }
};
