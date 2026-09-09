export const viewModal = async (specializationId) => {
  document.getElementById("blank-modal-title").innerText = "Specialization Details";

  const specialization = await getSpecializationDetails(specializationId);
  const s = specialization[0];

  const myHtml = `
    <table class="table table-sm">
      <tr>
        <td>Specialization ID</td>
        <td>${s.SpecializationID}</td>
      </tr>
      <tr>
        <td>Name</td>
        <td>${s.SpecializationName}</td>
      </tr>
      <tr>
        <td>Description</td>
        <td>${s.Description ?? ""}</td>
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
