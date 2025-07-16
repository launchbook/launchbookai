// public/frontend/auth.js (Improved CommonJS Version)
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://wgvquzflchtmgdgwugrq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnF1emZsY2h0bWdkZ3d1Z3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODcwNTYsImV4cCI6MjA2NzM2MzA1Nn0.xMIbM0AYW24qerEeAi3SDTxrNOtO5tWUYHMudxNwTjg"
);

window.addEventListener("DOMContentLoaded", () => {
  // ✅ Toggle password visibility
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".relative").querySelector("input");
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
      } else {
        input.type = "password";
        btn.textContent = "👁️";
      }
    });
  });

  // ✅ Email Signup
  const signupForm = document.querySelector("#signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = signupForm["signup-email"].value;
      const password = signupForm["signup-password"].value;
      const fullName = signupForm["signup-fullname"].value;

      const submitBtn = signupForm.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating...";

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        alert("❌ " + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
        return;
      }

      alert("✅ Signup successful! Check your inbox.");
      window.location.href = "/";
    });
  }

  // ✅ Email Login
  const loginForm = document.querySelector("#signin-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm["signin-email"].value;
      const password = loginForm["signin-password"].value;

      const submitBtn = loginForm.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in...";

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("❌ " + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In";
        return;
      }

      alert("✅ Login successful!");
      window.location.href = "/dashboard";
    });
  }

  // ✅ Google OAuth (Button based)
  const googleBtn = document.querySelector("#google-signin") || document.querySelector("#google-signup") || document.querySelector("#google-login");
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

  // ✅ Google One Tap Login (Optional progressive enhancement)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      // Auto-redirect if logged in via One Tap
      window.location.href = "/dashboard";
    }
  });
});
