# Patient Record System — Master Files (Milestone 1)

All five master file modules are implemented: **Patients**, **Doctors**, **Medicines**,
**Specializations**, and **Diagnoses / ICD-10**. All give the admin a CRUD screen, but Doctors is
more involved because a "Doctor" is not one flat table in the ERD — see below.

A **Login** / **Sign Up** flow now sits in front of all of that, and a **Home** dashboard is the
first thing you see after signing in — see [Login, Sign Up & Home](#login-sign-up--home) below.

## Setup
1. Import `database/patient_record_system.sql` into MySQL. It creates the `patient_record_system`
   database and:
   - `PATIENT` (10 sample rows: 9 Active, 1 Inactive)
   - `ROLE`, `USERS`, `SPECIALIZATION`, `DOCTOR`, `DOCTOR_SPECIALIZATION` (10 sample doctors:
     9 Active, 1 Inactive, one with two specializations to show the many-to-many link)
   - `MEDICINE` (10 sample rows: 9 Active, 1 Inactive)
   - `DIAGNOSIS_ICD10` (10 sample rows: 9 Active, 1 Inactive)

   **Already imported this before?** `CREATE TABLE IF NOT EXISTS` skips tables that already exist,
   but the `INSERT` statements underneath will still try to run and fail with a duplicate-key
   error (e.g. `#1062 - Duplicate entry 'jramirez'`) if you re-run the same file on a database that
   already has this data. Either run `DROP DATABASE IF EXISTS patient_record_system;` first and
   then re-import the whole file, or just skip re-importing — your existing tables and rows are
   already there.
2. Edit `api/connection-pdo.php` with your MySQL credentials if they differ from the XAMPP defaults.
3. Put this whole `patient-record-system` folder inside your web server's document root
   (e.g. `htdocs/patient-record-system` for XAMPP).
4. Update `baseApiUrl` in `js/login.js`, `js/register.js`, `js/home.js`, `js/index.js`,
   `js/index-doctors.js`, `js/index-medicines.js`, `js/index-specializations.js`, and
   `js/index-diagnoses.js` if your folder path differs from
   `http://localhost/patient-record-system/api`.
5. Open `login.html` through `http://localhost/...` (not `file://`) so the AJAX calls work. Sign
   in with one of the sample accounts above, or sign up for a new one, and you'll land on
   `home.html`, which links out to `index.html` (Patients), `doctors.html` (Doctors),
   `medicines.html` (Medicines), `specializations.html` (Specializations), and `diagnoses.html`
   (Diagnoses / ICD-10). The nav bar on every page links between all of them, plus a Logout button.

## Login, Sign Up & Home
No new tables were added for this — it reuses the `ROLE` and `USERS` tables that already existed
for the Doctors module.

- **`login.html`** — sign-in form. Checks the username/password against `USERS` (joined to `ROLE`
  for the role name), and blocks the login if the account's `Status` is `Inactive`. On success the
  user's `UserID`, `Username`, `FirstName`, `LastName`, `RoleID`, and `RoleName` are kept in
  `sessionStorage` under `currentUser`, and the browser is sent to `home.html`.
- **`register.html`** — sign-up form (First/Last Name, Username, Password, Account Type). The
  Account Type dropdown only offers **Admin** and **Staff**, not **Doctor** — a Doctor record is
  `USERS` + `DOCTOR` (+ specializations), and that combined record is already created end-to-end
  from the Doctors master file (`api/doctors.php` → `insertDoctor`), so self-service sign up
  deliberately doesn't try to recreate that. `api/auth.php` also re-checks the role server-side in
  case `Doctor` is ever submitted anyway.
- **`home.html`** — the post-login landing page. Greets the signed-in user by name/role and shows a
  card per module (Patients, Doctors, Medicines, Specializations, Diagnoses) linking into the
  existing screens.
- **`js/auth-guard.js`** — included on `home.html` and all five master file pages. Redirects to
  `login.html` if no `currentUser` is in `sessionStorage`, and otherwise fills in the "Signed in as
  ... | Logout" control now shown on the right side of every nav bar.

### Try it right away
Two sample accounts are seeded by the SQL file:

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |
| `frontdesk` | `staff123` | Staff |

### API operations (`api/auth.php`)
| operation | method | purpose |
|---|---|---|
| `login` | POST | checks credentials, returns the user (minus password) or an error |
| `register` | POST | creates a new `USERS` row (Admin/Staff only) |
| `getSignupRoles` | GET | roles the Sign Up page is allowed to offer (everything except Doctor) |

**Note:** exactly like the rest of this project, `Password` is compared/stored as plain text to
match the class's teaching pattern — in a real system you'd use `password_hash()` /
`password_verify()`.

## Patients — what's included
- **Create**: form at the top of the page → "Add Patient".
- **Read**: table lists all patients; toggle "Show inactive patients" to include deactivated ones.
- **Update**: "Update" button opens a modal with an editable form.
- **Delete (soft)**: "Delete" button deactivates the patient (`Status = 'Inactive'`) instead of
  removing the row. A "Restore" button reactivates them.

### Hard delete vs. soft delete — why Patients uses soft delete
Patients are referenced by `APPOINTMENT`, `CONSULTATION`, and `BILLING`. Physically deleting a
patient row would break or orphan every appointment/consultation/bill tied to that `PatientID`,
destroying medical and billing history. So `PATIENT` has a `Status` column (`Active` / `Inactive`);
"deleting" a patient just flips it, which hides them from `getActivePatients` (what transaction
modules should call) while `getAllPatients` (the admin view) still shows them for review/restore.

### API operations (`api/patients.php`)
| operation | method | purpose |
|---|---|---|
| `getAllPatients` | GET | all patients, for the admin master file table |
| `getActivePatients` | GET | active-only patients, for transaction modules to reference |
| `getPatient` | GET | single patient by `patientId` |
| `insertPatient` | POST | create a new patient |
| `updatePatient` | POST | edit an existing patient |
| `deletePatient` | GET | soft delete (sets `Status = 'Inactive'`) |
| `restorePatient` | GET | undo a soft delete (`Status = 'Active'`) |

## Doctors — what's included

### Why Doctors touches 4 tables, not 1
Per the ERD, a doctor's identity/login lives in **USERS** (`Username`, `Password`, `FirstName`,
`LastName`, `Status`, `RoleID`), not on `DOCTOR` itself. `DOCTOR` only adds `Phone` and links back
to `USERS`. Specializations are a separate lookup table (`SPECIALIZATION`), connected to `DOCTOR`
through a many-to-many junction (`DOCTOR_SPECIALIZATION`), since one doctor can have more than one
specialization. The Doctors screen presents all of this as a single "Doctor" record, but under the
hood:

```
ROLE  <---  USERS  --- 1:1 ---  DOCTOR  --- M:N (via DOCTOR_SPECIALIZATION) ---  SPECIALIZATION
```

- **Create**: form → "Add Doctor". Creates the `USERS` row (Role looked up by name = `'Doctor'`),
  then the `DOCTOR` row, then one `DOCTOR_SPECIALIZATION` row per specialization picked in the
  multi-select — all inside one DB transaction (`api/doctors.php`'s `insertDoctor`), so a doctor
  is never left half-created if a step fails.
- **Read**: table lists all doctors (name, username, phone, a comma-joined list of specialization
  names via `GROUP_CONCAT`, status); toggle "Show inactive doctors" to include deactivated ones.
- **Update**: modal re-populates the specialization multi-select with the doctor's current picks.
  Password field is optional — leave it blank to keep the current password; the API only updates
  it if a new value was sent.
- **Delete (soft)**: deactivates the linked `USERS` row (`Status = 'Inactive'`) — see reasoning
  below. A "Restore" button reactivates it.
- `api/specializations.php` exposes a read-only `getSpecializations` operation just to populate
  the multi-select — the same technique as `courses.php` populating the `<select id="course">` in
  the reference lecture material.

**Note:** `Password` is stored as plain text here to match the class's teaching pattern
(`students.php` does the same). In a real system you'd hash it (e.g. `password_hash()` /
`password_verify()` in PHP) before it ever reaches the database.

### Hard delete vs. soft delete — why Doctors uses soft delete
Doctors are referenced by `APPOINTMENT` and, through `CONSULTATION`, by `PROFESSIONAL_FEE`.
Physically deleting a doctor's account would break or orphan those records. So `USERS.Status`
(`Active` / `Inactive`) is the soft-delete flag for every account, doctors included: "deleting" a
doctor flips their linked `USERS` row to `Inactive`, hiding them from `getActiveDoctors` (what
Appointments/Consultations should call) while `getAllDoctors` (the admin view) still shows them
for review/restore, and every past appointment/consultation/fee tied to that `DoctorID` stays valid.

### API operations (`api/doctors.php`)
| operation | method | purpose |
|---|---|---|
| `getAllDoctors` | GET | all doctors + specialization list, for the admin master file table |
| `getActiveDoctors` | GET | active-only doctors, for transaction modules to reference |
| `getDoctor` | GET | single doctor by `doctorId`, plus their specialization IDs/names |
| `insertDoctor` | POST | creates USERS + DOCTOR + DOCTOR_SPECIALIZATION rows (1 transaction) |
| `updateDoctor` | POST | updates USERS + DOCTOR, replaces the specialization set |
| `deleteDoctor` | GET | soft delete (sets the linked USERS row to `Status = 'Inactive'`) |
| `restoreDoctor` | GET | undo a soft delete (`Status = 'Active'`) |

### API operations (`api/specializations.php`)
| operation | method | purpose |
|---|---|---|
| `getSpecializations` | GET | lookup list, used to populate the Doctor form's multi-select |

## Medicines — what's included
`MEDICINE` (`MedicineID`, `MedicineName`, `Description`, `DosageForm`) is a simple lookup table,
same shape as `PATIENT`. The ERD doesn't show a `Status` column on it, but since it's referenced
by `PRESCRIPTION` (a transaction table), the same soft-delete pattern used for `PATIENT` is
applied here too — a `Status` column was added.

- **Create**: form → "Add Medicine" (Name, Dosage Form dropdown, Description).
- **Read**: table lists all medicines; toggle "Show inactive medicines" to include deactivated ones.
- **Update**: "Update" button opens a modal with an editable form.
- **Delete (soft)**: "Delete" button deactivates the medicine (`Status = 'Inactive'`) instead of
  removing the row, so historical prescriptions that reference it stay valid. "Restore" undoes it.

### API operations (`api/medicines.php`)
| operation | method | purpose |
|---|---|---|
| `getAllMedicines` | GET | all medicines, for the admin master file table |
| `getActiveMedicines` | GET | active-only medicines, for the Prescription module to reference |
| `getMedicine` | GET | single medicine by `medicineId` |
| `insertMedicine` | POST | create a new medicine |
| `updateMedicine` | POST | edit an existing medicine |
| `deleteMedicine` | GET | soft delete (sets `Status = 'Inactive'`) |
| `restoreMedicine` | GET | undo a soft delete (`Status = 'Active'`) |

## Specializations — what's included
`SPECIALIZATION` (`SpecializationID`, `SpecializationName`, `Description`) is the same lookup
table that already powered the multi-select on the Doctors page (`api/specializations.php`'s
`getSpecializations`). This module turns it into its own manageable master file with a full CRUD
screen, rather than just a dropdown source.

- **Create**: form → "Add Specialization" (Name, Description).
- **Read**: table lists all specializations, plus a "Doctors" column showing how many doctors
  currently have each one assigned (via `DOCTOR_SPECIALIZATION`).
- **Update**: "Update" button opens a modal with an editable form.
- **Delete (hard, guarded)**: "Delete Permanently" removes the row outright — see reasoning below.

### Hard delete vs. soft delete — why Specializations uses hard delete
Unlike `PATIENT`, `USERS`/Doctors, and `MEDICINE`, `SPECIALIZATION` isn't referenced by any
transaction table (`APPOINTMENT`, `CONSULTATION`, `BILLING`, `PRESCRIPTION`) — it's only linked to
`DOCTOR` through the `DOCTOR_SPECIALIZATION` junction table. There's no clinical or billing history
tied to a `SpecializationID`, so there's nothing a physical delete would corrupt. Because of that,
`deleteSpecialization` performs a real **hard delete** — but first checks
`DOCTOR_SPECIALIZATION` for that `SpecializationID`. If any doctor still has it assigned, the API
returns `{"error": "in_use", "count": N}` instead of deleting, and the UI tells the admin to remove
it from those doctors first. This avoids orphaning `DOCTOR_SPECIALIZATION` rows without needing a
`Status` column or a Restore flow that a pure lookup table doesn't really need.

### API operations (`api/specializations.php`)
| operation | method | purpose |
|---|---|---|
| `getSpecializations` | GET | lookup list (no doctor counts) — used by the Doctor form's multi-select |
| `getAllSpecializations` | GET | all specializations + doctor count, for the admin master file table |
| `getSpecialization` | GET | single specialization by `specializationId` |
| `insertSpecialization` | POST | create a new specialization |
| `updateSpecialization` | POST | edit an existing specialization |
| `deleteSpecialization` | GET | hard delete — blocked with `{"error":"in_use","count":N}` if a doctor still has it assigned |

## Diagnoses / ICD-10 — what's included
`DIAGNOSIS_ICD10` (`DiagnosisID`, `ICD10Code`, `DiagnosisName`, `Description`) is a simple lookup
table, same shape as `MEDICINE`. It will be referenced by `CONSULTATION_DIAGNOSIS` once the
Consultation transaction module exists.

- **Create**: form → "Add Diagnosis" (ICD-10 Code, Diagnosis Name, Description). `ICD10Code` is
  `UNIQUE` at the database level, so duplicates are rejected.
- **Read**: table lists all diagnoses; toggle "Show inactive diagnoses" to include deactivated ones.
- **Update**: "Update" button opens a modal with an editable form.
- **Delete (soft)**: "Delete" button deactivates the diagnosis (`Status = 'Inactive'`) instead of
  removing the row. "Restore" undoes it.

### Hard delete vs. soft delete — why Diagnoses uses soft delete
This is the opposite call from Specializations, and on purpose. `DIAGNOSIS_ICD10` will be
referenced by `CONSULTATION_DIAGNOSIS`, which records what a doctor *actually diagnosed a patient
with* during a real consultation — that's clinical history, not just a current
capability/assignment the way a doctor's specialization is. Hard-deleting a diagnosis code could
orphan or invalidate a real medical record, so the same soft-delete pattern used for
`PATIENT`/`MEDICINE` is used here: a `Status` column, `deleteDiagnosis` flips it to `'Inactive'`,
and `getActiveDiagnoses` is what the Consultation module should call so retired codes don't show
up as new-diagnosis options while old consultations that used them stay valid.

### API operations (`api/diagnoses.php`)
| operation | method | purpose |
|---|---|---|
| `getAllDiagnoses` | GET | all diagnoses, for the admin master file table |
| `getActiveDiagnoses` | GET | active-only diagnoses, for the Consultation module to reference |
| `getDiagnosis` | GET | single diagnosis by `diagnosisId` |
| `insertDiagnosis` | POST | create a new diagnosis |
| `updateDiagnosis` | POST | edit an existing diagnosis |
| `deleteDiagnosis` | GET | soft delete (sets `Status = 'Inactive'`) |
| `restoreDiagnosis` | GET | undo a soft delete (`Status = 'Active'`) |

## File map
| Patients | Doctors | Medicines | Specializations | Diagnoses / ICD-10 |
|---|---|---|---|---|
| `index.html` | `doctors.html` | `medicines.html` | `specializations.html` | `diagnoses.html` |
| `js/index.js` | `js/index-doctors.js` | `js/index-medicines.js` | `js/index-specializations.js` | `js/index-diagnoses.js` |
| `js/modules/view.js` `update.js` `delete.js` | `js/modules-doctors/view.js` `update.js` `delete.js` | `js/modules-medicines/view.js` `update.js` `delete.js` | `js/modules-specializations/view.js` `update.js` `delete.js` | `js/modules-diagnoses/view.js` `update.js` `delete.js` |
| `api/patients.php` | `api/doctors.php` | `api/medicines.php` | `api/specializations.php` | `api/diagnoses.php` |
| `PATIENT` table | `ROLE`, `USERS`, `DOCTOR`, `DOCTOR_SPECIALIZATION` tables | `MEDICINE` table | `SPECIALIZATION` table | `DIAGNOSIS_ICD10` table |

## Delete strategy summary
| Table | Strategy | Why |
|---|---|---|
| `PATIENT` | Soft delete | Referenced by Appointment, Consultation, Billing (real clinical/billing history) |
| `USERS` (Doctors) | Soft delete | Referenced by Appointment, and via Consultation by Professional Fee |
| `MEDICINE` | Soft delete | Referenced by Prescription (real clinical history) |
| `SPECIALIZATION` | Hard delete (guarded) | Only linked to a doctor's *current* assignment via a junction table, no transaction history involved |
| `DIAGNOSIS_ICD10` | Soft delete | Will be referenced by Consultation_Diagnosis (real clinical history) |

## Next modules
All planned Milestone 1 master files (Patients, Doctors, Medicines, Specializations,
Diagnoses / ICD-10) are done. Next up would be the transaction modules (Appointments,
Consultations, Billing, Prescriptions) that reference these lookup tables.
