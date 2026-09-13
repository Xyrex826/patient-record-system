// Included on every protected page (Home + the 5 master file screens).
// Two jobs:
//   1. Bounce back to the Login page if nobody is signed in.
//   2. Fill in the "Signed in as ..." + Logout control in the nav bar.
//
// The signed-in user is kept in sessionStorage (not localStorage) so a
// closed tab/browser requires signing in again - same lifetime as
// baseAPIUrl, which the existing index*.js files already store there.

const getCurrentUser = () => {
  const raw = sessionStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
};

const currentUser = getCurrentUser();

if (!currentUser) {
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  if (!currentUser) return;

  const slot = document.getElementById("nav-user-info");
  if (!slot) return;

  slot.innerHTML = `
    <span class="navbar-text text-white me-3">
      Signed in as <strong>${currentUser.FirstName} ${currentUser.LastName}</strong> (${currentUser.RoleName})
    </span>
    <button type="button" class="btn btn-outline-light btn-sm" id="btn-logout">Logout</button>
  `;

  document.getElementById("btn-logout").addEventListener("click", () => {
    sessionStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });
});
