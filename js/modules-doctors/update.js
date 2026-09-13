export const updateModal = async (doctorId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Update Doctor";

  const doctor = await getDoctorDetails(doctorId);
  const d = doctor[0];
  const specializations = await getSpecializations();
  const selectedIds = d.specializations.map((s) => String(s.SpecializationID));

  const checkboxes = specializations
    .map(
      (s) => `
        <div class="form-check">
          <input
            type="checkbox"
            class="form-check-input"
            id="upd-spec-${s.SpecializationID}"
            value="${s.SpecializationID}"
            ${selectedIds.includes(String(s.SpecializationID)) ? "checked" : ""}
          />
          <label class="form-check-label" for="upd-spec-${s.SpecializationID}">
            ${s.SpecializationName}
          </label>
        </div>
      `
    )
    .join("");

  const myHtml = `
    <div class="col-12 mb-2">
      <label class="form-label">Last Name</label>
      <input type="text" class="form-control" id="upd-last-name" value="${d.LastName}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">First Name</label>
      <input type="text" class="form-control" id="upd-first-name" value="${d.FirstName}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Username</label>
      <input type="text" class="form-control" id="upd-username" value="${d.Username}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Password</label>
      <input type="password" class="form-control" id="upd-password" placeholder="Leave blank to keep current password" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Phone</label>
      <input type="text" class="form-control" id="upd-phone" value="${d.Phone ?? ""}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Specializations</label>
      <div
        id="upd-specializations"
        class="border rounded p-2"
        style="max-height: 140px; overflow-y: auto;"
      >${checkboxes}</div>
      <div class="form-text">Check all specializations that apply.</div>
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
    const specContainer = document.getElementById("upd-specializations");
    const jsonData = {
      doctorId: d.DoctorID,
      userId: d.UserID,
      lastName: document.getElementById("upd-last-name").value,
      firstName: document.getElementById("upd-first-name").value,
      username: document.getElementById("upd-username").value,
      password: document.getElementById("upd-password").value, // blank = keep current
      phone: document.getElementById("upd-phone").value,
      specializationIds: [
        ...specContainer.querySelectorAll("input[type='checkbox']:checked"),
      ].map((checkbox) => checkbox.value),
    };

    if (await updateDoctor(jsonData) == 1) {
      refreshDisplay();
      alert("Doctor updated!");
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

const getSpecializations = async () => {
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/specializations.php`, {
    params: { operation: "getSpecializations" },
  });
  return response.data;
};

const updateDoctor = async (jsonData) => {
  const formData = new FormData();
  formData.append("operation", "updateDoctor");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${sessionStorage.baseAPIUrl}/doctors.php`,
    method: "POST",
    data: formData,
  });
  return response.data;
};
