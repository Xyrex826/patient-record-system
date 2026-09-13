export const viewModal = async (patientId) => {
  document.getElementById("blank-modal-title").innerText = "Patient Details";

  const patient = await getPatientDetails(patientId);

  const myHtml = `
    <table class="table table-sm">
      <tr>
        <td>Patient ID</td>
        <td>${patient[0].PatientID}</td>
      </tr>
      <tr>
        <td>Last Name</td>
        <td>${patient[0].LastName}</td>
      </tr>
      <tr>
        <td>First Name</td>
        <td>${patient[0].FirstName}</td>
      </tr>
      <tr>
        <td>Date of Birth</td>
        <td>${patient[0].DateOfBirth}</td>
      </tr>
      <tr>
        <td>Gender</td>
        <td>${patient[0].Gender}${patient[0].Gender === "Other" && patient[0].GenderDetails ? ` (${patient[0].GenderDetails})` : ""}</td>
      </tr>
      <tr>
        <td>Phone</td>
        <td>${patient[0].Phone ?? ""}</td>
      </tr>
      <tr>
        <td>Address</td>
        <td>${patient[0].Address ?? ""}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td>${patient[0].Status}</td>
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
