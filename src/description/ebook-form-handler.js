import { supabase } from '/supabaseClient.js';

let currentUser = null;

// ✅ LAUNCHBOOK CREDIT SYSTEM – Phase 1 & 2
// ------------------------------------------

// ✅ Credit cost per action
const CREDIT_COSTS = {
  generate_pdf: 3,
  generate_epub: 4,
  regen_pdf: 2,
  regen_image: 2,
  generate_from_url: 5
};

// ✅ Fetch user credits from Supabase users_plan table
async function getUserCredits(userId) {
  const { data, error } = await supabase
    .from("users_plan")
    .select("credit_limit, credits_used")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("❌ Failed to fetch user credits:", error.message);
    return null;
  }

  return data;
}

// ✅ Check if user has enough credits for the action
async function checkCredits(userId, actionType) {
  const cost = CREDIT_COSTS[actionType] || 0;
  const plan = await getUserCredits(userId);

  if (!plan) return false;

  if ((plan.credits_used + cost) > plan.credit_limit) {
    alert(`🚫 Not enough credits! Action requires ${cost}, you have ${plan.credit_limit - plan.credits_used} left.`);
    return false;
  }

  return true;
}

// ✅ Deduct credits and log usage (Supabase)
async function logUsage(userId, email, actionType, details = {}) {
  const cost = CREDIT_COSTS[actionType] || 0;

  const { error: logError } = await supabase.from("user_usage_logs").insert({
    user_id: userId,
    email,
    action_type: actionType,
    credits_used: cost,
    metadata: details,
  });

  if (logError) console.error("❌ Failed to log usage:", logError.message);

  // ✅ Increment credit counter
  const { error: updateError } = await supabase.rpc("increment_credits_used", {
    p_user_id: userId,
    p_increment: cost
  });

  if (updateError) console.error("❌ Failed to update credits used:", updateError.message);
}

// ✅ Display credits on dashboard (HTML ID: #user-credits)
async function showUserCredits() {
  const userCredits = await getUserCredits(currentUser.id);

  if (!userCredits) {
    document.getElementById("user-credits").innerText = `0 / 0 credits`;
    return;
  }

  const left = userCredits.credit_limit - userCredits.credits_used;
  document.getElementById("user-credits").innerText = `${left} / ${userCredits.credit_limit} credits left`;
}

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
  // ✅ Show available credits after user loads
showUserCredits();

// ✅ Load previous eBooks
loadPreviousEbooks();
loadCoverHistory();

};

getUser();

// ✅ Sign out
window.signOut = async () => {
  try {
    await supabase.auth.signOut();
    window.location.href = "/login";
  } catch (err) {
    alert("Error during sign out");
    console.error(err);
  }
};


// ✅ Show live preview when user uploads a cover image
const coverUploadInput = document.getElementById("cover_upload");
const previewImg = document.getElementById("cover-preview");
const previewContainer = document.getElementById("cover-preview-container");

coverUploadInput.addEventListener("change", async () => {
  const file = coverUploadInput.files[0];
  if (file) {
    // Live preview
    previewImg.src = URL.createObjectURL(file);
    previewContainer.classList.remove("hidden");

    // ✅ Auto-upload
    if (file.size > 10 * 1024 * 1024) {
      alert("❌ Image too large! Max 10MB.");
      return;
    }

    const uploaded = await uploadCoverImageToSupabase(currentUser.id, file, false);
    if (!uploaded) {
      alert("❌ Failed to upload image.");
      return;
    }

    uploadedCoverPath = uploaded.path;
    document.getElementById("delete-cover-btn").classList.remove("hidden");
    alert("✅ Cover image uploaded!");
  } else {
    previewImg.src = "";
    previewContainer.classList.add("hidden");
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
if (!(await checkCredits(currentUser.id, "generate_pdf"))) {
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

    const uploaded = await uploadCoverImageToSupabase(currentUser.id, coverFile, false); // isAI = false
    document.getElementById("delete-cover-btn").classList.remove("hidden");
    uploadedCoverPath = uploaded.path; // store for deletion if needed


if (!uploaded) {
  alert("❌ Failed to upload cover image.");
  submitBtn.disabled = false;
  submitBtn.innerText = "🚀 Generate eBook";
  progressBar.classList.add("hidden");
  return;
}

coverUrl = uploaded.url;
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
    cover_url: coverUrl,
    cover_image_type: uploaded?.type || "user",  // 👈 Add this
    cover_image_path: uploaded?.path || "",  // 👈 And this
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
  
  await logUsage(currentUser.id, currentUser.email, "generate_pdf", {
  pages: payload.total_pages,
  format: "pdf",
  with_images: payload.with_images
});

showUserCredits(); // refresh UI credits


  document.getElementById("regenerate-pdf").classList.remove("hidden");
  
  if (payload.cover_image) {
  document.getElementById("regenerate-image").classList.remove("hidden");
}
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
  uploadedCoverPath = "";

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
    const res = await fetch(`${BASE_URL}/api/send-ebook-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        email: currentUser.email
      })
    });

    const result = await res.json();

    if (result.success) {
      alert("📧 eBook sent to your email!");
      hasEmailed = true;

      // ✅ Optional: Disable regeneration buttons after email
      document.getElementById("regenerate-pdf").disabled = true;
      document.getElementById("regenerate-image").disabled = true;
    } else {
      alert("❌ Failed to send email: " + result.error);
    }
  } catch (err) {
    alert("❌ Email error: " + err.message);
  }
});


   // 🔁 Regenerate PDF Button logic with limit
let regenCount = 0;
const regenLimit = 3;
let hasDownloaded = false;
let hasEmailed = false;

// Mark if downloaded (your download code should set this to true)
document.getElementById("download-pdf")?.addEventListener("click", () => {
  hasDownloaded = true;

  // ✅ Disable regenerate buttons
  document.getElementById("regenerate-pdf").disabled = true;
  document.getElementById("regenerate-image").disabled = true;
});

document.getElementById("regenerate-pdf")?.addEventListener("click", async () => {
  const regenBtn = document.getElementById("regenerate-pdf");
  
    // ✅ Credit check before regenerating PDF
  if (!(await checkCredits(currentUser.id, "regen_pdf"))) {
    return;
  }


  if (hasDownloaded || hasEmailed) {
    alert("⚠️ You’ve already downloaded or emailed this file. Regeneration is disabled.");
    return;
  }

  if (regenCount >= regenLimit) {
    alert("🚫 Regeneration limit reached. Upgrade your plan to unlock more regenerations.");
    regenBtn.disabled = true;
    return;
  }

  // ✅ Show visual loading state
  regenBtn.disabled = true;
  regenBtn.innerText = "⏳ Regenerating...";

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
      
            // ✅ Log credit usage for regen_pdf
      await logUsage(currentUser.id, currentUser.email, "regen_pdf", {
        tweaks: true
      });
      showUserCredits(); // update UI

      alert(`✅ Regenerated! (${regenLimit - regenCount} tries left)`);
      document.getElementById("pdf-preview").querySelector("iframe").src = result.preview_url;
      document.getElementById("pdf-preview").classList.remove("hidden");

      if (regenCount >= regenLimit) {
        regenBtn.disabled = true;
      }
    } else {
      alert("❌ Failed to regenerate: " + result.error);
    }
  } catch (err) {
    alert("❌ Regeneration error: " + err.message);
  } finally {
    regenBtn.innerText = "🔁 Regenerate PDF";
    regenBtn.disabled = regenCount >= regenLimit;
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

let imageRegenCount = 0;
const imageRegenLimit = 3;

document.getElementById("regenerate-image")?.addEventListener("click", async () => {
  const imageBtn = document.getElementById("regenerate-image");
  
    // ✅ Credit check before regenerating image
  if (!(await checkCredits(currentUser.id, "regen_image"))) {
    return;
  }

  if (hasDownloaded || hasEmailed) {
    alert("❌ You’ve already downloaded or emailed this file. Image regeneration is disabled.");
    return;
  }

  if (imageRegenCount >= imageRegenLimit) {
    alert("🚫 Image regeneration limit reached. Upgrade your plan to unlock more.");
    imageBtn.disabled = true;
    return;
  }

  // ✅ Show spinner state
  imageBtn.disabled = true;
  imageBtn.innerText = "⏳ Creating image...";

  try {
    const response = await fetch(`${BASE_URL}/api/regenerate-cover-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: currentUser.id,
        email: currentUser.email
      })
    });

    const result = await response.json();

    if (result.success) {
      imageRegenCount++;
            // ✅ Log credit usage for regen_image
      await logUsage(currentUser.id, currentUser.email, "regen_image", {
        tweaks: true
      });
      showUserCredits(); // update UI
      alert(`✅ New image added! (${imageRegenLimit - imageRegenCount} tries left)`);
      document.getElementById("pdf-preview").querySelector("iframe").src = result.preview_url;

      if (imageRegenCount >= imageRegenLimit) {
        imageBtn.disabled = true;
      }
    } else {
      alert("❌ Failed to regenerate image: " + result.error);
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  } finally {
    imageBtn.innerText = "🎨 Regenerate Cover";
    imageBtn.disabled = imageRegenCount >= imageRegenLimit;
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
// 📦 FRONTEND: Upload cover image (user uploaded OR AI generated)
// This works for both: manual uploads & AI-generated images
export async function uploadCoverImageToSupabase(userId, file, isAI = false) {
  const bucket = 'user_files';
  const folder = isAI ? 'ai_generated_covers' : 'user_uploaded_covers';
  const ext = file.name.split('.').pop();
  const filename = `${isAI ? 'ai' : 'user'}_cover_${Date.now()}.${ext}`;
  const filePath = `${folder}/${userId}/${filename}`;

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: 'image/png',
    upsert: true
  });

  if (error) {
    console.error('Upload failed:', error);
    return null;
  }

  const { data: urlData } = await supabase.storage.from(bucket).getPublicUrl(filePath);
  await supabase.from("cover_history").insert({
  user_id: userId,
  cover_url: urlData.publicUrl,
  cover_path: filePath,
  type: isAI ? 'ai' : 'user'
});
  
  return {
    url: urlData.publicUrl,
    path: filePath,
    type: isAI ? 'ai' : 'user'
  };
}

let uploadedCoverPath = ""; // store uploaded image path temporarily

window.deleteCoverImage = async () => {
  if (!uploadedCoverPath) {
    alert("No cover image to delete.");
    return;
  }

  const confirmDelete = confirm("Are you sure you want to delete this cover image?");
  if (!confirmDelete) return;

  const { error } = await supabase.storage
    .from("user_files")
    .remove([uploadedCoverPath]);

  if (error) {
    console.error("❌ Failed to delete cover:", error.message);
    alert("Failed to delete cover image.");
    return;
  }

  // ✅ Reset preview and hide
  uploadedCoverPath = "";
  coverUploadInput.value = "";
  previewImg.src = "";
  previewContainer.classList.add("hidden");

  // ✅ Hide delete button
  document.getElementById("delete-cover-btn").classList.add("hidden");

  alert("✅ Cover image deleted successfully.");
};
async function loadCoverHistory() {
  const { data, error } = await supabase
    .from("cover_history")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error loading cover history:", error.message);
    return;
  }

  if (!data.length) return;

  const container = document.getElementById("cover-history-container");
  const grid = document.getElementById("cover-history-grid");
  container.classList.remove("hidden");

  data.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "relative";

    const thumb = document.createElement("img");
    thumb.src = item.cover_url;
    thumb.alt = "Cover";
    thumb.className = "w-full h-auto border cursor-pointer hover:scale-105 transition rounded";

    // ✅ Reuse this cover on click
    thumb.addEventListener("click", () => {
      previewImg.src = item.cover_url;
      previewContainer.classList.remove("hidden");
      uploadedCoverPath = item.cover_path;

      // Show delete button only for user uploaded ones
      if (item.type === "user") {
        document.getElementById("delete-cover-btn").classList.remove("hidden");
      } else {
        document.getElementById("delete-cover-btn").classList.add("hidden");
      }

      alert("✅ Cover applied!");
    });

    // 🗑️ Delete icon
    const delBtn = document.createElement("button");
    delBtn.innerHTML = "❌";
    delBtn.className = "absolute top-1 right-1 text-xs bg-white rounded px-1 shadow";
    delBtn.title = "Delete this cover";

    delBtn.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent triggering the click on image

      const confirmDel = confirm("❌ Delete this cover from your history?");
      if (!confirmDel) return;

      // Delete from Supabase storage
      const { error: storageErr } = await supabase.storage
        .from("user_files")
        .remove([item.cover_path]);

      if (storageErr) {
        alert("❌ Failed to delete from storage.");
        console.error(storageErr);
        return;
      }

      // Delete from cover_history
      const { error: dbErr } = await supabase
        .from("cover_history")
        .delete()
        .eq("id", item.id);

      if (dbErr) {
        alert("❌ Failed to delete from history.");
        console.error(dbErr);
        return;
      }

      // Remove from UI
      wrapper.remove();
      alert("✅ Cover deleted.");
    });

    wrapper.appendChild(thumb);
    wrapper.appendChild(delBtn);
    grid.appendChild(wrapper);
  });
}

