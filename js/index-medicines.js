import { viewModal } from "./modules-medicines/view.js";
import { updateModal } from "./modules-medicines/update.js";
import { deleteModal } from "./modules-medicines/delete.js";

const baseApiUrl = "http://localhost/patient-record-system/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  displayMedicines();

  document.getElementById("btn-submit").addEventListener("click", () => {
    insertMedicine();
  });

  document.getElementById("show-inactive").addEventListener("change", () => {
    displayMedicines();
  });
});

const displayMedicines = async () => {
  const response = await axios.get(`${baseApiUrl}/medicines.php`, {
    params: { operation: "getAllMedicines" },
  });
  if (response.status == 200) {
    displayMedicinesTable(response.data);
  } else {
    alert("Error!");
  }
};

const displayMedicinesTable = (medicines) => {
  const showInactive = document.getElementById("show-inactive").checked;
  const tableDiv = document.getElementById("table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>MEDICINE NAME</th>
      <th>DOSAGE FORM</th>
      <th>DESCRIPTION</th>
      <th>STATUS</th>
      <th>ACTION</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  medicines
    .filter((medicine) => showInactive || medicine.Status === "Active")
    .forEach((medicine) => {
      const isActive = medicine.Status === "Active";
      let row = document.createElement("tr");
      if (!isActive) row.classList.add("table-secondary");

      row.innerHTML = `
        <td>${medicine.MedicineID}</td>
        <td>${medicine.MedicineName}</td>
        <td>${medicine.DosageForm}</td>
        <td>${medicine.Description ?? ""}</td>
        <td>
          <span class="badge ${isActive ? "bg-success" : "bg-secondary"}">${medicine.Status}</span>
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
        viewModal(medicine.MedicineID);
      });

      row.querySelector(".btn-update").addEventListener("click", () => {
        updateModal(medicine.MedicineID, displayMedicines);
      });

      const deleteBtn = row.querySelector(".btn-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          deleteModal(medicine.MedicineID, displayMedicines);
        });
      }

      const restoreBtn = row.querySelector(".btn-restore");
      if (restoreBtn) {
        restoreBtn.addEventListener("click", () => {
          restoreMedicine(medicine.MedicineID);
        });
      }
    });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};

const insertMedicine = async () => {
  const jsonData = {
    medicineName: document.getElementById("medicine-name").value,
    dosageForm: document.getElementById("dosage-form").value,
    description: document.getElementById("description").value,
  };

  if (!jsonData.medicineName || !jsonData.dosageForm) {
    alert("Please fill in Medicine Name and Dosage Form.");
    return;
  }

  const formData = new FormData();
  formData.append("operation", "insertMedicine");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${baseApiUrl}/medicines.php`,
    method: "POST",
    data: formData,
  });

  if (response.data == 1) {
    clearForm();
    displayMedicines();
    alert("Medicine successfully saved!");
  } else {
    alert("ERROR");
  }
};

const restoreMedicine = async (medicineId) => {
  const params = {
    operation: "restoreMedicine",
    json: JSON.stringify({ medicineId: medicineId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/medicines.php`, {
    params: params,
  });
  if (response.data == 1) {
    displayMedicines();
    alert("Medicine restored!");
  } else {
    alert("ERROR");
  }
};

const clearForm = () => {
  document.getElementById("medicine-name").value = "";
  document.getElementById("dosage-form").value = "";
  document.getElementById("description").value = "";
};
