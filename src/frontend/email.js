// ✅ Email Sending Module – CommonJS Version with Credit Check + User API Key Support

let currentUser = null;
const BASE_URL = location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://ebook-pdf-generator.onrender.com";

// 💌 Init Email Logic
window.initEmailSender = async function () {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.href = "/login";
  currentUser = session.user;

  const sendBtn = document.getElementById("sendEmailBtn");
  if (!sendBtn) return;

  sendBtn.addEventListener("click", sendEmailToUser);
};

// 📤 Send eBook to user email
async function sendEmailToUser() {
  const email = document.getElementById("recipientEmail").value.trim();
  const customMsg = document.getElementById("emailMessage").value.trim();
  const downloadUrl = window.generatedContent?.download_url;

  const apiKey = window.userApiKey || null;

  if (!email || !downloadUrl) {
    alert("❌ Please provide a valid email and generate the eBook first.");
    return;
  }

  showSpinner();

  try {
    const res = await fetch(`${BASE_URL}/send-ebook-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: currentUser.id,
        email,
        message: customMsg,
        download_url: downloadUrl,
        useOwnAPIKey: !!apiKey,
        apiKey
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Sending failed");

    showToast("✅ eBook emailed successfully");
  } catch (err) {
    alert("❌ " + err.message);
  }

  hideSpinner();
}

// 🔄 Helpers
function showSpinner() {
  document.getElementById("spinner")?.classList.remove("hidden");
}
function hideSpinner() {
  document.getElementById("spinner")?.classList.add("hidden");
}
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow z-50";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
