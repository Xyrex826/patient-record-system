<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Specialization {

    // Used to populate the specialization multi-select on the Doctor form.
    // Kept for backward compatibility with doctors.html.
    function getSpecializations() {
        include "connection-pdo.php";
        $sql = "SELECT * FROM SPECIALIZATION ORDER BY SpecializationName";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    // Returns ALL specializations - used by the admin master file table.
    // (There is no Active/Inactive concept here - see deleteSpecialization.)
    function getAllSpecializations() {
        include "connection-pdo.php";
        $sql = "SELECT s.*,
                       (SELECT COUNT(*) FROM DOCTOR_SPECIALIZATION ds
                        WHERE ds.SpecializationID = s.SpecializationID) AS DoctorCount
                FROM SPECIALIZATION s
                ORDER BY s.SpecializationName";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    function getSpecialization($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "SELECT * FROM SPECIALIZATION WHERE SpecializationID = :specializationId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":specializationId", $json['specializationId']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    // Case-insensitive, whitespace-trimmed duplicate check. $excludeId lets
    // updateSpecialization ignore the row being edited (so saving a record
    // without changing its name doesn't flag itself as a duplicate).
    private function specializationNameExists($conn, $name, $excludeId = null) {
        $sql = "SELECT COUNT(*) AS cnt FROM SPECIALIZATION
                WHERE LOWER(TRIM(SpecializationName)) = LOWER(TRIM(:name))";
        if ($excludeId !== null) {
            $sql .= " AND SpecializationID != :excludeId";
        }
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":name", $name);
        if ($excludeId !== null) {
            $stmt->bindParam(":excludeId", $excludeId);
        }
        $stmt->execute();
        return (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'] > 0;
    }

    function insertSpecialization($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $name = trim($json['name']);

        if ($name === "") {
            return json_encode(["error" => "empty_name"]);
        }
        if ($this->specializationNameExists($conn, $name)) {
            return json_encode(["error" => "duplicate"]);
        }

        $sql = "INSERT INTO SPECIALIZATION(SpecializationName, Description)
                VALUES(:name, :description)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $json['description']);
        $stmt->execute();
        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode($returnValue);
    }

    function updateSpecialization($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $name = trim($json['name']);

        if ($name === "") {
            return json_encode(["error" => "empty_name"]);
        }
        if ($this->specializationNameExists($conn, $name, $json['specializationId'])) {
            return json_encode(["error" => "duplicate"]);
        }

        $sql = "UPDATE SPECIALIZATION
                SET SpecializationName = :name, Description = :description
                WHERE SpecializationID = :specializationId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $json['description']);
        $stmt->bindParam(":specializationId", $json['specializationId']);
        $stmt->execute();
        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode($returnValue);
    }

    // HARD DELETE, guarded by a usage check.
    // Unlike PATIENT/USERS/MEDICINE, SPECIALIZATION isn't referenced by any
    // transaction table (Appointment, Consultation, Billing, Prescription) -
    // it's only linked to DOCTOR through the DOCTOR_SPECIALIZATION junction.
    // So there's no clinical/billing history to protect, and a real physical
    // delete is fine PROVIDED no doctor currently has this specialization
    // assigned (otherwise we'd orphan DOCTOR_SPECIALIZATION rows / violate
    // the FK). If it's in use, we block the delete and tell the admin how
    // many doctors reference it instead of silently failing.
    function deleteSpecialization($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $specializationId = $json['specializationId'];

        $checkSql = "SELECT COUNT(*) AS cnt FROM DOCTOR_SPECIALIZATION WHERE SpecializationID = :id";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bindParam(":id", $specializationId);
        $checkStmt->execute();
        $inUse = (int) $checkStmt->fetch(PDO::FETCH_ASSOC)['cnt'];

        if ($inUse > 0) {
            return json_encode(["error" => "in_use", "count" => $inUse]);
        }

        $sql = "DELETE FROM SPECIALIZATION WHERE SpecializationID = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":id", $specializationId);
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

$specialization = new Specialization();
switch ($operation) {
    case "getSpecializations":
        echo $specialization->getSpecializations();
        break;
    case "getAllSpecializations":
        echo $specialization->getAllSpecializations();
        break;
    case "getSpecialization":
        echo $specialization->getSpecialization($json);
        break;
    case "insertSpecialization":
        echo $specialization->insertSpecialization($json);
        break;
    case "updateSpecialization":
        echo $specialization->updateSpecialization($json);
        break;
    case "deleteSpecialization":
        echo $specialization->deleteSpecialization($json);
        break;
}
?>
