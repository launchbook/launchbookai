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

// ✅ Load previous eBooks
loadPreviousEbooks();
};

getUser();

// ✅ Sign out
window.signOut = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login";
};

// ✅ Show live preview when user uploads a cover image
const coverUploadInput = document.getElementById("cover_upload");
const previewImg = document.getElementById("cover-preview");
const previewContainer = document.getElementById("cover-preview-container");

coverUploadInput.addEventListener("change", () => {
  const file = coverUploadInput.files[0];
  if (file) {
    previewImg.src = URL.createObjectURL(file); // Show selected image
    previewContainer.classList.remove("hidden"); // Show container
  } else {
    previewImg.src = "";
    previewContainer.classList.add("hidden"); // Hide if nothing selected
  }
});

// ✅ Remove image preview and reset input
window.removeCoverImage = () => {
  coverUploadInput.value = ""; // Clear file
  previewImg.src = "";
  previewContainer.classList.add("hidden");
};



// ✅ Form submission
const form = document.getElementById("ebook-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = form.querySelector("button[type='submit']");
  const progressBar = document.getElementById("progress-bar");
  submitBtn.disabled = true;
  submitBtn.innerText = "⏳ Generating...";
  progressBar.classList.remove("hidden");

  const formData = new FormData(form);
  const getBool = (key) => formData.get(key) === "on";

  const title = formData.get("title");
  const audience = formData.get("audience");

  if (!title || !audience) {
    alert("❌ Please fill out both Title and Audience fields.");
    submitBtn.disabled = false;
    submitBtn.innerText = "🚀 Generate eBook";
    progressBar.classList.add("hidden");
    return;
  }

  // ✅ Cover image upload check
  let coverUrl = "";
  const coverFile = document.getElementById("cover_upload")?.files?.[0];

  if (coverFile) {
    if (coverFile.size > 10 * 1024 * 1024) {
      alert("❌ Cover image too large! Max allowed is 10MB.");
      submitBtn.disabled = false;
      submitBtn.innerText = "🚀 Generate eBook";
      progressBar.classList.add("hidden");
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
      submitBtn.disabled = false;
      submitBtn.innerText = "🚀 Generate eBook";
      progressBar.classList.add("hidden");
      return;
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from("ebook-covers")
      .getPublicUrl(filePath);

    coverUrl = publicUrl;
  }

  // ✅ Build final payload
  const payload = {
    user_id: currentUser.id,
    title,
    topic: formData.get("topic") || "",
    description: formData.get("description") || "",
    author_name: formData.get("author_name") || "",
    audience,
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
  progressBar.classList.add("hidden");

  if (error) {
    alert("❌ Failed to save eBook: " + error.message);
    submitBtn.disabled = false;
    submitBtn.innerText = "🚀 Generate eBook";
    return;
  }

  document.getElementById("success-message").classList.remove("hidden");
  submitBtn.innerText = "✅ Done!";
  document.getElementById("regenerate-pdf").classList.remove("hidden");
  setTimeout(() => {
    submitBtn.innerText = "🚀 Generate eBook";
    submitBtn.disabled = false;
  }, 2000);
});

// ✅ Create Another — resets only core input fields
window.createAnother = () => {
  const resetIds = [
    "title", "topic", "description", "author_name", "cover_title"
  ];
  resetIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById("with_images").checked = false;
  document.getElementById("include_affiliate_links").checked = false;
  document.getElementById("cover_image").checked = false;

  // ✅ Reset preview and file input
  previewImg.src = "";
  previewContainer.classList.add("hidden");
  coverUploadInput.value = null;

  document.getElementById("success-message").classList.add("hidden");
  document.getElementById("title").focus();
};

// 🧠 Smart Base URL — switch between local and Render
const BASE_URL = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://ebook-pdf-generator.onrender.com';

// 📩 Send to Email (when ready)
document.getElementById("send-email")?.addEventListener("click", async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/send-ebook-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        email: currentUser.email
      })
    });

   // 🔁 Regenerate PDF Button logic with limit
let regenCount = 0;
const regenLimit = 3;
let hasDownloaded = false;
let hasEmailed = false;

// Mark if downloaded (your download code should set this to true)
document.getElementById("download-pdf")?.addEventListener("click", () => {
  hasDownloaded = true;
});

// Mark if emailed (your email button already exists)
document.getElementById("send-email")?.addEventListener("click", () => {
  hasEmailed = true;
});

document.getElementById("regenerate-pdf")?.addEventListener("click", async () => {
  if (hasDownloaded || hasEmailed) {
    alert("⚠️ You’ve already downloaded or emailed this file. Regeneration is disabled.");
    return;
  }

  if (regenCount >= regenLimit) {
    alert("🚫 Regeneration limit reached. Upgrade your plan to unlock more regenerations.");
    document.getElementById("regenerate-pdf").disabled = true;
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/regenerate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        email: currentUser.email,
        tweaks: true
      })
    });

    const result = await response.json();

    if (result.success) {
      regenCount++;
      alert(`✅ Regenerated! (${regenLimit - regenCount} tries left)`);
      document.getElementById("pdf-preview").querySelector("iframe").src = result.preview_url;
      document.getElementById("pdf-preview").classList.remove("hidden");

      if (regenCount >= regenLimit) {
        document.getElementById("regenerate-pdf").disabled = true;
      }
    } else {
      alert("❌ Failed to regenerate: " + result.error);
    }
  } catch (err) {
    alert("❌ Regeneration error: " + err.message);
  }
});


// ⬇️ Download PDF (when ready)
document.getElementById("download-pdf")?.addEventListener("click", async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/download-pdf?user_id=${currentUser.id}`);
    if (!response.ok) return alert("❌ Failed to download PDF");

    const blob = await response.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ebook.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    alert("❌ Error downloading PDF: " + err.message);
  }
});

// ✅ Fetch and display previous eBooks
const loadPreviousEbooks = async () => {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from("generated_files")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching previous eBooks:", error.message);
    return;
  }

  if (data.length === 0) return;

  const listContainer = document.getElementById("ebook-list");
  const section = document.getElementById("previous-ebooks");
  section.classList.remove("hidden");

  data.forEach((file) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="border px-3 py-2">${file.title || '-'}</td>
      <td class="border px-3 py-2">${file.topic || '-'}</td>
      <td class="border px-3 py-2">${file.language || '-'}</td>
      <td class="border px-3 py-2">${file.audience || '-'}</td>
      <td class="border px-3 py-2">${file.tone || '-'}</td>
      <td class="border px-3 py-2">${file.purpose || '-'}</td>
      <td class="border px-3 py-2">${new Date(file.created_at).toLocaleString()}</td>
      <td class="border px-3 py-2 text-right">
        <a href="${file.download_url}" target="_blank" class="text-blue-600 underline hover:text-blue-800">Download</a>
      </td>
    `;
    listContainer.appendChild(row);
  });
};
