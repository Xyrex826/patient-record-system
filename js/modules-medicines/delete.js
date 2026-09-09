export const deleteModal = async (medicineId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Confirm Deactivate";

  const medicine = await getMedicineDetails(medicineId);
  const m = medicine[0];

  let myHtml = `
    <p>This medicine has (or may have) prescriptions linked to it, so its record will be
    <strong>deactivated</strong> (soft delete) instead of permanently removed. You can restore
    it later.</p>
    <table class="table table-sm">
      <tr>
        <td>Medicine ID</td>
        <td>${m.MedicineID}</td>
      </tr>
      <tr>
        <td>Medicine Name</td>
        <td>${m.MedicineName}</td>
      </tr>
      <tr>
        <td>Dosage Form</td>
        <td>${m.DosageForm}</td>
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
    if (await deleteMedicineRecord(m.MedicineID) == 1) {
      refreshDisplay();
      alert("Medicine has been deactivated!");
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

const deleteMedicineRecord = async (medicineId) => {
  const params = {
    operation: "deleteMedicine",
    json: JSON.stringify({ medicineId: medicineId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/medicines.php`, {
    params: params,
  });
  return response.data;
};
