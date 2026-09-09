export const updateModal = async (specializationId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Update Specialization";

  const specialization = await getSpecializationDetails(specializationId);
  const s = specialization[0];

  const myHtml = `
    <div class="col-12 mb-2">
      <label class="form-label">Specialization Name</label>
      <input type="text" class="form-control" id="upd-name" value="${s.SpecializationName}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Description</label>
      <textarea class="form-control" id="upd-description" rows="2">${s.Description ?? ""}</textarea>
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
      specializationId: s.SpecializationID,
      name: document.getElementById("upd-name").value,
      description: document.getElementById("upd-description").value,
    };

    if (!jsonData.name) {
      alert("Specialization Name is required.");
      return;
    }

    if ((await updateSpecialization(jsonData)) == 1) {
      refreshDisplay();
      alert("Specialization updated!");
      myModal.hide();
    } else {
      alert("ERROR");
    }
  });

  myModal.show();
};

const getSpecializationDetails = async (specializationId) => {
  const params = {
    operation: "getSpecialization",
    json: JSON.stringify({ specializationId: specializationId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/specializations.php`, {
    params: params,
  });
  return response.data;
};

const updateSpecialization = async (jsonData) => {
  const formData = new FormData();
  formData.append("operation", "updateSpecialization");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${sessionStorage.baseAPIUrl}/specializations.php`,
    method: "POST",
    data: formData,
  });
  return response.data;
};
