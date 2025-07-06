import { supabase } from '/supabaseClient.js';

let currentUser = null;

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

window.signOut = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login";
};

const form = document.getElementById("ebook-form");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const audience = document.getElementById("audience").value;
  const style = document.getElementById("style").value;
  const withImages = document.getElementById("with-images").checked;

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
