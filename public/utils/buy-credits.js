// src/frontend/buy-credits.js
document.addEventListener("DOMContentLoaded", () => {
  const buyButtons = document.querySelectorAll("[data-buy-credits]");

  buyButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const amount = parseInt(button.dataset.buyCredits, 10);
      const supabase = window.supabase;
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;

      if (!user_id) return alert("Please log in again.");

      // 1. Add credits
      await supabase.rpc("add_credits", { user_id, credits: amount }); // If you're using a stored proc
      // or use: await supabase.from("users").update({ credits: ... })

      // 2. Notify admin
      await window.utils.notifyAdmin(
        user_id,
        "credit_purchase",
        `User purchased ${amount} extra credits.`,
        { credits: amount }
      );

      alert(`✅ ${amount} credits added.`);
      location.reload();
    });
  });
});
