export const deleteModal = async (specializationId, refreshDisplay) => {
  document.getElementById("blank-modal-title").innerText = "Confirm Delete";

  const specialization = await getSpecializationDetails(specializationId);
  const s = specialization[0];

  let myHtml = `
    <p>Specializations aren't referenced by any appointment, consultation, or billing record -
    they're only linked to doctors - so deleting one here <strong>permanently removes it</strong>
    (hard delete). If any doctor still has this specialization assigned, the delete will be
    blocked until it's removed from that doctor first.</p>
    <table class="table table-sm">
      <tr>
        <td>Specialization ID</td>
        <td>${s.SpecializationID}</td>
      </tr>
      <tr>
        <td>Name</td>
        <td>${s.SpecializationName}</td>
      </tr>
    </table>
  `;
  document.getElementById("blank-main-div").innerHTML = myHtml;

  const modalFooter = document.getElementById("blank-modal-footer");
  modalFooter.innerHTML = `
    <div class="btn-group w-100" role="group">
      <button type="button" class="btn btn-danger btn-sm w-100 me-2 btn-delete">Delete Permanently</button>
      <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
    </div>
  `;

  const myModal = new bootstrap.Modal(document.getElementById("blank-modal"), {
    keyboard: true,
    backdrop: "static",
  });

  modalFooter.querySelector(".btn-delete").addEventListener("click", async () => {
    const result = await deleteSpecializationRecord(s.SpecializationID);

    if (result && typeof result === "object" && result.error === "in_use") {
      alert(
        `Can't delete "${s.SpecializationName}" - it's still assigned to ${result.count} doctor(s). ` +
          `Remove it from those doctors on the Doctors page first.`
      );
      return;
    }

    if (result == 1) {
      refreshDisplay();
      alert("Specialization has been deleted!");
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

const deleteSpecializationRecord = async (specializationId) => {
  const params = {
    operation: "deleteSpecialization",
    json: JSON.stringify({ specializationId: specializationId }),
  };
  const response = await axios.get(`${sessionStorage.baseAPIUrl}/specializations.php`, {
    params: params,
  });
  return response.data;
};
