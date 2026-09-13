const baseApiUrl = "http://localhost/patient-record-system/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  loadRoles();

  document.getElementById("btn-register").addEventListener("click", () => {
    register();
  });
});

const loadRoles = async () => {
  try {
    const response = await axios.get(`${baseApiUrl}/auth.php`, {
      params: { operation: "getSignupRoles" },
    });
    const roleSelect = document.getElementById("role");
    response.data.forEach((role) => {
      const option = document.createElement("option");
      option.value = role.RoleID;
      option.textContent = role.RoleName;
      roleSelect.appendChild(option);
    });
  } catch (error) {
    showError("Could not load account types. Please refresh the page.");
  }
};

const showError = (message) => {
  const alertBox = document.getElementById("register-alert");
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
  document.getElementById("register-success").classList.add("d-none");
};

const showSuccess = (message) => {
  const alertBox = document.getElementById("register-success");
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
  document.getElementById("register-alert").classList.add("d-none");
};

const hideAlerts = () => {
  document.getElementById("register-alert").classList.add("d-none");
  document.getElementById("register-success").classList.add("d-none");
};

const ERROR_MESSAGES = {
  missing_fields: "Please fill in every field.",
  invalid_username: "Username must be 3-50 characters: letters, numbers, and underscore only.",
  weak_password: "Password must be at least 6 characters.",
  invalid_role: "Please select a valid account type.",
  username_taken: "That username is already taken.",
};

const register = async () => {
  hideAlerts();

  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const roleId = document.getElementById("role").value;
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (!firstName || !lastName || !roleId || !username || !password || !confirmPassword) {
    showError(ERROR_MESSAGES.missing_fields);
    return;
  }
  if (password !== confirmPassword) {
    showError("Passwords do not match.");
    return;
  }

  try {
    const response = await axios.post(`${baseApiUrl}/auth.php`, new URLSearchParams({
      operation: "register",
      json: JSON.stringify({ firstName, lastName, username, password, roleId }),
    }));

    const data = response.data;
    if (data.error) {
      showError(ERROR_MESSAGES[data.error] || "Something went wrong. Please try again.");
      return;
    }

    showSuccess("Account created! Redirecting to login...");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  } catch (error) {
    showError("Could not reach the server. Please try again.");
  }
};
