// ✅ Shared UI Helpers (spinner, toast) – CommonJS Safe

window.showSpinner = function () {
  const spinner = document.getElementById("spinner");
  if (spinner) spinner.classList.remove("hidden");
};

window.hideSpinner = function () {
  const spinner = document.getElementById("spinner");
  if (spinner) spinner.classList.add("hidden");
};

window.showToast = function (msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `
    fixed top-5 right-5 z-50 px-4 py-2 rounded shadow
    ${type === "success" ? "bg-green-600" : "bg-red-600"} text-white
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

