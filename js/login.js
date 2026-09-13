const baseApiUrl = "http://localhost/patient-record-system/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

// Already signed in? Skip the login form entirely.
if (sessionStorage.getItem("currentUser")) {
  window.location.href = "home.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-login").addEventListener("click", () => {
    login();
  });

  // Let Enter key submit from either field.
  ["username", "password"].forEach((id) => {
    document.getElementById(id).addEventListener("keydown", (event) => {
      if (event.key === "Enter") login();
    });
  });
});

const showError = (message) => {
  const alertBox = document.getElementById("login-alert");
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
};

const hideError = () => {
  document.getElementById("login-alert").classList.add("d-none");
};

const ERROR_MESSAGES = {
  missing_fields: "Please enter your username and password.",
  invalid_credentials: "Incorrect username or password.",
  account_inactive: "This account has been deactivated. Contact an administrator.",
};

const login = async () => {
  hideError();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showError(ERROR_MESSAGES.missing_fields);
    return;
  }

  try {
    const response = await axios.post(`${baseApiUrl}/auth.php`, new URLSearchParams({
      operation: "login",
      json: JSON.stringify({ username, password }),
    }));

    const data = response.data;
    if (data.error) {
      showError(ERROR_MESSAGES[data.error] || "Something went wrong. Please try again.");
      return;
    }

    sessionStorage.setItem("currentUser", JSON.stringify(data.user));
    window.location.href = "home.html";
  } catch (error) {
    showError("Could not reach the server. Please try again.");
  }
};
