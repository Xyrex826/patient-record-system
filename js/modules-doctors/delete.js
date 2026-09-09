export const deleteModal = async (doctorId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Confirm Deactivate";

  const doctor = await getDoctorDetails(doctorId);
  const d = doctor[0];

  let myHtml = `
    <p>This doctor's account has (or may have) appointments and consultations linked to it,
    so it will be <strong>deactivated</strong> (soft delete on the USERS record) instead of
    permanently removed. You can restore it later.</p>
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
    if (await deleteDoctorRecord(d.DoctorID) == 1) {
      refreshDisplay();
      alert("Doctor has been deactivated!");
      myModal.hide();
    } else {
      alert("ERROR");
    }
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

const deleteDoctorRecord = async (doctorId) => {
  const params = {
    operation: "deleteDoctor",
    json: JSON.stringify({ doctorId: doctorId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/doctors.php`, {
    params: params,
  });
  return response.data;
};
