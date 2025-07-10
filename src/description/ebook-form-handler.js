import { supabase } from '/supabaseClient.js';

async function refreshUserCredits() {
  if (!currentUser?.id) return;
  await showUserCredits();
}

let currentUser = null;

// ✅ LAUNCHBOOK CREDIT SYSTEM – Phase 1 & 2
// ------------------------------------------

// ✅ Final Phase 4 — Dynamic Credit Estimation Functions
function estimateCreditCost({ 
  wordCount = 0, 
  imageCount = 0, 
  withCover = false, 
  isRegeneration = false 
}) {
  const base = Math.ceil(wordCount / 200) * 40; // 40 credits per 200 words
  const imageCost = imageCount * 120;
  const coverCost = withCover ? 300 : 0;
  const regenPenalty = 0; // ❌ Removed based on your decision

  const total = base + imageCost + coverCost + regenPenalty;
  const floor = isRegeneration ? 500 : 1000;
  return Math.max(total, floor);
}
function showCreditEstimate({ wordCount, imageCount, withCover, isRegeneration }) {
  const estimated = estimateCreditCost({ wordCount, imageCount, withCover, isRegeneration });
  document.getElementById("credit-estimate-msg").textContent = `Estimated credits: ${estimated}`;
}
function estimateCoverImageCost({ style = "default" }) {
  return 300; // Flat for now
}

function estimateURLConversionCost({ wordCount = 0, imageCount = 0 }) {
  const base = Math.ceil(wordCount / 200) * 40;
  const images = imageCount * 120;
  return Math.max(base + images, 800); // Floor of 800
}

function estimateEmailCost() {
  return 30;
}


// ✅ Fetch user credits from Supabase users_plan table
async function getUserCredits(userId) {
  const { data, error } = await supabase
    .from("users_plan")
    .select("credit_limit, credits_used, is_active, plan_type")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("❌ Failed to fetch user credits:", error.message);
    return null;
  }

  return data;
}

// ✅ Phase 4 – Dynamic Credit Estimation System

function estimateCreditCost({ 
  wordCount = 0, 
  imageCount = 0, 
  withCover = false, 
  isRegeneration = false 
}) {
  const base = Math.ceil(wordCount / 200) * 40;
  const imageCost = imageCount * 120;
  const coverCost = withCover ? 300 : 0;
  const regenPenalty = 0; // ❌ Removed as per latest decision

  const total = base + imageCost + coverCost + regenPenalty;
  const floor = isRegeneration ? 500 : 1000;
  return Math.max(total, floor);
}

function estimateCoverImageCost({ style = "default" }) {
  return 300; // Static for now
}

function estimateURLConversionCost({ wordCount = 0, imageCount = 0 }) {
  const base = Math.ceil(wordCount / 200) * 40;
  const images = imageCount * 120;
  return Math.max(base + images, 800); // 800 floor
}

function estimateEmailCost() {
  return 30;
}


// ✅ Check if user has enough credits for the action
// ✅ Check if user has enough credits for a dynamic action
async function checkCredits(userId, costEstimate) {
  const plan = await getUserCredits(userId);

  // ⛔ Block if no plan or inactive
  if (!plan || !plan.is_active) {
    alert("❌ Your plan is inactive or expired. Please upgrade to continue.");
    return false;
  }

  const remaining = plan.credit_limit - plan.credits_used;

  if (costEstimate > remaining) {
    alert(`❌ Not enough credits. You need ${costEstimate} credits, but have only ${remaining}.`);
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
  if (!currentUser?.id) return;
  
  const creditBox = document.getElementById("user-credits");
creditBox.innerHTML = "⏳ Loading your credits...";  // ✨ Instant feedback
  
  const userCredits = await getUserCredits(currentUser.id);
  
  const left = userCredits.credit_limit - userCredits.credits_used;
  const percentUsed = Math.min(100, Math.round((userCredits.credits_used / userCredits.credit_limit) * 100));

  // ✅ Handle expired plan
  if (!userCredits || !userCredits.is_active) {
    creditBox.innerHTML = `
      ❌ No active plan.
      <a href="/pricing" class="ml-2 text-blue-600 underline">Upgrade Plan</a>
    `;
    return;
  }

  // ✅ Determine if upgrade link needed
  const canUpgrade = !["pro", "agency"].includes(userCredits.plan_name?.toLowerCase());
  const upgradeLink = canUpgrade
    ? `<a href="/pricing" class="ml-2 text-blue-600 underline">Upgrade Plan</a>`
    : "";

  // ✅ Show progress bar with red warning if 80%+ used
  creditBox.innerHTML = `
    <div class="mb-1 text-sm">
      🔋 ${left} / ${userCredits.credit_limit} credits left
      <span class="text-xs text-gray-500">(${percentUsed}% used)</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div class="${percentUsed >= 80 ? 'bg-red-500' : 'bg-blue-500'} h-2 rounded-full" style="width: ${percentUsed}%"></div>
    </div>
    ${upgradeLink}
  `;
}

  const left = userCredits.credit_limit - userCredits.credits_used;

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
refreshUserCredits();
  
const plan = await getUserCredits(currentUser.id);
if (!plan?.is_active) {
  alert("❌ Your plan has expired. Please renew to access eBook creation.");
  window.location.href = "/pricing";
  return;
}

  
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

  // ✅ Get dynamic credit estimate
  const wordCount = (formData.get("description") || "").trim().split(/\s+/).length;
  const imageCount = parseInt(formData.get("image-count")) || 0;
  const withCover = formData.get("cover_image") === "on";

  const costEstimate = estimateCreditCost({ wordCount, imageCount, withCover, isRegeneration: false });

  // ✅ Dynamic credit check
  if (!(await checkCredits(currentUser.id, costEstimate))) {
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

    const uploaded = await uploadCoverImageToSupabase(currentUser.id, coverFile, false);
    document.getElementById("delete-cover-btn").classList.remove("hidden");
    uploadedCoverPath = uploaded.path;

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

refreshUserCredits(); // refresh UI credits


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

document.getElementById("send-email")?.addEventListener("click", async () => {
  const emailBtn = document.getElementById("send-email");
  emailBtn.disabled = true;
  emailBtn.innerText = "⏳ Sending...";

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

      // ✅ Disable regeneration buttons after email
      document.getElementById("regenerate-pdf").disabled = true;
      document.getElementById("regenerate-image").disabled = true;
    } else {
      alert("❌ Failed to send email: " + result.error);
    }

    // ✅ Restore email button state
    emailBtn.innerText = "📩 Send to Email";
    emailBtn.disabled = false;

  } catch (err) {
    alert("❌ Email error: " + err.message);

    // ✅ Restore on error too
    emailBtn.innerText = "📩 Send to Email";
    emailBtn.disabled = false;
  }
});

   // 🔁 Regenerate PDF Button logic with limit
let hasDownloaded = false;
let hasEmailed = false;

// Mark if downloaded (your download code should set this to true)
document.getElementById("download-pdf")?.addEventListener("click", () => {
  hasDownloaded = true;

  // ✅ Disable regenerate buttons
  document.getElementById("regenerate-pdf").disabled = true;
  document.getElementById("regenerate-image").disabled = true;
});
  
  // ✅ Show visual loading state
  document.getElementById("regenerate-pdf")?.addEventListener("click", async () => {
  const regenBtn = document.getElementById("regenerate-pdf");

  // ✅ Check credits before regenerating PDF
  if (!(await checkCredits(currentUser.id, "regen_pdf"))) return;

  if (hasDownloaded || hasEmailed) {
    alert("❌ You’ve already downloaded or emailed this file. PDF regeneration is disabled.");
    return;
  }

  // ✅ Show visual loading state
  regenBtn.disabled = true;
  regenBtn.innerText = "⏳ Regenerating...";

  try {
    const response = await fetch(`${BASE_URL}/api/regenerate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: currentUser.id,
        email: currentUser.email,
        tweaks: true
      })
    });

    const result = await response.json();

    if (result.success) {
      await logUsage(currentUser.id, currentUser.email, "regen_pdf", { tweaks: true });

      await supabase.rpc("increment_regen_pdf_count", {
        p_user_id: currentUser.id,
        p_increment: 1
      });

      refreshUserCredits(); // ✅ update credit display

      alert("✅ PDF regenerated successfully!");
      document.getElementById("pdf-preview").querySelector("iframe").src = result.preview_url;
      document.getElementById("pdf-preview").classList.remove("hidden");
    } else {
      alert("❌ Failed to regenerate: " + result.error);
    }
  } catch (err) {
    alert("❌ Regeneration error: " + err.message);
  } finally {
    regenBtn.disabled = false;
    regenBtn.innerText = "🔁 Regenerate PDF";
    regenBtn.title = "";
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

document.getElementById("regenerate-image")?.addEventListener("click", async () => {
  const imageBtn = document.getElementById("regenerate-image");

  // ✅ Credit check before regenerating image
  if (!(await checkCredits(currentUser.id, "regen_image"))) return;

  if (hasDownloaded || hasEmailed) {
    alert("❌ You’ve already downloaded or emailed this file. Image regeneration is disabled.");
    return;
  }

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
      await logUsage(currentUser.id, currentUser.email, "regen_image", { tweaks: true });

      await supabase.rpc("increment_regen_image_count", {
        p_user_id: currentUser.id,
        p_increment: 1
      });

      refreshUserCredits();
      document.getElementById("pdf-preview").querySelector("iframe").src = result.preview_url;
      alert("✅ New image added!");
    } else {
      alert("❌ Failed to regenerate image: " + result.error);
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  } finally {
    imageBtn.disabled = false;
    imageBtn.innerText = "🎨 Regenerate Image";
    imageBtn.title = "";
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

// ✅ Top-up Credits and Extend Plan by 30 Days
async function topUpCredits(extraCredits = 50) {
  if (!currentUser?.id) return;
  const plan = await getUserCredits(currentUser.id);

  // ⛔ Block if plan is expired
  if (!plan?.is_active) {
    alert("❌ Cannot add credits. Your plan is expired. Please upgrade instead.");
    window.location.href = "/pricing";
    return;
  }

  const { error } = await supabase.rpc("add_credits_and_extend", {
    p_user_id: currentUser.id,
    p_credits: extraCredits
  });

  if (error) {
    alert("❌ Failed to add credits: " + error.message);
    return;
  }

  // ✅ Log top-up
  await supabase.from("user_usage_logs").insert({
    user_id: currentUser.id,
    email: currentUser.email,
    action_type: "topup",
    credits_used: 0,
    metadata: { added_credits: extraCredits }
  });

  alert(`✅ ${extraCredits} credits added! Plan extended by 30 days.`);
  refreshUserCredits(); // refresh UI
}

await supabase.from("user_usage_logs").insert({
  user_id: currentUser.id,
  email: currentUser.email,
  action_type: "topup",
  credits_used: 0,
  metadata: { added_credits: extraCredits }
});

// ✅ Show "My Plan" details popup

async function showMyPlanModal() {
  if (!currentUser?.id) return;
  const plan = await getUserCredits(currentUser.id);
  if (!plan) {
    alert("❌ Failed to load your plan.");
    return;
  }

  const total = plan.credit_limit || 0;
  const used = plan.credits_used || 0;
  const left = total - used;
let badge = "";
if (plan.plan_type === "lifetime") badge = "🌟 Lifetime";
else if (plan.plan_type === "annual") badge = "📅 12-Month Plan";
else if (plan.plan_type === "monthly") badge = "📆 Monthly Plan";
else if (plan.plan_type === "trial") badge = "🧪 Trial Plan";
  const now = new Date();
  let warning = "";
  let daysLeftText = "";
  
  // ✅ Use fallbacks in case dates are null
  const start = plan.start_date ? new Date(plan.start_date) : null;
  const end = plan.end_date ? new Date(plan.end_date) : null;

  if (plan.plan_type !== "lifetime" && start && end) {
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    daysLeftText = `🌒 ${diff} day${diff === 1 ? '' : 's'} left in your plan`;

    if (diff <= 3) {
      warning = `<p class="text-red-600 mt-2 font-medium">⚠️ Your plan ends in ${diff} day${diff === 1 ? '' : 's'}!</p>`;
    }
  }

  const container = document.getElementById("my-plan-container");
  if (!container) {
    alert("⚠️ Plan container not found in HTML.");
    return;
  }

  container.innerHTML = `
    <p><strong>Plan:</strong> ${plan.plan_name || "Unknown"} ${badge}</p>
    <p><strong>Status:</strong> ${plan.is_active ? "✅ Active" : "❌ Expired"}</p>
    <p><strong>Credits:</strong> ${left} / ${total}</p>
    ${plan.plan_type !== "trial" && start && end ? `<div class="text-sm text-gray-400 mt-1"> Active from <strong>${formatDate(start)}</strong> to <strong>${formatDate(end)}</strong>
  </div> : ""}</p>
      <p><strong>End:</strong> ${end.toDateString()}</p>
      <p>${daysLeftText}</p>
      ${warning}
    ` : ""}
    <div class="mt-4">
      <button onclick="topUpCredits(50)" class="text-blue-600 underline">🔁 Add More Credits</button>
    </div>
  `;

  // ✅ Show modal (you can style this yourself)
  document.getElementById("my-plan-modal").classList.remove("hidden");
}
// 👇 Wait for DOM content before attaching listeners
document.addEventListener("DOMContentLoaded", () => {
  const descriptionInput = document.getElementById("description");
  const imageSelect = document.getElementById("image-count");
  const coverCheckbox = document.getElementById("include-cover");

  const updateEstimate = () => {
    const text = descriptionInput.value;
    const wordCount = text.trim().split(/\s+/).length;
    const imageCount = parseInt(imageSelect.value || 0);
    const withCover = coverCheckbox.checked;

    showCreditEstimate({ wordCount, imageCount, withCover, isRegeneration: false });
  };

  descriptionInput.addEventListener("input", updateEstimate);
  imageSelect.addEventListener("change", updateEstimate);
  coverCheckbox.addEventListener("change", updateEstimate);

  // 👇 Show estimate on initial load
  updateEstimate();
});

                      // ✅ LAUNCHBOOK CREDIT SYSTEM – Phase 4: Credit-Based Regeneration Only

// 🔁 Regeneration Settings (Remove Free Limit)
const regenBtn = document.getElementById("regenerate-pdf");
const imageBtn = document.getElementById("regenerate-image");

// PDF Regeneration
regenBtn?.addEventListener("click", async () => {
  if (!(await checkCredits(currentUser.id, CREDIT_COSTS.regen_pdf))) return;
  if (hasDownloaded || hasEmailed) return alert("⚠️ Regeneration disabled after download/email.");

  regenBtn.disabled = true;
  regenBtn.innerText = "⏳ Regenerating...";

  try {
    const res = await fetch(`${BASE_URL}/api/regenerate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id, email: currentUser.email })
    });
    const result = await res.json();

    if (result.success) {
      await logUsage(currentUser.id, currentUser.email, "regen_pdf", {});
      await supabase.rpc("increment_credits_used", { p_user_id: currentUser.id, p_increment: CREDIT_COSTS.regen_pdf });
      document.getElementById("pdf-preview").querySelector("iframe").src = result.preview_url;
      document.getElementById("pdf-preview").classList.remove("hidden");
      alert("✅ Regenerated!");
    } else {
      alert("❌ Failed: " + result.error);
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  } finally {
    regenBtn.disabled = false;
    regenBtn.innerText = "🔁 Regenerate PDF";
  }
});

// Image Regeneration
imageBtn?.addEventListener("click", async () => {
  if (!(await checkCredits(currentUser.id, CREDIT_COSTS.regen_image))) return;
  if (hasDownloaded || hasEmailed) return alert("⚠️ Image regen disabled after download/email.");

  imageBtn.disabled = true;
  imageBtn.innerText = "⏳ Creating image...";

  try {
    const res = await fetch(`${BASE_URL}/api/regenerate-cover-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id, email: currentUser.email })
    });
    const result = await res.json();

    if (result.success) {
      await logUsage(currentUser.id, currentUser.email, "regen_image", {});
      await supabase.rpc("increment_credits_used", { p_user_id: currentUser.id, p_increment: CREDIT_COSTS.regen_image });
      document.getElementById("pdf-preview").querySelector("iframe").src = result.preview_url;
      document.getElementById("pdf-preview").classList.remove("hidden");
      alert("✅ New image added!");
    } else {
      alert("❌ Failed: " + result.error);
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  } finally {
    imageBtn.disabled = false;
    imageBtn.innerText = "🎨 Regenerate Image";
  }
});

// 🔒 CREDIT_COSTS Map
const CREDIT_COSTS = {
  generate_pdf: 1000,     // base
  regen_pdf: 500,
  regen_image: 100,
  generate_epub: 1000,
  send_email: 30,
  generate_cover: 300,
  generate_from_url: 800,
};
