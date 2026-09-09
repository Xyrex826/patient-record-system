export const deleteModal = async (diagnosisId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Confirm Deactivate";

  const diagnosis = await getDiagnosisDetails(diagnosisId);
  const d = diagnosis[0];

  let myHtml = `
    <p>This diagnosis code may already be linked to past consultations, so its record will be
    <strong>deactivated</strong> (soft delete) instead of permanently removed. You can restore
    it later.</p>
    <table class="table table-sm">
      <tr>
        <td>Diagnosis ID</td>
        <td>${d.DiagnosisID}</td>
      </tr>
      <tr>
        <td>ICD-10 Code</td>
        <td>${d.ICD10Code}</td>
      </tr>
      <tr>
        <td>Diagnosis Name</td>
        <td>${d.DiagnosisName}</td>
      </tr>
    </table>
  `;
  document.getElementById("blank-main-div").innerHTML = myHtml;

  const modalFooter = document.getElementById("blank-modal-footer");
  modalFooter.innerHTML = `
    <div class="btn-group w-100" role="group">
      <button type="button" class="btn btn-danger btn-sm w-100 me-2 btn-delete">Deactivate</button>
      <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
    </div>
  `;

  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  modalFooter.querySelector(".btn-delete").addEventListener("click", async () => {
    if (await deleteDiagnosisRecord(d.DiagnosisID) == 1) {
      refreshDisplay();
      alert("Diagnosis has been deactivated!");
      myModal.hide();
    } else {
      alert("ERROR");
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

const deleteDiagnosisRecord = async (diagnosisId) => {
  const params = {
    operation: "deleteDiagnosis",
    json: JSON.stringify({ diagnosisId: diagnosisId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/diagnoses.php`, {
    params: params,
  });
  return response.data;
};
