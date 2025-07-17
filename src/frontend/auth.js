const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://wgvquzflchtmgdgwugrq.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndnF1emZsY2h0bWdkZ3d1Z3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODcwNTYsImV4cCI6MjA2NzM2MzA1Nn0.xMIbM0AYW24qerEeAi3SDTxrNOtO5tWUYHMudxNwTjg" // Replace with actual anon key);

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
  const signUpForm = document.querySelector("#signup-form");
if (signUpForm) {
  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = signUpForm.querySelector("button[type=submit]");
    const fullName = signUpForm.querySelector("#full_name")?.value.trim();
    const email = signUpForm.querySelector("#email")?.value.trim();
    const password = signUpForm.querySelector("#password")?.value;

    // ✅ 3.1 Add Basic Validation
    if (!email || !password || !fullName) {
      alert("❗ All fields are required.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Creating...";

    // ✅ Properly destructure data + error
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: "https://launchebookai.leostarearn.com/verify-email", // this matches your flow
      },
    });

    if (error) {
      alert("❌ Signup failed: " + error.message);
      btn.disabled = false;
      btn.textContent = "Create Account";
      return;
    }

    // ✅ Redirect to verify email screen
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

    // ✅ 1. SIGN IN using password
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  alert("❌ " + error.message);
  btn.disabled = false;
  btn.textContent = "Sign In";
  return;
}

// ✅ 2. Safer check: is email verified?
const { data: userData } = await supabase.auth.getUser();
if (!userData.user?.email_confirmed_at) {
  alert("⚠️ Please verify your email first.");
  window.location.href = "/verify-email";
  return;
}


    // ✅ 3. Update last login metadata
    await supabase.auth.updateUser({
      data: {
        last_login_at: new Date().toISOString(),
      },
    });

    // ✅ 4. Set session persistence (remember me)
    if (rememberMe) {
      localStorage.setItem("supabase.auth.persistSession", "true");
    } else {
      localStorage.setItem("supabase.auth.persistSession", "false");
    }

    // ✅ 5. Redirect
    alert("✅ Logged in!");
    window.location.href = "/dashboard";
  });
}


  // ✅ Google OAuth Click
document.querySelectorAll("#google-signin, #google-signup, #google-login").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://launchebookai.leostarearn.com/dashboard",
      },
    });

    if (error) {
      alert("❌ Google login failed: " + error.message);
    }
  });
});

// ✅ Magic Link Login
const magicForm = document.querySelector("#magic-login-form");

if (magicForm) {
  magicForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("magic-email").value.trim();
    const btn = magicForm.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Sending...";

    if (!email) {
      alert("❗ Please enter your email address.");
      btn.disabled = false;
      btn.textContent = "Send Magic Link";
      return;
    }

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
        client_id: "755135885950-a784v2qb5lcurno3k2p2qseg6692bfki.apps.googleusercontent.com", // Replace this
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
