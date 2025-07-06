import { supabase } from '/supabaseClient.js';

let currentUser = null;

// ✅ Get user session
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

// ✅ Sign out
window.signOut = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login";
};

// ✅ Form submission
const form = document.getElementById("ebook-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const getBool = (key) => formData.get(key) === "on";

  // ✅ Cover image upload check
  let coverUrl = "";
  const fileInput = document.getElementById("cover_upload");
  const coverFile = fileInput?.files?.[0];

  if (coverFile) {
    // Check size limit (15MB)
    if (coverFile.size > 15 * 1024 * 1024) {
      alert("❌ Cover image too large! Max allowed is 5MB.");
      return;
    }

    const filePath = `user_uploads/${currentUser.id}-${Date.now()}-${coverFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("ebook-covers")
      .upload(filePath, coverFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      alert("❌ Failed to upload cover image: " + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from("ebook-covers")
      .getPublicUrl(filePath);

    coverUrl = publicUrl;
  }

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
    save_formatting_preset: getBool("save_formatting_preset"),
    cover_url: coverUrl
  };

  const { error } = await supabase.from("ebooks").insert([payload]);
  if (error) {
    alert("❌ Failed to save eBook: " + error.message);
  } else {
    document.getElementById("success-message").classList.remove("hidden");
  }
});

// ✅ Create Another — resets only core input fields
window.createAnother = () => {
  const resetIds = [
    "title", "topic", "description", "author_name", "cover_title", "cover_upload"
  ];
  resetIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById("with_images").checked = false;
  document.getElementById("include_affiliate_links").checked = false;
  document.getElementById("cover_image").checked = false;

  document.getElementById("success-message").classList.add("hidden");
  document.getElementById("title").focus();
};

// 📩 Send to Email (when ready)
document.getElementById("send-email")?.addEventListener("click", async () => {
  const response = await fetch('/api/send-ebook-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUser.id, email: currentUser.email })
  });
  const result = await response.json();
  alert(result.success ? "✅ eBook sent to your email!" : "❌ Failed: " + result.error);
});

// ⬇️ Download PDF (when ready)
document.getElementById("download-pdf")?.addEventListener("click", async () => {
  const response = await fetch(`/api/download-pdf?user_id=${currentUser.id}`);
  if (!response.ok) return alert("❌ Failed to download PDF");

  const blob = await response.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ebook.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
});
