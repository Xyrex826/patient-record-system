export const viewModal = async (medicineId) => {
  document.getElementById("blank-modal-title").innerText = "Medicine Details";

  const medicine = await getMedicineDetails(medicineId);

  const myHtml = `
    <table class="table table-sm">
      <tr>
        <td>Medicine ID</td>
        <td>${medicine[0].MedicineID}</td>
      </tr>
      <tr>
        <td>Medicine Name</td>
        <td>${medicine[0].MedicineName}</td>
      </tr>
      <tr>
        <td>Dosage Form</td>
        <td>${medicine[0].DosageForm}</td>
      </tr>
      <tr>
        <td>Description</td>
        <td>${medicine[0].Description ?? ""}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td>${medicine[0].Status}</td>
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
