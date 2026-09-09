export const viewModal = async (diagnosisId) => {
  document.getElementById("blank-modal-title").innerText = "Diagnosis Details";

  const diagnosis = await getDiagnosisDetails(diagnosisId);
  const d = diagnosis[0];

  const myHtml = `
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
      <tr>
        <td>Description</td>
        <td>${d.Description ?? ""}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td>${d.Status}</td>
      </tr>
    </table>
  `;

  document.getElementById("blank-main-div").innerHTML = myHtml;

  // reset footer to a plain Close button for the view modal
  document.getElementById("blank-modal-footer").innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
  `;

  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
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
