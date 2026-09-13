import { viewModal } from "./modules/view.js";
import { updateModal } from "./modules/update.js";
import { deleteModal } from "./modules/delete.js";

const baseApiUrl = "http://localhost/patient-record-system/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  displayPatients();

  document.getElementById("btn-submit").addEventListener("click", () => {
    insertPatient();
  });

  document.getElementById("show-inactive").addEventListener("change", () => {
    displayPatients();
  });

  // Only show "Please specify" when Gender = Other.
  document.getElementById("gender").addEventListener("change", (event) => {
    const detailsInput = document.getElementById("gender-details");
    detailsInput.style.display = event.target.value === "Other" ? "block" : "none";
    if (event.target.value !== "Other") detailsInput.value = "";
  });
});

const displayPatients = async () => {
  const response = await axios.get(`${baseApiUrl}/patients.php`, {
    params: { operation: "getAllPatients" },
  });
  if (response.status == 200) {
    displayPatientsTable(response.data);
  } else {
    alert("Error!");
  }
};

const displayPatientsTable = (patients) => {
  const showInactive = document.getElementById("show-inactive").checked;
  const tableDiv = document.getElementById("table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>LAST NAME</th>
      <th>FIRST NAME</th>
      <th>DATE OF BIRTH</th>
      <th>GENDER</th>
      <th>PHONE</th>
      <th>ADDRESS</th>
      <th>STATUS</th>
      <th>ACTION</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  patients
    .filter((patient) => showInactive || patient.Status === "Active")
    .forEach((patient) => {
      const isActive = patient.Status === "Active";
      let row = document.createElement("tr");
      if (!isActive) row.classList.add("table-secondary");

      row.innerHTML = `
        <td>${patient.LastName}</td>
        <td>${patient.FirstName}</td>
        <td>${patient.DateOfBirth}</td>
        <td>${patient.Gender}${patient.Gender === "Other" && patient.GenderDetails ? ` (${patient.GenderDetails})` : ""}</td>
        <td>${patient.Phone ?? ""}</td>
        <td>${patient.Address ?? ""}</td>
        <td>
          <span class="badge ${isActive ? "bg-success" : "bg-secondary"}">${patient.Status}</span>
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
        viewModal(patient.PatientID);
      });

      row.querySelector(".btn-update").addEventListener("click", () => {
        updateModal(patient.PatientID, displayPatients);
      });

      const deleteBtn = row.querySelector(".btn-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          deleteModal(patient.PatientID, displayPatients);
        });
      }

      const restoreBtn = row.querySelector(".btn-restore");
      if (restoreBtn) {
        restoreBtn.addEventListener("click", () => {
          restorePatient(patient.PatientID);
        });
      }
    });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};

// Phone is optional, but if typed in it must be 7-15 digits only -
// no "-" (so no negative numbers), "+", letters, or spaces.
const isValidPhone = (phone) => phone.trim() === "" || /^[0-9]{7,15}$/.test(phone.trim());

const insertPatient = async () => {
  const jsonData = {
    firstName: document.getElementById("first-name").value,
    lastName: document.getElementById("last-name").value,
    dob: document.getElementById("birth-date").value,
    gender: document.getElementById("gender").value,
    genderDetails: document.getElementById("gender-details").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
  };

  if (!jsonData.firstName || !jsonData.lastName || !jsonData.dob || !jsonData.gender) {
    alert("Please fill in First Name, Last Name, Date of Birth and Gender.");
    return;
  }

  if (jsonData.gender === "Other" && !jsonData.genderDetails.trim()) {
    alert("Please specify the gender.");
    return;
  }

  if (!isValidPhone(jsonData.phone)) {
    alert("Phone must contain digits only (7-15 digits), with no negative sign or letters.");
    return;
  }

  const formData = new FormData();
  formData.append("operation", "insertPatient");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${baseApiUrl}/patients.php`,
    method: "POST",
    data: formData,
  });

  if (response.data == 1) {
    clearForm();
    displayPatients();
    alert("Patient successfully saved!");
  } else if (response.data?.error === "invalid_phone") {
    alert("Phone must contain digits only (7-15 digits), with no negative sign or letters.");
  } else if (response.data?.error === "gender_details_required") {
    alert("Please specify the gender.");
  } else {
    alert("ERROR");
  }
};

const restorePatient = async (patientId) => {
  const params = {
    operation: "restorePatient",
    json: JSON.stringify({ patientId: patientId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/patients.php`, {
    params: params,
  });
  if (response.data == 1) {
    displayPatients();
    alert("Patient restored!");
  } else {
    alert("ERROR");
  }
};

const clearForm = () => {
  document.getElementById("first-name").value = "";
  document.getElementById("last-name").value = "";
  document.getElementById("birth-date").value = "";
  document.getElementById("gender").value = "";
  document.getElementById("gender-details").value = "";
  document.getElementById("gender-details").style.display = "none";
  document.getElementById("phone").value = "";
  document.getElementById("address").value = "";
};
