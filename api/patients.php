<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Patient {

    // Phone is optional, but if the admin does type one in it must be
    // 7-15 digits only - no "-", "+", letters, spaces, etc. This is what
    // blocks a negative number (or any other garbage) from being saved.
    private function isValidPhone($phone) {
        $phone = trim($phone ?? "");
        return $phone === "" || preg_match('/^[0-9]{7,15}$/', $phone) === 1;
    }

    // Returns ALL patients (Active + Inactive) - used by the admin master file screen
    function getAllPatients() {
        include "connection-pdo.php";
        $sql = "SELECT * FROM PATIENT ORDER BY LastName, FirstName";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    // Returns only Active patients - this is what transaction modules
    // (Appointments, Consultations, Billing) should call when they need
    // to let a user pick a patient.
    function getActivePatients() {
        include "connection-pdo.php";
        $sql = "SELECT * FROM PATIENT WHERE Status = 'Active' ORDER BY LastName, FirstName";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    function getPatient($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "SELECT * FROM PATIENT WHERE PatientID = :patientId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":patientId", $json['patientId']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    function insertPatient($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);

        if (!$this->isValidPhone($json['phone'])) {
            return json_encode(["error" => "invalid_phone"]);
        }

        $sql = "INSERT INTO PATIENT (FirstName, LastName, DateOfBirth, Gender, Phone, Address, Status)
                VALUES (:firstName, :lastName, :dob, :gender, :phone, :address, 'Active')";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":firstName", $json['firstName']);
        $stmt->bindParam(":lastName", $json['lastName']);
        $stmt->bindParam(":dob", $json['dob']);
        $stmt->bindParam(":gender", $json['gender']);
        $stmt->bindParam(":phone", $json['phone']);
        $stmt->bindParam(":address", $json['address']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        return json_encode($returnValue);
    }

    function updatePatient($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);

        if (!$this->isValidPhone($json['phone'])) {
            return json_encode(["error" => "invalid_phone"]);
        }

        $sql = "UPDATE PATIENT SET
                    FirstName = :firstName,
                    LastName = :lastName,
                    DateOfBirth = :dob,
                    Gender = :gender,
                    Phone = :phone,
                    Address = :address
                WHERE PatientID = :patientId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":firstName", $json['firstName']);
        $stmt->bindParam(":lastName", $json['lastName']);
        $stmt->bindParam(":dob", $json['dob']);
        $stmt->bindParam(":gender", $json['gender']);
        $stmt->bindParam(":phone", $json['phone']);
        $stmt->bindParam(":address", $json['address']);
        $stmt->bindParam(":patientId", $json['patientId']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode($returnValue);
    }

    // SOFT DELETE: patients are referenced by Appointments, Consultations
    // and Billing, so we never physically remove the row. We just mark it
    // Inactive so it drops out of transaction pickers but historical
    // records that point to this PatientID stay valid.
    function deletePatient($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "UPDATE PATIENT SET Status = 'Inactive' WHERE PatientID = :patientId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":patientId", $json['patientId']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode($returnValue);
    }

    // Reverses a soft delete
    function restorePatient($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "UPDATE PATIENT SET Status = 'Active' WHERE PatientID = :patientId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":patientId", $json['patientId']);
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

$patient = new Patient();
switch ($operation) {
    case "getAllPatients":
        echo $patient->getAllPatients();
        break;
    case "getActivePatients":
        echo $patient->getActivePatients();
        break;
    case "getPatient":
        echo $patient->getPatient($json);
        break;
    case "insertPatient":
        echo $patient->insertPatient($json);
        break;
    case "updatePatient":
        echo $patient->updatePatient($json);
        break;
    case "deletePatient":
        echo $patient->deletePatient($json);
        break;
    case "restorePatient":
        echo $patient->restorePatient($json);
        break;
}
?>
