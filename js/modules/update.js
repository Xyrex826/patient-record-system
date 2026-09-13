// Phone is optional, but if typed in it must be 7-15 digits only -
// no "-" (so no negative numbers), "+", letters, or spaces.
const isValidPhone = (phone) => phone.trim() === "" || /^[0-9]{7,15}$/.test(phone.trim());

export const updateModal = async (patientId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Update Patient";

  const patient = await getPatientDetails(patientId);
  const p = patient[0];

  const myHtml = `
    <div class="col-12 mb-2">
      <label class="form-label">Last Name</label>
      <input type="text" class="form-control" id="upd-last-name" value="${p.LastName}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">First Name</label>
      <input type="text" class="form-control" id="upd-first-name" value="${p.FirstName}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Date of Birth</label>
      <input type="date" class="form-control" id="upd-dob" value="${p.DateOfBirth}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Gender</label>
      <select class="form-select" id="upd-gender">
        <option value="Male" ${p.Gender === "Male" ? "selected" : ""}>Male</option>
        <option value="Female" ${p.Gender === "Female" ? "selected" : ""}>Female</option>
        <option value="Other" ${p.Gender === "Other" ? "selected" : ""}>Other</option>
      </select>
      <input
        type="text"
        class="form-control mt-2"
        id="upd-gender-details"
        placeholder="Please specify"
        value="${p.Gender === "Other" ? p.GenderDetails ?? "" : ""}"
        style="${p.Gender === "Other" ? "" : "display: none;"}"
      />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Phone</label>
      <input type="text" class="form-control" id="upd-phone" value="${p.Phone ?? ""}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Address</label>
      <input type="text" class="form-control" id="upd-address" value="${p.Address ?? ""}" />
    </div>
  `;

  document.getElementById("blank-main-div").innerHTML = myHtml;

  document.getElementById("upd-gender").addEventListener("change", (event) => {
    const detailsInput = document.getElementById("upd-gender-details");
    detailsInput.style.display = event.target.value === "Other" ? "block" : "none";
    if (event.target.value !== "Other") detailsInput.value = "";
  });

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
      patientId: p.PatientID,
      lastName: document.getElementById("upd-last-name").value,
      firstName: document.getElementById("upd-first-name").value,
      dob: document.getElementById("upd-dob").value,
      gender: document.getElementById("upd-gender").value,
      genderDetails: document.getElementById("upd-gender-details").value,
      phone: document.getElementById("upd-phone").value,
      address: document.getElementById("upd-address").value,
    };

    if (jsonData.gender === "Other" && !jsonData.genderDetails.trim()) {
      alert("Please specify the gender.");
      return;
    }

    if (!isValidPhone(jsonData.phone)) {
      alert("Phone must contain digits only (7-15 digits), with no negative sign or letters.");
      return;
    }

    const result = await updatePatient(jsonData);
    if (result == 1) {
      refreshDisplay();
      alert("Patient updated!");
      myModal.hide();
    } else if (result?.error === "invalid_phone") {
      alert("Phone must contain digits only (7-15 digits), with no negative sign or letters.");
    } else if (result?.error === "gender_details_required") {
      alert("Please specify the gender.");
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

const updatePatient = async (jsonData) => {
  const formData = new FormData();
  formData.append("operation", "updatePatient");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${sessionStorage.baseAPIUrl}/patients.php`,
    method: "POST",
    data: formData,
  });
  return response.data;
};
