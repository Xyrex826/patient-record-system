export const updateModal = async (diagnosisId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Update Diagnosis";

  const diagnosis = await getDiagnosisDetails(diagnosisId);
  const d = diagnosis[0];

  const myHtml = `
    <div class="col-12 mb-2">
      <label class="form-label">ICD-10 Code</label>
      <input type="text" class="form-control" id="upd-icd10-code" value="${d.ICD10Code}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Diagnosis Name</label>
      <input type="text" class="form-control" id="upd-name" value="${d.DiagnosisName}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Description</label>
      <textarea class="form-control" id="upd-description" rows="2">${d.Description ?? ""}</textarea>
    </div>
  `;

  document.getElementById("blank-main-div").innerHTML = myHtml;

  const modalFooter = document.getElementById("blank-modal-footer");
  modalFooter.innerHTML = `
    <div class="btn-group w-100" role="group">
      <button type="button" class="btn btn-success btn-sm w-100 me-2 btn-save">Save Changes</button>
      <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
    </div>
  `;

  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  modalFooter.querySelector(".btn-save").addEventListener("click", async () => {
    const jsonData = {
      diagnosisId: d.DiagnosisID,
      icd10Code: document.getElementById("upd-icd10-code").value,
      name: document.getElementById("upd-name").value,
      description: document.getElementById("upd-description").value,
    };

    if (!jsonData.icd10Code || !jsonData.name) {
      alert("ICD-10 Code and Diagnosis Name are required.");
      return;
    }

    if ((await updateDiagnosis(jsonData)) == 1) {
      refreshDisplay();
      alert("Diagnosis updated!");
      myModal.hide();
    } else {
      alert("ERROR (the ICD-10 Code may already exist)");
    }
  });

  myModal.show();
};

const getDiagnosisDetails = async (diagnosisId) => {
  const params = {
    operation: "getDiagnosis",
    json: JSON.stringify({ diagnosisId: diagnosisId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/diagnoses.php`, {
    params: params,
  });
  return response.data;
};

const updateDiagnosis = async (jsonData) => {
  const formData = new FormData();
  formData.append("operation", "updateDiagnosis");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${sessionStorage.baseAPIUrl}/diagnoses.php`,
    method: "POST",
    data: formData,
  });
  return response.data;
};
