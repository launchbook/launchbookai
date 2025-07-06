import { supabase } from '/supabaseClient.js';

let currentUser = null;

// ✅ Fetch and show logged-in user
const getUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    alert("Session expired. Please log in again.");
    window.location.href = "/login";
    return;
  }

  currentUser = session.user;
  const emailSpan = document.getElementById("user-email");
  if (emailSpan) {
    emailSpan.innerText = currentUser.email;
  }
};

getUser();

// ✅ Sign out handler
window.signOut = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login";
};

// ✅ Handle eBook form submission
const form = document.getElementById("ebook-form");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title")?.value;
    const audience = document.getElementById("audience")?.value;
    const style = document.getElementById("style")?.value;
    const withImages = document.getElementById("with-images")?.value === "Yes";

    if (!title || !audience || !style) {
      alert("Please fill all required fields.");
      return;
    }

    const { error } = await supabase.from("ebooks").insert([
      {
        user_id: currentUser.id,
        title,
        audience,
        style,
        with_images: withImages
      }
    ]);

    if (error) {
      alert("❌ Failed to save eBook: " + error.message);
    } else {
      alert("✅ eBook created successfully!");
      form.reset();
    }
  });
}
