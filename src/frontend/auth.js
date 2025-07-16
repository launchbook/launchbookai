// public/frontend/auth.js (Fully Enhanced CommonJS Version)
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://wgvquzflchtmgdgwugrq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnF1emZsY2h0bWdkZ3d1Z3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODcwNTYsImV4cCI6MjA2NzM2MzA1Nn0.xMIbM0AYW24qerEeAi3SDTxrNOtO5tWUYHMudxNwTjg"
);

window.addEventListener("DOMContentLoaded", async () => {
  // Toggle password visibility with SVG icons
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.closest(".relative").querySelector("input");
    const eyeIcon = btn.querySelector(".eye-icon");
    const eyeOffIcon = btn.querySelector(".eye-off-icon");

    if (input.type === "password") {
      input.type = "text";
      eyeIcon.classList.add("hidden");
      eyeOffIcon.classList.remove("hidden");
    } else {
      input.type = "password";
      eyeOffIcon.classList.add("hidden");
      eyeIcon.classList.remove("hidden");
    }
  });
});

  // ✅ Signup Form
  const signupForm = document.querySelector("#signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = signupForm["signup-email"].value;
      const password = signupForm["signup-password"].value;
      const fullName = signupForm["signup-fullname"].value;

      const btn = signupForm.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Creating...";

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        alert("❌ " + error.message);
        btn.disabled = false;
        btn.textContent = "Create Account";
        return;
      }

      alert("✅ Signup successful. Please verify your email.");
      window.location.href = "/verify-email";
    });
  }

  // ✅ Login Form
  const loginForm = document.querySelector("#signin-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm["signin-email"].value;
      const password = loginForm["signin-password"].value;

      const btn = loginForm.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Signing in...";

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("❌ " + error.message);
        btn.disabled = false;
        btn.textContent = "Sign In";
        return;
      }

      alert("✅ Logged in!");
      window.location.href = "/dashboard";
    });
  }

  // ✅ Google OAuth
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

  // ✅ Magic Link Login
  const magicForm = document.querySelector("#magic-login-form");
  if (magicForm) {
    magicForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("magic-email").value;
      const btn = magicForm.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Sending...";

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: "https://launchebookai.leostarearn.com/dashboard",
        },
      });

      if (error) {
        alert("❌ " + error.message);
        btn.disabled = false;
        btn.textContent = "Send Magic Link";
        return;
      }

      alert("✅ Magic link sent. Check your inbox!");
      btn.textContent = "Sent!";
    });
  }

  // ✅ Email Verification Screen
  const resendBtn = document.querySelector("#resend-email");
  if (resendBtn) {
    const status = document.getElementById("resend-status");

    resendBtn.addEventListener("click", async () => {
      status.classList.remove("hidden");
      status.textContent = "🔄 Sending...";

      const { error } = await supabase.auth.resend();
      if (error) status.textContent = "❌ " + error.message;
      else status.textContent = "✅ Email sent again!";
    });

    // ⏳ Poll every 30s to check if verified
    setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        window.location.href = "/dashboard";
      }
    }, 30000);
  }

  // ✅ Google One Tap + Session check
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      window.location.href = "/dashboard";
    }
  });

  // ✅ Redirection guard (Auto redirect based on auth state)
  const pathname = window.location.pathname;
  const { data: { session } } = await supabase.auth.getSession();

  if (session && ["/signin", "/signup", "/magic-login"].includes(pathname)) {
    window.location.href = "/dashboard";
  }

  if (!session && pathname === "/dashboard") {
    window.location.href = "/signin";
  }

    // ✅ Forgot Password Flow
  const forgotForm = document.querySelector("#forgot-password-form");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("forgot-email").value;
      const btn = forgotForm.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Sending...";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://launchebookai.leostarearn.com/reset-password",
      });

      if (error) {
        alert("❌ " + error.message);
        btn.disabled = false;
        btn.textContent = "Send Reset Link";
        return;
      }

      alert("✅ Reset link sent! Check your email.");
      btn.textContent = "Sent!";
    });
  }

});
