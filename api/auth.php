<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Auth {

    private function isValidUsername($username) {
        $username = trim($username ?? "");
        // Letters, numbers, underscore, 3-50 chars - keeps it simple and
        // safe to use as-is in the UI (nav bar greeting, etc.)
        return preg_match('/^[A-Za-z0-9_]{3,50}$/', $username) === 1;
    }

    // Roles a person can pick for themselves on the Sign Up page.
    // 'Doctor' is deliberately left out: per the ERD a Doctor account
    // is USERS + DOCTOR (+ DOCTOR_SPECIALIZATION), and that combined
    // record is already created end-to-end from the Doctors master
    // file (api/doctors.php -> insertDoctor). Self-service sign up
    // only ever touches ROLE/USERS, so it's limited to roles that
    // don't need a second table filled in behind them.
    function getSignupRoles() {
        include "connection-pdo.php";
        $sql = "SELECT RoleID, RoleName, Description FROM ROLE WHERE RoleName != 'Doctor' ORDER BY RoleName";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($rs);
    }

    function login($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $username = trim($json['username'] ?? "");
        $password = $json['password'] ?? "";

        if ($username === "" || $password === "") {
            return json_encode(["error" => "missing_fields"]);
        }

        $sql = "SELECT u.UserID, u.Username, u.Password, u.FirstName, u.LastName, u.Status,
                       r.RoleID, r.RoleName
                FROM USERS u
                JOIN ROLE r ON u.RoleID = r.RoleID
                WHERE u.Username = :username";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":username", $username);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // NOTE: passwords are stored/compared as plain text here to match
        // the class's teaching pattern (see api/doctors.php). In a real
        // system you'd use password_hash() / password_verify() instead.
        if (!$user || $user['Password'] !== $password) {
            return json_encode(["error" => "invalid_credentials"]);
        }
        if ($user['Status'] !== 'Active') {
            return json_encode(["error" => "account_inactive"]);
        }

        unset($user['Password']);
        return json_encode(["success" => true, "user" => $user]);
    }

    function register($json) {
        include "connection-pdo.php";
        $json = json_decode($json, true);
        $firstName = trim($json['firstName'] ?? "");
        $lastName = trim($json['lastName'] ?? "");
        $username = trim($json['username'] ?? "");
        $password = $json['password'] ?? "";
        $roleId = $json['roleId'] ?? "";

        if ($firstName === "" || $lastName === "" || $username === "" || $password === "" || $roleId === "") {
            return json_encode(["error" => "missing_fields"]);
        }
        if (!$this->isValidUsername($username)) {
            return json_encode(["error" => "invalid_username"]);
        }
        if (strlen($password) < 6) {
            return json_encode(["error" => "weak_password"]);
        }

        // Block signing up as 'Doctor' even if a roleId is forged client-side.
        $roleCheckSql = "SELECT RoleName FROM ROLE WHERE RoleID = :roleId";
        $roleCheckStmt = $conn->prepare($roleCheckSql);
        $roleCheckStmt->bindParam(":roleId", $roleId);
        $roleCheckStmt->execute();
        $role = $roleCheckStmt->fetch(PDO::FETCH_ASSOC);
        if (!$role || $role['RoleName'] === 'Doctor') {
            return json_encode(["error" => "invalid_role"]);
        }

        $dupSql = "SELECT UserID FROM USERS WHERE Username = :username";
        $dupStmt = $conn->prepare($dupSql);
        $dupStmt->bindParam(":username", $username);
        $dupStmt->execute();
        if ($dupStmt->fetch()) {
            return json_encode(["error" => "username_taken"]);
        }

        $sql = "INSERT INTO USERS (RoleID, Username, Password, FirstName, LastName, Status)
                VALUES (:roleId, :username, :password, :firstName, :lastName, 'Active')";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(":roleId", $roleId);
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":password", $password);
        $stmt->bindParam(":firstName", $firstName);
        $stmt->bindParam(":lastName", $lastName);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        return json_encode(["success" => $returnValue === 1]);
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

$auth = new Auth();
switch ($operation) {
    case "getSignupRoles":
        echo $auth->getSignupRoles();
        break;
    case "login":
        echo $auth->login($json);
        break;
    case "register":
        echo $auth->register($json);
        break;
}
?>
