import { supabase } from '/supabaseClient.js';

let currentUser = null;

// ✅ Fetch user session
const getUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    alert("Session expired. Please log in again.");
    window.location.href = "/login";
    return;
  }
  currentUser = session.user;
  document.getElementById("user-email").innerText = currentUser.email;
};

getUser();

// ✅ Sign out logic
window.signOut = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login";
};

// ✅ Form handling
const form = document.getElementById("ebook-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  // Auto-convert checkboxes to booleans
  const getBool = (key) => formData.get(key) === "on";

  // 📦 Final payload object
  const payload = {
    user_id: currentUser.id,
    title: formData.get("title") || "",
    topic: formData.get("topic") || "",
    description: formData.get("description") || "",
    author_name: formData.get("author_name") || "",
    audience: formData.get("audience") || "",
    tone: formData.get("tone") || "",
    purpose: formData.get("purpose") || "",
    language: formData.get("language") || "",
    font_type: formData.get("font_type") || "",
    font_size: parseInt(formData.get("font_size")) || null,
    headline_size: parseInt(formData.get("headline_size")) || null,
    subheadline_size: parseInt(formData.get("subheadline_size")) || null,
    line_spacing: parseFloat(formData.get("line_spacing")) || null,
    paragraph_spacing: parseFloat(formData.get("paragraph_spacing")) || null,
    text_alignment: formData.get("text_alignment") || "",
    page_size: formData.get("page_size") || "",
    total_pages: parseInt(formData.get("total_pages")) || null,
    margin_top: parseInt(formData.get("margin_top")) || null,
    margin_bottom: parseInt(formData.get("margin_bottom")) || null,
    margin_left: parseInt(formData.get("margin_left")) || null,
    margin_right: parseInt(formData.get("margin_right")) || null,
    cover_title: formData.get("cover_title") || "",
    with_images: getBool("with_images"),
    include_affiliate_links: getBool("include_affiliate_links"),
    cover_image: getBool("cover_image"),
    save_formatting_preset: getBool("save_formatting_preset")
    // Note: cover_upload not handled here
  };

  // ✅ Save to Supabase
  const { error } = await supabase.from("ebooks").insert([payload]);
  if (error) {
    alert("❌ Failed to save eBook: " + error.message);
  } else {
    document.getElementById("success-message").classList.remove("hidden");
  }
});

// ✅ Create Another – Reset form inputs (keep formatting)
window.createAnother = () => {
  const fieldsToReset = ["title", "topic", "description", "author_name", "cover_title", "cover_upload"];
  fieldsToReset.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById("with_images").checked = false;
  document.getElementById("include_affiliate_links").checked = false;
  document.getElementById("cover_image").checked = false;

  document.getElementById("success-message").classList.add("hidden");
  document.getElementById("title").focus();
};

// 📩 Send to Email
document.getElementById("send-email").addEventListener("click", async () => {
  const response = await fetch('/api/send-ebook-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUser.id, email: currentUser.email })
  });

  const result = await response.json();
  if (result.success) {
    alert("✅ eBook sent to your email!");
  } else {
    alert("❌ Failed to send email: " + result.error);
  }
});

// ⬇️ Download PDF
document.getElementById("download-pdf").addEventListener("click", async () => {
  const response = await fetch(`/api/download-pdf?user_id=${currentUser.id}`);
  if (!response.ok) {
    alert("❌ Failed to generate PDF");
    return;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "ebook.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
});
