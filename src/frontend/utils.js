window.showToast = function (msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `
    toast-item fixed right-5 z-50 px-4 py-2 mt-2 rounded shadow
    ${type === "success" ? "bg-green-600" : "bg-red-600"} text-white
  `;
  toast.style.top = `${document.querySelectorAll('.toast-item').length * 60 + 20}px`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};
