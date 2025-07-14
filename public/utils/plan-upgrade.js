// src/frontend/plan-upgrade.js
document.addEventListener("DOMContentLoaded", () => {
  const upgradeButtons = document.querySelectorAll("[data-upgrade-plan]");

  upgradeButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const newPlan = button.dataset.upgradePlan;
      const supabase = window.supabase;
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;

      if (!user_id) return alert("Please log in again.");

      const planCredits = {
        starter: 5000,
        growth: 12500,
        pro: 25000,
        agency: 50000
      };

      // 1. Update user's plan & credits
      await supabase.from("users").update({
        plan: newPlan,
        credits: planCredits[newPlan] || 0
      }).eq("id", user_id);

      // 2. Notify admin
      await window.utils.notifyAdmin(
        user_id,
        "plan_upgrade",
        `User upgraded to ${newPlan} plan.`,
        {
          plan: newPlan,
          credits: planCredits[newPlan]
        }
      );

      alert(`✅ Upgraded to ${newPlan} plan.`);
      location.reload();
    });
  });
});
