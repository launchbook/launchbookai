// File: src/frontend/generate.js

// ✅ GLOBAL STATE
let currentUser = null;
let userApiKey = null;

// ✅ DOM Elements
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const coverPreview = document.getElementById("coverPreview");
const templateSelectBtn = document.getElementById("templateSelectBtn");
const saveFormattingBtn = document.getElementById("saveFormattingBtn");
const contentPreviewArea = document.getElementById("contentPreview");
const creditBadge = document.getElementById("creditBadge");
const spinner = document.getElementById("spinner");
const apiKeyInput = document.getElementById("userApiKeyInput");
const apiKeyStatus = document.getElementById("apiKeyStatus");
const removeApiKeyBtn = document.getElementById("removeApiKeyBtn");

// ✅ INIT Supabase
const supabase = window.supabase;

// ✅ AUTH + CREDITS
async function getUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.href = "/login";
  currentUser = session.user;

  const { data: plan } = await supabase
    .from("users_plan")
    .select("credit_limit, credits_used")
    .eq("user_id", currentUser.id)
    .single();

  const remaining = plan.credit_limit - plan.credits_used;
  creditBadge.textContent = `🔋 ${remaining} credits left`;
}

// ✅ VERIFY USER'S API KEY
function verifyUserApiKey(key) {
  if (!key.startsWith("sk-")) return false;
  // Future: hit OpenAI endpoint to test auth
  return true;
}

function handleApiKeyChange() {
  const key = apiKeyInput.value.trim();
  if (verifyUserApiKey(key)) {
    userApiKey = key;
    apiKeyStatus.innerHTML = "<span class='text-green-500 text-sm'>✅ Verified</span>";
    removeApiKeyBtn.classList.remove("hidden");
  } else {
    apiKeyStatus.innerHTML = "<span class='text-red-500 text-sm'>❌ Invalid Key</span>";
    userApiKey = null;
    removeApiKeyBtn.classList.add("hidden");
  }
}

removeApiKeyBtn.addEventListener("click", () => {
  apiKeyInput.value = "";
  userApiKey = null;
  apiKeyStatus.textContent = "";
  removeApiKeyBtn.classList.add("hidden");
});

// ✅ SAVE FORMATTING TO SUPABASE
async function saveFormattingToSupabase(data) {
  await supabase.from("generated_files").insert({
    user_id: currentUser.id,
    ...data
  });
}

// ✅ GENERATE EBOOK (Stub)
async function handleGenerate() {
  spinner.classList.remove("hidden");
  contentPreviewArea.innerHTML = "";

  const format = document.querySelector("input[name='output_format']:checked").value;
  const title = document.getElementById("titleInput").value;
  const topic = document.getElementById("topicInput").value;
  const language = document.getElementById("languageSelect").value;
  const description = document.getElementById("descInput").value;
  const coverPrompt = document.getElementById("coverPromptInput").value;

  // ✅ Call backend with user API or default key
  const res = await fetch("/generate-ebook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      format,
      title,
      topic,
      language,
      description,
      cover_prompt: coverPrompt,
      user_api_key: userApiKey,
      user_id: currentUser.id,
    })
  });

  const result = await res.json();
  if (!res.ok) {
    alert("Error generating eBook: " + result.error);
    spinner.classList.add("hidden");
    return;
  }

  // ✅ Render content + enable download
  contentPreviewArea.innerHTML = result.preview_html;
  coverPreview.src = result.cover_url;
  downloadBtn.href = result.download_url;
  downloadBtn.classList.remove("opacity-50", "pointer-events-none");
  spinner.classList.add("hidden");
}

// ✅ EVENTS
apiKeyInput.addEventListener("input", handleApiKeyChange);
generateBtn.addEventListener("click", handleGenerate);
saveFormattingBtn.addEventListener("click", () => {
  const font = document.getElementById("fontSelect").value;
  const size = document.getElementById("fontSize").value;
  const spacing = document.getElementById("lineSpacing").value;
  const alignment = document.getElementById("textAlign").value;

  saveFormattingToSupabase({
    font_type: font,
    font_size: size,
    line_spacing: spacing,
    text_alignment: alignment,
  });
  alert("✅ Formatting saved!");
});

// ✅ INIT
window.addEventListener("DOMContentLoaded", async () => {
  await getUser();
});

