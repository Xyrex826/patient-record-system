<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Diagnosis {

    // Returns ALL diagnoses (Active + Inactive) - used by the admin master file screen
    function getAllDiagnoses() {
        include "connection-pdo.php";
        $sql = "SELECT * FROM DIAGNOSIS_ICD10 ORDER BY DiagnosisName";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    // Returns only Active diagnoses - this is what the Consultation
    // transaction module should call when a doctor picks a diagnosis.
    function getActiveDiagnoses() {
        include "connection-pdo.php";
        $sql = "SELECT * FROM DIAGNOSIS_ICD10 WHERE Status = 'Active' ORDER BY DiagnosisName";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    function getDiagnosis($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "SELECT * FROM DIAGNOSIS_ICD10 WHERE DiagnosisID = :diagnosisId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":diagnosisId", $json['diagnosisId']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    function insertDiagnosis($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "INSERT INTO DIAGNOSIS_ICD10(ICD10Code, DiagnosisName, Description, Status)
                VALUES(:icd10Code, :name, :description, 'Active')";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":icd10Code", $json['icd10Code']);
        $stmt->bindParam(":name", $json['name']);
        $stmt->bindParam(":description", $json['description']);
        $stmt->execute();
        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode($returnValue);
    }

    function updateDiagnosis($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "UPDATE DIAGNOSIS_ICD10
                SET ICD10Code = :icd10Code, DiagnosisName = :name, Description = :description
                WHERE DiagnosisID = :diagnosisId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":icd10Code", $json['icd10Code']);
        $stmt->bindParam(":name", $json['name']);
        $stmt->bindParam(":description", $json['description']);
        $stmt->bindParam(":diagnosisId", $json['diagnosisId']);
        $stmt->execute();
        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode($returnValue);
    }

    // SOFT DELETE: diagnoses will be referenced by CONSULTATION_DIAGNOSIS,
    // a record of real past consultations, so we never physically remove
    // a diagnosis code - just flip Status to 'Inactive'.
    function deleteDiagnosis($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "UPDATE DIAGNOSIS_ICD10 SET Status = 'Inactive' WHERE DiagnosisID = :diagnosisId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":diagnosisId", $json['diagnosisId']);
        $stmt->execute();
        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode($returnValue);
    }

    function restoreDiagnosis($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "UPDATE DIAGNOSIS_ICD10 SET Status = 'Active' WHERE DiagnosisID = :diagnosisId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":diagnosisId", $json['diagnosisId']);
        $stmt->execute();
        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode($returnValue);
    }
}

// submitted by the client - operation and json
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $operation = $_GET['operation'];
    $json = isset($_GET['json']) ? $_GET['json'] : "";
} else if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $operation = $_POST['operation'];
    $json = isset($_POST['json']) ? $_POST['json'] : "";
}

$diagnosis = new Diagnosis();
switch ($operation) {
    case "getAllDiagnoses":
        echo $diagnosis->getAllDiagnoses();
        break;
    case "getActiveDiagnoses":
        echo $diagnosis->getActiveDiagnoses();
        break;
    case "getDiagnosis":
        echo $diagnosis->getDiagnosis($json);
        break;
    case "insertDiagnosis":
        echo $diagnosis->insertDiagnosis($json);
        break;
    case "updateDiagnosis":
        echo $diagnosis->updateDiagnosis($json);
        break;
    case "deleteDiagnosis":
        echo $diagnosis->deleteDiagnosis($json);
        break;
    case "restoreDiagnosis":
        echo $diagnosis->restoreDiagnosis($json);
        break;
}
?>
