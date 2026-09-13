import { viewModal } from "./modules-doctors/view.js";
import { updateModal } from "./modules-doctors/update.js";
import { deleteModal } from "./modules-doctors/delete.js";

const baseApiUrl = "http://localhost/patient-record-system/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  displaySpecializations();
  displayDoctors();

  document.getElementById("btn-submit").addEventListener("click", () => {
    insertDoctor();
  });

  document.getElementById("show-inactive").addEventListener("change", () => {
    displayDoctors();
  });
});

// Fetches the lookup table and renders it as a list of checkboxes so the
// user can just click each specialization that applies (instead of having
// to Ctrl/Cmd+click inside a <select multiple>).
const displaySpecializations = async () => {
  const container = document.getElementById("specializations");
  const response = await axios.get(`${baseApiUrl}/specializations.php`, {
    params: { operation: "getSpecializations" },
  });
  if (response.status == 200) {
    container.innerHTML = "";
    response.data.forEach((spec) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("form-check");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.classList.add("form-check-input");
      checkbox.value = spec.SpecializationID;
      checkbox.id = `spec-${spec.SpecializationID}`;
      checkbox.name = "specializations";

      const label = document.createElement("label");
      label.classList.add("form-check-label");
      label.htmlFor = checkbox.id;
      label.innerText = spec.SpecializationName;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    });
  } else {
    alert("Error!");
  }
};

const displayDoctors = async () => {
  const response = await axios.get(`${baseApiUrl}/doctors.php`, {
    params: { operation: "getAllDoctors" },
  });
  if (response.status == 200) {
    displayDoctorsTable(response.data);
  } else {
    alert("Error!");
  }
};

const displayDoctorsTable = (doctors) => {
  const showInactive = document.getElementById("show-inactive").checked;
  const tableDiv = document.getElementById("table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>LAST NAME</th>
      <th>FIRST NAME</th>
      <th>USERNAME</th>
      <th>PHONE</th>
      <th>SPECIALIZATIONS</th>
      <th>STATUS</th>
      <th>ACTION</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  doctors
    .filter((doctor) => showInactive || doctor.Status === "Active")
    .forEach((doctor) => {
      const isActive = doctor.Status === "Active";
      let row = document.createElement("tr");
      if (!isActive) row.classList.add("table-secondary");

      row.innerHTML = `
        <td>${doctor.DoctorID}</td>
        <td>${doctor.LastName}</td>
        <td>${doctor.FirstName}</td>
        <td>${doctor.Username}</td>
        <td>${doctor.Phone ?? ""}</td>
        <td>${doctor.Specializations ?? ""}</td>
        <td>
          <span class="badge ${isActive ? "bg-success" : "bg-secondary"}">${doctor.Status}</span>
        </td>
        <td>
          <button type="button" class="btn btn-primary btn-sm btn-view">View</button>
          <button type="button" class="btn btn-success btn-sm btn-update">Update</button>
          ${
            isActive
              ? `<button type="button" class="btn btn-danger btn-sm btn-delete">Delete</button>`
              : `<button type="button" class="btn btn-warning btn-sm btn-restore">Restore</button>`
          }
        </td>
      `;
      tbody.appendChild(row);

      row.querySelector(".btn-view").addEventListener("click", () => {
        viewModal(doctor.DoctorID);
      });

      row.querySelector(".btn-update").addEventListener("click", () => {
        updateModal(doctor.DoctorID, displayDoctors);
      });

      const deleteBtn = row.querySelector(".btn-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          deleteModal(doctor.DoctorID, displayDoctors);
        });
      }

      const restoreBtn = row.querySelector(".btn-restore");
      if (restoreBtn) {
        restoreBtn.addEventListener("click", () => {
          restoreDoctor(doctor.DoctorID);
        });
      }
    });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};

// Reads the checked specialization checkboxes out of the container.
const getSelectedSpecializationIds = (containerEl) => {
  return [...containerEl.querySelectorAll("input[type='checkbox']:checked")].map(
    (checkbox) => checkbox.value
  );
};

// Phone is optional, but if typed in it must be 7-15 digits only -
// no "-" (so no negative numbers), "+", letters, or spaces.
const isValidPhone = (phone) => phone.trim() === "" || /^[0-9]{7,15}$/.test(phone.trim());

const insertDoctor = async () => {
  const jsonData = {
    lastName: document.getElementById("last-name").value,
    firstName: document.getElementById("first-name").value,
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
    phone: document.getElementById("phone").value,
    specializationIds: getSelectedSpecializationIds(document.getElementById("specializations")),
  };

  if (!jsonData.lastName || !jsonData.firstName || !jsonData.username || !jsonData.password) {
    alert("Please fill in Last Name, First Name, Username and Password.");
    return;
  }

  if (!isValidPhone(jsonData.phone)) {
    alert("Phone must contain digits only (7-15 digits), with no negative sign or letters.");
    return;
  }

  const formData = new FormData();
  formData.append("operation", "insertDoctor");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${baseApiUrl}/doctors.php`,
    method: "POST",
    data: formData,
  });

  if (response.data == 1) {
    clearForm();
    displayDoctors();
    alert("Doctor successfully saved!");
  } else if (response.data?.error === "invalid_phone") {
    alert("Phone must contain digits only (7-15 digits), with no negative sign or letters.");
  } else {
    alert("ERROR");
  }
};

const restoreDoctor = async (doctorId) => {
  const params = {
    operation: "restoreDoctor",
    json: JSON.stringify({ doctorId: doctorId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/doctors.php`, {
    params: params,
  });
  if (response.data == 1) {
    displayDoctors();
    alert("Doctor restored!");
  } else {
    alert("ERROR");
  }
};

const clearForm = () => {
  document.getElementById("last-name").value = "";
  document.getElementById("first-name").value = "";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("phone").value = "";
  document
    .querySelectorAll("#specializations input[type='checkbox']")
    .forEach((checkbox) => (checkbox.checked = false));
};
