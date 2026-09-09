export const viewModal = async (doctorId) => {
  document.getElementById("blank-modal-title").innerText = "Doctor Details";

  const doctor = await getDoctorDetails(doctorId);
  const d = doctor[0];
  const specNames = d.specializations.map((s) => s.SpecializationName).join(", ") || "None";

  const myHtml = `
    <table class="table table-sm">
      <tr>
        <td>Doctor ID</td>
        <td>${d.DoctorID}</td>
      </tr>
      <tr>
        <td>Last Name</td>
        <td>${d.LastName}</td>
      </tr>
      <tr>
        <td>First Name</td>
        <td>${d.FirstName}</td>
      </tr>
      <tr>
        <td>Username</td>
        <td>${d.Username}</td>
      </tr>
      <tr>
        <td>Phone</td>
        <td>${d.Phone ?? ""}</td>
      </tr>
      <tr>
        <td>Specializations</td>
        <td>${specNames}</td>
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

const getDoctorDetails = async (doctorId) => {
  const params = {
    operation: "getDoctor",
    json: JSON.stringify({ doctorId: doctorId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/doctors.php`, {
    params: params,
  });
  return response.data;
};
