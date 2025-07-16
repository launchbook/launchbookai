// public/frontend/auth.js (CommonJS Version)

const { createClient } = require("@supabase/supabase-js");

// ✅ Your Supabase credentials
const supabase = createClient(
  "https://wgvquzflchtmgdgwugrq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Replace with real anon key
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
