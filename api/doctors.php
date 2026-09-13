<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Doctor {

    // Phone is optional, but if the admin does type one in it must be
    // 7-15 digits only - no "-", "+", letters, spaces, etc. This is what
    // blocks a negative number (or any other garbage) from being saved.
    private function isValidPhone($phone) {
        $phone = trim($phone ?? "");
        return $phone === "" || preg_match('/^[0-9]{7,15}$/', $phone) === 1;
    }

    // Returns ALL doctors (Active + Inactive) - used by the admin master file screen.
    // Joins USERS for identity/login info and GROUP_CONCATs specialization names
    // (from the DOCTOR_SPECIALIZATION junction) so the table can show them in one column.
    function getAllDoctors() {
        include "connection-pdo.php";
        $sql = "SELECT d.DoctorID, d.Phone, u.UserID, u.Username, u.FirstName, u.LastName, u.Status,
                       GROUP_CONCAT(s.SpecializationName ORDER BY s.SpecializationName SEPARATOR ', ') AS Specializations
                FROM DOCTOR d
                INNER JOIN USERS u ON d.UserID = u.UserID
                LEFT JOIN DOCTOR_SPECIALIZATION ds ON ds.DoctorID = d.DoctorID
                LEFT JOIN SPECIALIZATION s ON s.SpecializationID = ds.SpecializationID
                GROUP BY d.DoctorID, d.Phone, u.UserID, u.Username, u.FirstName, u.LastName, u.Status
                ORDER BY u.LastName, u.FirstName";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    // Active-only doctors - what transaction modules (Appointments, Consultations)
    // should call when they need to let a user pick a doctor.
    function getActiveDoctors() {
        include "connection-pdo.php";
        $sql = "SELECT d.DoctorID, d.Phone, u.UserID, u.Username, u.FirstName, u.LastName, u.Status,
                       GROUP_CONCAT(s.SpecializationName ORDER BY s.SpecializationName SEPARATOR ', ') AS Specializations
                FROM DOCTOR d
                INNER JOIN USERS u ON d.UserID = u.UserID
                LEFT JOIN DOCTOR_SPECIALIZATION ds ON ds.DoctorID = d.DoctorID
                LEFT JOIN SPECIALIZATION s ON s.SpecializationID = ds.SpecializationID
                WHERE u.Status = 'Active'
                GROUP BY d.DoctorID, d.Phone, u.UserID, u.Username, u.FirstName, u.LastName, u.Status
                ORDER BY u.LastName, u.FirstName";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    // Single doctor + the list of SpecializationIDs they currently have
    // (used to re-populate the multi-select when editing).
    function getDoctor($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);

        $sql = "SELECT d.DoctorID, d.Phone, u.UserID, u.Username, u.FirstName, u.LastName, u.Status
                FROM DOCTOR d
                INNER JOIN USERS u ON d.UserID = u.UserID
                WHERE d.DoctorID = :doctorId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":doctorId", $json['doctorId']);
        $stmt->execute();
        $doctor = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($doctor) > 0) {
            $sql2 = "SELECT s.SpecializationID, s.SpecializationName
                     FROM DOCTOR_SPECIALIZATION ds
                     INNER JOIN SPECIALIZATION s ON s.SpecializationID = ds.SpecializationID
                     WHERE ds.DoctorID = :doctorId
                     ORDER BY s.SpecializationName";
            $stmt2 = $conn->prepare($sql2);
            $stmt2->bindParam(":doctorId", $json['doctorId']);
            $stmt2->execute();
            $doctor[0]['specializations'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        }

        return json_encode($doctor);
    }

    // Creates the USERS row, the DOCTOR row, then the
    // DOCTOR_SPECIALIZATION rows - all in one transaction so a
    // doctor is never left half-created if a step fails.
    function insertDoctor($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $specializationIds = isset($json['specializationIds']) ? $json['specializationIds'] : [];

        if (!$this->isValidPhone($json['phone'])) {
            return json_encode(["error" => "invalid_phone"]);
        }

        try {
            $conn->beginTransaction();

            // Doctor role is looked up by name rather than hard-coded ID,
            // since ROLE is itself a lookup table an admin could re-order.
            $roleStmt = $conn->prepare("SELECT RoleID FROM ROLE WHERE RoleName = 'Doctor' LIMIT 1");
            $roleStmt->execute();
            $roleId = $roleStmt->fetchColumn();

            $sql = "INSERT INTO USERS (RoleID, Username, Password, FirstName, LastName, Status)
                    VALUES (:roleId, :username, :password, :firstName, :lastName, 'Active')";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(":roleId", $roleId);
            $stmt->bindParam(":username", $json['username']);
            $stmt->bindParam(":password", $json['password']);
            $stmt->bindParam(":firstName", $json['firstName']);
            $stmt->bindParam(":lastName", $json['lastName']);
            $stmt->execute();
            $userId = $conn->lastInsertId();

            $sql = "INSERT INTO DOCTOR (UserID, Phone) VALUES (:userId, :phone)";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(":userId", $userId);
            $stmt->bindParam(":phone", $json['phone']);
            $stmt->execute();
            $doctorId = $conn->lastInsertId();

            $this->saveSpecializations($conn, $doctorId, $specializationIds);

            $conn->commit();
            return json_encode(1);
        } catch (Exception $e) {
            $conn->rollBack();
            return json_encode(0);
        }
    }

    // Updates USERS (password only if a new one was provided) and DOCTOR.Phone,
    // then replaces the doctor's specialization set. Same transaction idea as insert.
    function updateDoctor($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $specializationIds = isset($json['specializationIds']) ? $json['specializationIds'] : [];

        if (!$this->isValidPhone($json['phone'])) {
            return json_encode(["error" => "invalid_phone"]);
        }

        try {
            $conn->beginTransaction();

            if (!empty($json['password'])) {
                $sql = "UPDATE USERS SET Username = :username, Password = :password,
                            FirstName = :firstName, LastName = :lastName
                        WHERE UserID = :userId";
            } else {
                $sql = "UPDATE USERS SET Username = :username,
                            FirstName = :firstName, LastName = :lastName
                        WHERE UserID = :userId";
            }
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(":username", $json['username']);
            if (!empty($json['password'])) {
                $stmt->bindParam(":password", $json['password']);
            }
            $stmt->bindParam(":firstName", $json['firstName']);
            $stmt->bindParam(":lastName", $json['lastName']);
            $stmt->bindParam(":userId", $json['userId']);
            $stmt->execute();

            $sql = "UPDATE DOCTOR SET Phone = :phone WHERE DoctorID = :doctorId";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(":phone", $json['phone']);
            $stmt->bindParam(":doctorId", $json['doctorId']);
            $stmt->execute();

            $del = $conn->prepare("DELETE FROM DOCTOR_SPECIALIZATION WHERE DoctorID = :doctorId");
            $del->bindParam(":doctorId", $json['doctorId']);
            $del->execute();

            $this->saveSpecializations($conn, $json['doctorId'], $specializationIds);

            $conn->commit();
            return json_encode(1);
        } catch (Exception $e) {
            $conn->rollBack();
            return json_encode(0);
        }
    }

    // Shared helper: inserts one DOCTOR_SPECIALIZATION row per selected specialization.
    private function saveSpecializations($conn, $doctorId, $specializationIds) {
        $sql = "INSERT INTO DOCTOR_SPECIALIZATION (DoctorID, SpecializationID) VALUES (:doctorId, :specId)";
        $stmt = $conn->prepare($sql);
        foreach ($specializationIds as $specId) {
            $stmt->bindParam(":doctorId", $doctorId);
            $stmt->bindParam(":specId", $specId);
            $stmt->execute();
        }
    }

    // SOFT DELETE: doctors are referenced by APPOINTMENT and (through
    // CONSULTATION) PROFESSIONAL_FEE, so we never physically remove
    // the account. We flip the linked USERS row to Inactive so the
    // doctor drops out of transaction pickers but historical records
    // that point to this DoctorID/UserID stay valid.
    function deleteDoctor($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "UPDATE USERS u
                INNER JOIN DOCTOR d ON d.UserID = u.UserID
                SET u.Status = 'Inactive'
                WHERE d.DoctorID = :doctorId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":doctorId", $json['doctorId']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode($returnValue);
    }

    // Reverses a soft delete
    function restoreDoctor($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $sql = "UPDATE USERS u
                INNER JOIN DOCTOR d ON d.UserID = u.UserID
                SET u.Status = 'Active'
                WHERE d.DoctorID = :doctorId";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":doctorId", $json['doctorId']);
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

$doctor = new Doctor();
switch ($operation) {
    case "getAllDoctors":
        echo $doctor->getAllDoctors();
        break;
    case "getActiveDoctors":
        echo $doctor->getActiveDoctors();
        break;
    case "getDoctor":
        echo $doctor->getDoctor($json);
        break;
    case "insertDoctor":
        echo $doctor->insertDoctor($json);
        break;
    case "updateDoctor":
        echo $doctor->updateDoctor($json);
        break;
    case "deleteDoctor":
        echo $doctor->deleteDoctor($json);
        break;
    case "restoreDoctor":
        echo $doctor->restoreDoctor($json);
        break;
}
?>
