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

// Same technique as courses.php -> the "course" <select> in the reference
// material: fetch the lookup table and use it to populate a <select>.
const displaySpecializations = async () => {
  const select = document.getElementById("specializations");
  const response = await axios.get(`${baseApiUrl}/specializations.php`, {
    params: { operation: "getSpecializations" },
  });
  if (response.status == 200) {
    response.data.forEach((spec) => {
      const option = document.createElement("option");
      option.innerText = spec.SpecializationName;
      option.value = spec.SpecializationID;
      select.appendChild(option);
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

// Reads the selected <option>s out of the multi-select the same way
// you'd read any other form field, just via [...select.selectedOptions].
const getSelectedSpecializationIds = (selectEl) => {
  return [...selectEl.selectedOptions].map((opt) => opt.value);
};

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
  document.getElementById("specializations").selectedIndex = -1;
};
