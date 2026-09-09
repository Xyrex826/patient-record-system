export const deleteModal = async (patientId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Confirm Deactivate";

  const patient = await getPatientDetails(patientId);
  const p = patient[0];

  let myHtml = `
    <p>This patient has (or may have) appointments, consultations, or billing
    records linked to them, so their record will be <strong>deactivated</strong>
    (soft delete) instead of permanently removed. You can restore them later.</p>
    <table class="table table-sm">
      <tr>
        <td>Patient ID</td>
        <td>${p.PatientID}</td>
      </tr>
      <tr>
        <td>Last Name</td>
        <td>${p.LastName}</td>
      </tr>
      <tr>
        <td>First Name</td>
        <td>${p.FirstName}</td>
      </tr>
      <tr>
        <td>Date of Birth</td>
        <td>${p.DateOfBirth}</td>
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
    if (await deletePatientRecord(p.PatientID) == 1) {
      refreshDisplay();
      alert("Patient has been deactivated!");
      myModal.hide();
    } else {
      alert("ERROR");
    }
  });

  myModal.show();
};

const getPatientDetails = async (patientId) => {
  const params = {
    operation: "getPatient",
    json: JSON.stringify({ patientId: patientId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/patients.php`, {
    params: params,
  });
  return response.data;
};

const deletePatientRecord = async (patientId) => {
  const params = {
    operation: "deletePatient",
    json: JSON.stringify({ patientId: patientId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/patients.php`, {
    params: params,
  });
  return response.data;
};
