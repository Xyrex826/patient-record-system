import { viewModal } from "./modules-diagnoses/view.js";
import { updateModal } from "./modules-diagnoses/update.js";
import { deleteModal } from "./modules-diagnoses/delete.js";

const baseApiUrl = "http://localhost/patient-record-system/api";
sessionStorage.setItem("baseAPIUrl", baseApiUrl);

document.addEventListener("DOMContentLoaded", () => {
  displayDiagnoses();

  document.getElementById("btn-submit").addEventListener("click", () => {
    insertDiagnosis();
  });

  document.getElementById("show-inactive").addEventListener("change", () => {
    displayDiagnoses();
  });
});

const displayDiagnoses = async () => {
  const response = await axios.get(`${baseApiUrl}/diagnoses.php`, {
    params: { operation: "getAllDiagnoses" },
  });
  if (response.status == 200) {
    displayDiagnosesTable(response.data);
  } else {
    alert("Error!");
  }
};

const displayDiagnosesTable = (diagnoses) => {
  const showInactive = document.getElementById("show-inactive").checked;
  const tableDiv = document.getElementById("table-div");
  tableDiv.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "table-striped", "table-sm");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>ICD-10 CODE</th>
      <th>DIAGNOSIS NAME</th>
      <th>DESCRIPTION</th>
      <th>STATUS</th>
      <th>ACTION</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  diagnoses
    .filter((diagnosis) => showInactive || diagnosis.Status === "Active")
    .forEach((diagnosis) => {
      const isActive = diagnosis.Status === "Active";
      let row = document.createElement("tr");
      if (!isActive) row.classList.add("table-secondary");

      row.innerHTML = `
        <td>${diagnosis.DiagnosisID}</td>
        <td>${diagnosis.ICD10Code}</td>
        <td>${diagnosis.DiagnosisName}</td>
        <td>${diagnosis.Description ?? ""}</td>
        <td>
          <span class="badge ${isActive ? "bg-success" : "bg-secondary"}">${diagnosis.Status}</span>
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
        viewModal(diagnosis.DiagnosisID);
      });

      row.querySelector(".btn-update").addEventListener("click", () => {
        updateModal(diagnosis.DiagnosisID, displayDiagnoses);
      });

      const deleteBtn = row.querySelector(".btn-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          deleteModal(diagnosis.DiagnosisID, displayDiagnoses);
        });
      }

      const restoreBtn = row.querySelector(".btn-restore");
      if (restoreBtn) {
        restoreBtn.addEventListener("click", () => {
          restoreDiagnosis(diagnosis.DiagnosisID);
        });
      }
    });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
};

const insertDiagnosis = async () => {
  const jsonData = {
    icd10Code: document.getElementById("icd10-code").value,
    name: document.getElementById("diagnosis-name").value,
    description: document.getElementById("description").value,
  };

  if (!jsonData.icd10Code || !jsonData.name) {
    alert("Please fill in the ICD-10 Code and Diagnosis Name.");
    return;
  }

  const formData = new FormData();
  formData.append("operation", "insertDiagnosis");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${baseApiUrl}/diagnoses.php`,
    method: "POST",
    data: formData,
  });

  if (response.data == 1) {
    clearForm();
    displayDiagnoses();
    alert("Diagnosis successfully saved!");
  } else {
    alert("ERROR (the ICD-10 Code may already exist)");
  }
};

const restoreDiagnosis = async (diagnosisId) => {
  const params = {
    operation: "restoreDiagnosis",
    json: JSON.stringify({ diagnosisId: diagnosisId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/diagnoses.php`, {
    params: params,
  });
  if (response.data == 1) {
    displayDiagnoses();
    alert("Diagnosis restored!");
  } else {
    alert("ERROR");
  }
};

const clearForm = () => {
  document.getElementById("icd10-code").value = "";
  document.getElementById("diagnosis-name").value = "";
  document.getElementById("description").value = "";
};
