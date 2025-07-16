const { createClient } = require("@supabase/supabase-js");

// ✅ Your Supabase credentials
const supabase = createClient(
  "https://wgvquzflchtmgdgwugrq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnF1emZsY2h0bWdkZ3d1Z3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODcwNTYsImV4cCI6MjA2NzM2MzA1Nn0.xMIbM0AYW24qerEeAi3SDTxrNOtO5tWUYHMudxNwTjg"
);

window.addEventListener("DOMContentLoaded", () => {
  // ✅ Password toggle handler
  document.querySelectorAll('[data-toggle="password"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈"; // Hide icon
      } else {
        input.type = "password";
        btn.textContent = "👁️‍🗨️"; // Show icon
      }
    });
  });

  // ✅ Email Signup
  const signupForm = document.querySelector("#signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return alert("❌ " + error.message);
      alert("✅ Signup successful. Check your inbox!");
    });
  }

  // ✅ Email Login
  const loginForm = document.querySelector("#signin-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signin-email").value;
      const password = document.getElementById("signin-password").value;

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return alert("❌ " + error.message);
      window.location.href = "/dashboard";
    });
  }

  // ✅ Google OAuth (works for both signup and signin)
  const googleBtn = document.querySelector("#google-signin") || document.querySelector("#google-signup");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://launchebookai.leostarearn.com/dashboard",
        },
      });
      if (error) alert("❌ Google login failed: " + error.message);
    });
  }
});
