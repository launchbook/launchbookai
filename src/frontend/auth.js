// public/frontend/auth.js (CommonJS Version)

const { createClient } = require("@supabase/supabase-js");

// ✅ Your Supabase credentials
const supabase = createClient(
  "https://wgvquzflchtmgdgwugrq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnF1emZsY2h0bWdkZ3d1Z3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODcwNTYsImV4cCI6MjA2NzM2MzA1Nn0.xMIbM0AYW24qerEeAi3SDTxrNOtO5tWUYHMudxNwTjg"
);

// Wait for DOM to load
window.addEventListener("DOMContentLoaded", () => {
  // ✅ Toggle password visibility
  document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", () => {
      const input = icon.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
      icon.textContent = input.type === "password" ? "👁️" : "🙈";
    });
  });

  // ✅ Email Signup
  const signupForm = document.querySelector("#signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = signupForm.email.value;
      const password = signupForm.password.value;

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return alert("❌ " + error.message);
      alert("✅ Signup successful. Check your inbox!");
    });
  }

  // ✅ Email Login
  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return alert("❌ " + error.message);
      window.location.href = "/dashboard";
    });
  }

  // ✅ Google OAuth Login
  const googleBtn = document.querySelector("#google-login");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://launchebookai.leostarearn.com/dashboard",
        },
      });
      if (error) alert("Google login failed: " + error.message);
    });
  }
});
