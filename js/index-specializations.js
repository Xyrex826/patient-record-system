import { viewModal } from "./modules-specializations/view.js";
import { updateModal } from "./modules-specializations/update.js";
import { deleteModal } from "./modules-specializations/delete.js";

const baseApiUrl = "http://localhost/patient-record-system/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  displaySpecializations();

  document.getElementById("btn-submit").addEventListener("click", () => {
    insertSpecialization();
  });
});

const displaySpecializations = async () => {
  const response = await axios.get(`${baseApiUrl}/specializations.php`, {
    params: { operation: "getAllSpecializations" },
  });
  if (response.status == 200) {
    displaySpecializationsTable(response.data);
  } else {
    alert("Error!");
  }
};

const displaySpecializationsTable = (specializations) => {
  const tableDiv = document.getElementById("table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>SPECIALIZATION NAME</th>
      <th>DESCRIPTION</th>
      <th>DOCTORS</th>
      <th>ACTION</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  specializations.forEach((spec) => {
    const doctorCount = Number(spec.DoctorCount ?? 0);
    let row = document.createElement("tr");

    row.innerHTML = `
      <td>${spec.SpecializationID}</td>
      <td>${spec.SpecializationName}</td>
      <td>${spec.Description ?? ""}</td>
      <td><span class="badge ${doctorCount > 0 ? "bg-info text-dark" : "bg-light text-dark"}">${doctorCount}</span></td>
      <td>
        <button type="button" class="btn btn-primary btn-sm btn-view">View</button>
        <button type="button" class="btn btn-success btn-sm btn-update">Update</button>
        <button type="button" class="btn btn-danger btn-sm btn-delete">Delete</button>
      </td>
    `;
    tbody.appendChild(row);

    row.querySelector(".btn-view").addEventListener("click", () => {
      viewModal(spec.SpecializationID);
    });

    row.querySelector(".btn-update").addEventListener("click", () => {
      updateModal(spec.SpecializationID, displaySpecializations);
    });

    row.querySelector(".btn-delete").addEventListener("click", () => {
      deleteModal(spec.SpecializationID, displaySpecializations);
    });
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};

const insertSpecialization = async () => {
  const jsonData = {
    name: document.getElementById("specialization-name").value.trim(),
    description: document.getElementById("description").value,
  };

  if (!jsonData.name) {
    alert("Please fill in the Specialization Name.");
    return;
  }

  const formData = new FormData();
  formData.append("operation", "insertSpecialization");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${baseApiUrl}/specializations.php`,
    method: "POST",
    data: formData,
  });

  if (response.data == 1) {
    clearForm();
    displaySpecializations();
    alert("Specialization successfully saved!");
  } else if (response.data?.error === "duplicate") {
    alert(`"${jsonData.name}" already exists in the list. Please use a different name.`);
  } else {
    alert("ERROR");
  }
};

const clearForm = () => {
  document.getElementById("specialization-name").value = "";
  document.getElementById("description").value = "";
};
