// /description/ebook-form-handler.js
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
    // cover_upload: not stored in Supabase unless uploaded separately
  };

  // ✅ Save to Supabase
  const { error } = await supabase.from("ebooks").insert([payload]);
  if (error) {
    alert("❌ Failed to save eBook: " + error.message);
  } else {
    alert("✅ eBook created successfully!");
    form.reset();
  }
});
