const baseApiUrl = "http://localhost/patient-record-system/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  const raw = sessionStorage.getItem("currentUser");
  if (!raw) return; // auth-guard.js already redirects to login.html in this case

  const user = JSON.parse(raw);
  document.getElementById("welcome-heading").textContent = `Welcome, ${user.FirstName}!`;
  document.getElementById("welcome-subtext").textContent =
    `You're signed in as ${user.RoleName}. Pick a module below to get started.`;
});
