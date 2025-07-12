// ✅ Basic Domain/IP Lock to Prevent External Abuse
(function () {
  const allowedHostnames = ["localhost", "launchbook.ai", "www.launchbook.ai"];
  const currentHost = location.hostname;

  if (!allowedHostnames.includes(currentHost)) {
    document.body.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:100vh;text-align:center;font-family:sans-serif">
        <div>
          <h1 style="font-size:2rem;color:#dc2626">🚫 Unauthorized Domain</h1>
          <p>This site is protected and can only be used from <strong>launchbook.ai</strong></p>
        </div>
      </div>
    `;
    throw new Error("Blocked by security.js – Unauthorized domain: " + currentHost);
  }
})();
