export const updateModal = async (medicineId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Update Medicine";

  const medicine = await getMedicineDetails(medicineId);
  const m = medicine[0];

  const dosageForms = ["Tablet", "Capsule", "Syrup", "Suspension", "Injection", "Inhaler", "Ointment", "Cream", "Drops", "Other"];
  const dosageOptions = dosageForms
    .map((form) => `<option value="${form}" ${m.DosageForm === form ? "selected" : ""}>${form}</option>`)
    .join("");

  const myHtml = `
    <div class="col-12 mb-2">
      <label class="form-label">Medicine Name</label>
      <input type="text" class="form-control" id="upd-medicine-name" value="${m.MedicineName}" />
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Dosage Form</label>
      <select class="form-select" id="upd-dosage-form">${dosageOptions}</select>
    </div>
    <div class="col-12 mb-2">
      <label class="form-label">Description</label>
      <textarea class="form-control" id="upd-description" rows="2">${m.Description ?? ""}</textarea>
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
      medicineId: m.MedicineID,
      medicineName: document.getElementById("upd-medicine-name").value,
      dosageForm: document.getElementById("upd-dosage-form").value,
      description: document.getElementById("upd-description").value,
    };

    if (await updateMedicine(jsonData) == 1) {
      refreshDisplay();
      alert("Medicine updated!");
      myModal.hide();
    } else {
      alert("ERROR");
    }
  });

  myModal.show();
};

const getMedicineDetails = async (medicineId) => {
  const params = {
    operation: "getMedicine",
    json: JSON.stringify({ medicineId: medicineId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/medicines.php`, {
    params: params,
  });
  return response.data;
};

const updateMedicine = async (jsonData) => {
  const formData = new FormData();
  formData.append("operation", "updateMedicine");
  formData.append("json", JSON.stringify(jsonData));

  const response = await axios({
    url: `${sessionStorage.baseAPIUrl}/medicines.php`,
    method: "POST",
    data: formData,
  });
  return response.data;
};
