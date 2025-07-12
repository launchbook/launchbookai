// launchbookai/src/frontend/profile.js

const supabase = window.supabase;

const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const userIdField = document.getElementById('userId');
const joinedAtField = document.getElementById('joinedAt');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');

let currentUser = null;

async function loadUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.href = "/login";

  currentUser = session.user;
  const { user_metadata, email, id, created_at } = currentUser;

  nameInput.value = user_metadata?.name || '';
  emailInput.value = email;
  userIdField.textContent = id;
  joinedAtField.textContent = new Date(created_at).toLocaleDateString();
}

saveBtn.addEventListener('click', async () => {
  const updatedName = nameInput.value.trim();
  if (!updatedName) return alert("Name can't be empty");

  const { error } = await supabase.auth.updateUser({
    data: { name: updatedName },
  });

  if (error) {
    alert("❌ Failed to update: " + error.message);
  } else {
    alert("✅ Profile updated successfully");
  }
});

deleteBtn.addEventListener('click', async () => {
  const confirm = window.confirm("⚠️ Are you sure? This will deactivate your account and hide all data.");
  if (!confirm) return;

  const { error } = await supabase.from("users").update({ deleted: true }).eq("id", currentUser.id);

  if (error) {
    alert("❌ Could not delete account: " + error.message);
  } else {
    await supabase.auth.signOut();
    alert("👋 Your account is marked as deleted. You’ve been logged out.");
    window.location.href = "/";
  }
});

window.addEventListener('DOMContentLoaded', loadUser);
