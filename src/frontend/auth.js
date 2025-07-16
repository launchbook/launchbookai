const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://wgvquzflchtmgdgwugrq.supabase.co",
  "YOUR_ANON_KEY" // Replace with actual anon key
);

window.addEventListener("DOMContentLoaded", async () => {
  // 👁️ Toggle password visibility
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

  // ✅ Signup
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

  // ✅ Signin with Remember Me + Last Login Tracking
  const loginForm = document.querySelector("#signin-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm["signin-email"].value.trim();
      const password = loginForm["signin-password"].value;
      const rememberMe = loginForm.querySelector("#remember-me")?.checked;

      const btn = loginForm.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Signing in...";

      if (!email || !password) {
        alert("❗ Please fill in both email and password");
        btn.disabled = false;
        btn.textContent = "Sign In";
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword(
        { email, password },
        {
          session: rememberMe ? "persist" : "session",
        }
      );

      if (error) {
        alert("❌ " + error.message);
        btn.disabled = false;
        btn.textContent = "Sign In";
        return;
      }

      if (!data.user?.email_confirmed_at) {
        alert("⚠️ Please verify your email first.");
        window.location.href = "/verify-email";
        return;
      }

      // ✅ Update last login metadata
      await supabase.auth.updateUser({
        data: { last_login_at: new Date().toISOString() },
      });

      alert("✅ Logged in!");
      window.location.href = "/dashboard";
    });
  }

  // ✅ Google OAuth Click
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

  // ✅ Magic Link
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

  // ✅ Forgot Password
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

  // ✅ Resend Email + Poll for Verification
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

    setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        window.location.href = "/dashboard";
      }
    }, 30000);
  }

  // ✅ Auth Guards + Admin Redirect
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = window.location.pathname;

  if (session && ["/signin", "/signup", "/magic-login"].includes(pathname)) {
    window.location.href = "/dashboard";
  }

  if (!session && pathname === "/dashboard") {
    window.location.href = "/signin";
  }

  if (user?.email === "admin@launchebookai.com" && pathname === "/dashboard") {
    window.location.href = "/admin";
  }

  if (pathname === "/dashboard" && !user?.email_confirmed_at) {
    alert("⚠️ Please verify your email to access the dashboard.");
    window.location.href = "/verify-email";
  }

  // ✅ Session Expire
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      alert("🔒 Session expired. Please sign in again.");
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1200);
    }
  });

  // ✅ Google One Tap
  if (!session) {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID", // Replace this
        callback: async (response) => {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });
          if (error) {
            alert("❌ Google One Tap failed: " + error.message);
          } else {
            // ✅ Update last login metadata after One Tap
            await supabase.auth.updateUser({
              data: { last_login_at: new Date().toISOString() },
            });
            window.location.href = "/dashboard";
          }
        },
        auto_select: true,
        cancel_on_tap_outside: false,
      });
      window.google.accounts.id.prompt();
    };
    document.head.appendChild(script);
  }
});
