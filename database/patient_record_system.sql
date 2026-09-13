-- ============================================================
-- PATIENT RECORD SYSTEM - Milestone 1 (Master File: PATIENT)
-- ============================================================

CREATE DATABASE IF NOT EXISTS patient_record_system;
USE patient_record_system;

-- ------------------------------------------------------------
-- PATIENT (master/lookup table)
-- Status column enables SOFT DELETE: Patients are referenced by
-- APPOINTMENT, CONSULTATION, and BILLING (transaction tables).
-- Hard-deleting a patient would break those historical records,
-- so "deleting" a patient here just flips Status to 'Inactive'
-- and hides them from normal transaction pickers, while keeping
-- their history intact.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS PATIENT (
    PatientID     INT AUTO_INCREMENT PRIMARY KEY,
    FirstName     VARCHAR(100) NOT NULL,
    LastName      VARCHAR(100) NOT NULL,
    DateOfBirth   DATE NOT NULL,
    Gender        VARCHAR(10)  NOT NULL,
    Phone         VARCHAR(20),
    Address       VARCHAR(255),
    Status        VARCHAR(10)  NOT NULL DEFAULT 'Active'   -- 'Active' | 'Inactive'
);

-- ------------------------------------------------------------
-- Sample data so transaction modules (Appointments, Consultations,
-- Billing) have something to reference right away.
-- ------------------------------------------------------------
INSERT INTO PATIENT (FirstName, LastName, DateOfBirth, Gender, Phone, Address, Status) VALUES
('Maria',     'Santos',    '1990-05-12', 'Female', '09171234561', 'Purok 1, Pagadian City',        'Active'),
('Juan',      'Dela Cruz', '1985-11-03', 'Male',   '09171234562', 'Purok 2, San Pedro, Pagadian',   'Active'),
('Ana',       'Reyes',     '2001-02-20', 'Female', '09171234563', 'Balangasan, Pagadian City',      'Active'),
('Pedro',     'Garcia',    '1975-08-15', 'Male',   '09171234564', 'Sta. Lucia, Pagadian City',      'Active'),
('Liza',      'Fernandez', '1998-01-30', 'Female', '09171234565', 'San Jose, Pagadian City',        'Active'),
('Mark',      'Torres',    '1993-07-22', 'Male',   '09171234566', 'Danlugan, Pagadian City',        'Active'),
('Grace',     'Mendoza',   '1960-12-09', 'Female', '09171234567', 'Muricay, Pagadian City',         'Active'),
('Ramon',     'Villanueva','1988-03-17', 'Male',   '09171234568', 'Tiguma, Pagadian City',          'Active'),
('Cecilia',   'Aquino',    '2005-09-05', 'Female', '09171234569', 'Balintawak, Pagadian City',      'Active'),
('Ferdinand', 'Lopez',     '1979-04-25', 'Male',   '09171234570', 'Dao, Pagadian City',              'Inactive');

-- ============================================================
-- DOCTOR MASTER FILE (per the ERD)
-- A "Doctor" is not one flat table here — it is USERS + DOCTOR,
-- with specializations attached through a many-to-many junction:
--   ROLE  <--- USERS ---> DOCTOR <---> DOCTOR_SPECIALIZATION <---> SPECIALIZATION
-- The Doctors master file screen reads/writes across all of these,
-- but presents them to the admin as a single "Doctor" record.
-- ============================================================

-- ------------------------------------------------------------
-- ROLE (lookup table). Every USERS row belongs to a Role
-- (Admin, Doctor, Staff, ...). Doctors are simply USERS rows
-- whose RoleID points to the 'Doctor' role.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ROLE (
    RoleID      INT AUTO_INCREMENT PRIMARY KEY,
    RoleName    VARCHAR(50) NOT NULL,
    Description VARCHAR(255)
);

INSERT INTO ROLE (RoleName, Description) VALUES
('Admin',  'Manages master files and system configuration'),
('Doctor', 'Handles consultations, diagnoses, and prescriptions'),
('Staff',  'Front-desk staff handling appointments and billing');

-- ------------------------------------------------------------
-- USERS
-- Holds login + identity info for every account (Admin, Doctor,
-- Staff). Status enables SOFT DELETE for accounts: Doctors are
-- referenced by APPOINTMENT and, through CONSULTATION, by
-- PROFESSIONAL_FEE, so a user account tied to a doctor is never
-- physically removed — it is marked Inactive instead so history
-- stays valid and the account can be restored.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS USERS (
    UserID     INT AUTO_INCREMENT PRIMARY KEY,
    RoleID     INT NOT NULL,
    Username   VARCHAR(50)  NOT NULL UNIQUE,
    Password   VARCHAR(255) NOT NULL, -- NOTE: plain text for class demo only; hash in production
    FirstName  VARCHAR(100) NOT NULL,
    LastName   VARCHAR(100) NOT NULL,
    Status     VARCHAR(10)  NOT NULL DEFAULT 'Active', -- 'Active' | 'Inactive'
    FOREIGN KEY (RoleID) REFERENCES ROLE(RoleID)
);

-- ------------------------------------------------------------
-- SPECIALIZATION (lookup table)
-- No Status column here on purpose: unlike PATIENT/USERS/MEDICINE,
-- SPECIALIZATION isn't referenced by any transaction table (Appointment,
-- Consultation, Billing, Prescription) - it's only linked to DOCTOR through
-- the DOCTOR_SPECIALIZATION junction. So there's no clinical/billing history
-- to protect, and api/specializations.php performs a real HARD delete,
-- guarded by a check that blocks the delete if any doctor still has that
-- specialization assigned (avoids orphaning DOCTOR_SPECIALIZATION rows).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SPECIALIZATION (
    SpecializationID   INT AUTO_INCREMENT PRIMARY KEY,
    SpecializationName VARCHAR(100) NOT NULL,
    Description         TEXT,
    -- Backs up the application-level duplicate check in api/specializations.php
    -- at the database layer. Default collation (…_ci) is case-insensitive,
    -- so 'Ophthalmology' and 'ophthalmology' are already treated as the same
    -- value here.
    UNIQUE KEY uq_specialization_name (SpecializationName)
);

INSERT INTO SPECIALIZATION (SpecializationName, Description) VALUES
('General Medicine',        'Primary care for general adult health concerns'),
('Pediatrics',               'Medical care for infants, children, and adolescents'),
('Cardiology',               'Diagnosis and treatment of heart conditions'),
('Obstetrics & Gynecology',  'Pregnancy, childbirth, and women''s reproductive health'),
('Orthopedics',              'Bones, joints, ligaments, tendons, and muscles'),
('Dermatology',              'Skin, hair, and nail conditions'),
('Internal Medicine',        'Prevention, diagnosis, and treatment of adult diseases'),
('Ophthalmology',            'Eye and vision care'),
('ENT (Otolaryngology)',     'Ear, nose, and throat conditions'),
('Family Medicine',          'Comprehensive care for patients of all ages');

-- ------------------------------------------------------------
-- DOCTOR
-- One row per doctor, linked 1-to-1 with a USERS account.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DOCTOR (
    DoctorID INT AUTO_INCREMENT PRIMARY KEY,
    UserID   INT NOT NULL UNIQUE,
    Phone    VARCHAR(20),
    FOREIGN KEY (UserID) REFERENCES USERS(UserID)
);

-- ------------------------------------------------------------
-- DOCTOR_SPECIALIZATION (many-to-many junction)
-- A doctor can have more than one specialization.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DOCTOR_SPECIALIZATION (
    DoctorSpecializationID INT AUTO_INCREMENT PRIMARY KEY,
    DoctorID         INT NOT NULL,
    SpecializationID INT NOT NULL,
    FOREIGN KEY (DoctorID) REFERENCES DOCTOR(DoctorID),
    FOREIGN KEY (SpecializationID) REFERENCES SPECIALIZATION(SpecializationID),
    UNIQUE KEY uq_doctor_specialization (DoctorID, SpecializationID)
);

-- ------------------------------------------------------------
-- Sample doctor accounts (RoleID 2 = 'Doctor', seeded above).
-- 9 Active, 1 Inactive so Restore can be tested. Dr. Navarro is
-- given two specializations to demonstrate the many-to-many link.
-- ------------------------------------------------------------
INSERT INTO USERS (RoleID, Username, Password, FirstName, LastName, Status) VALUES
(2, 'jramirez',   'password123', 'Jose',     'Ramirez',   'Active'),
(2, 'cbautista',  'password123', 'Carmela',  'Bautista',  'Active'),
(2, 'rnavarro',   'password123', 'Rafael',   'Navarro',   'Active'),
(2, 'icruz',      'password123', 'Isabel',   'Cruz',      'Active'),
(2, 'aocampo',    'password123', 'Antonio',  'Ocampo',    'Active'),
(2, 'tvillareal', 'password123', 'Teresa',   'Villareal', 'Active'),
(2, 'esalazar',   'password123', 'Emmanuel', 'Salazar',   'Active'),
(2, 'pdomingo',   'password123', 'Patricia', 'Domingo',   'Active'),
(2, 'respino',    'password123', 'Ricardo',  'Espino',    'Active'),
(2, 'lpascual',   'password123', 'Luz',      'Pascual',   'Inactive');

INSERT INTO DOCTOR (UserID, Phone) VALUES
((SELECT UserID FROM USERS WHERE Username = 'jramirez'),   '09181234561'),
((SELECT UserID FROM USERS WHERE Username = 'cbautista'),  '09181234562'),
((SELECT UserID FROM USERS WHERE Username = 'rnavarro'),   '09181234563'),
((SELECT UserID FROM USERS WHERE Username = 'icruz'),      '09181234564'),
((SELECT UserID FROM USERS WHERE Username = 'aocampo'),    '09181234565'),
((SELECT UserID FROM USERS WHERE Username = 'tvillareal'), '09181234566'),
((SELECT UserID FROM USERS WHERE Username = 'esalazar'),   '09181234567'),
((SELECT UserID FROM USERS WHERE Username = 'pdomingo'),   '09181234568'),
((SELECT UserID FROM USERS WHERE Username = 'respino'),    '09181234569'),
((SELECT UserID FROM USERS WHERE Username = 'lpascual'),   '09181234570');

INSERT INTO DOCTOR_SPECIALIZATION (DoctorID, SpecializationID) VALUES
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'jramirez'),   (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'General Medicine')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'cbautista'),  (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'Pediatrics')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'rnavarro'),   (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'Cardiology')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'rnavarro'),   (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'Internal Medicine')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'icruz'),      (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'Obstetrics & Gynecology')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'aocampo'),    (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'Orthopedics')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'tvillareal'), (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'Dermatology')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'esalazar'),   (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'Internal Medicine')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'pdomingo'),   (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'Ophthalmology')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'respino'),    (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'ENT (Otolaryngology)')),
((SELECT DoctorID FROM DOCTOR d JOIN USERS u ON d.UserID = u.UserID WHERE u.Username = 'lpascual'),   (SELECT SpecializationID FROM SPECIALIZATION WHERE SpecializationName = 'Family Medicine'));

-- ============================================================
-- MEDICINE (master/lookup table)
-- The ERD doesn't show a Status column on MEDICINE, but it is
-- referenced by PRESCRIPTION (a transaction table), so the same
-- SOFT DELETE approach used for PATIENT is applied here: adding
-- a Status column rather than physically removing rows, so past
-- prescriptions that reference a MedicineID stay valid.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS MEDICINE (
    MedicineID   INT AUTO_INCREMENT PRIMARY KEY,
    MedicineName VARCHAR(150) NOT NULL,
    Description  TEXT,
    DosageForm   VARCHAR(50)  NOT NULL, -- e.g. Tablet, Capsule, Syrup, Injection
    Status       VARCHAR(10)  NOT NULL DEFAULT 'Active' -- 'Active' | 'Inactive'
);

-- ------------------------------------------------------------
-- Sample data so the Prescription transaction module has
-- medicines to reference right away. 9 Active, 1 Inactive so
-- Restore can be tested.
-- ------------------------------------------------------------
INSERT INTO MEDICINE (MedicineName, Description, DosageForm, Status) VALUES
('Paracetamol',       'Used to relieve mild to moderate pain and reduce fever',              'Tablet',    'Active'),
('Amoxicillin',        'Antibiotic used to treat a variety of bacterial infections',          'Capsule',   'Active'),
('Cetirizine',         'Antihistamine used to relieve allergy symptoms',                       'Tablet',    'Active'),
('Losartan',           'Used to treat high blood pressure',                                    'Tablet',    'Active'),
('Metformin',          'Used to control blood sugar levels in type 2 diabetes',                'Tablet',    'Active'),
('Salbutamol',         'Bronchodilator used to relieve asthma and wheezing',                    'Inhaler',   'Active'),
('Omeprazole',         'Reduces stomach acid; used for ulcers and acid reflux',                 'Capsule',   'Active'),
('Ascorbic Acid',      'Vitamin C supplement to support the immune system',                     'Tablet',    'Active'),
('Amoxicillin Syrup',  'Pediatric antibiotic syrup for bacterial infections',                   'Syrup',     'Active'),
('Ceftriaxone',        'Injectable antibiotic used for more serious bacterial infections',      'Injection', 'Inactive');

-- ============================================================
-- DIAGNOSIS_ICD10 (master/lookup table)
-- Status column enables SOFT DELETE. Unlike SPECIALIZATION (which only
-- links to a doctor's *current* capabilities), a diagnosis will be
-- referenced by CONSULTATION_DIAGNOSIS - a record of what a doctor
-- actually diagnosed a patient with during a real consultation. That's
-- clinical history, not just a current assignment, so the same SOFT
-- DELETE approach used for PATIENT/MEDICINE is used here too: a
-- diagnosis code is never physically removed once consultations may
-- reference it, only marked Inactive so past diagnoses stay valid and
-- it's hidden from new-consultation pickers.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DIAGNOSIS_ICD10 (
    DiagnosisID   INT AUTO_INCREMENT PRIMARY KEY,
    ICD10Code     VARCHAR(10)  NOT NULL UNIQUE,
    DiagnosisName VARCHAR(200) NOT NULL,
    Description   TEXT,
    Status        VARCHAR(10)  NOT NULL DEFAULT 'Active' -- 'Active' | 'Inactive'
);

-- ------------------------------------------------------------
-- Sample data so the Consultation transaction module has diagnoses
-- to reference right away. 9 Active, 1 Inactive so Restore can be tested.
-- ------------------------------------------------------------
INSERT INTO DIAGNOSIS_ICD10 (ICD10Code, DiagnosisName, Description, Status) VALUES
('J00',    'Acute nasopharyngitis (common cold)',       'Viral infection of the upper respiratory tract',            'Active'),
('J02.9',  'Acute pharyngitis, unspecified',             'Inflammation of the pharynx (sore throat)',                 'Active'),
('J45.9',  'Asthma, unspecified',                        'Chronic inflammatory airway disease causing wheezing',      'Active'),
('I10',    'Essential (primary) hypertension',           'High blood pressure with no identifiable secondary cause',  'Active'),
('E11.9',  'Type 2 diabetes mellitus, without complications', 'Chronic condition affecting blood sugar regulation',   'Active'),
('A09',    'Infectious gastroenteritis, unspecified',    'Inflammation of the stomach and intestines',                'Active'),
('K21.9',  'Gastro-esophageal reflux disease without esophagitis', 'Acid reflux from the stomach into the esophagus', 'Active'),
('L23.9',  'Allergic contact dermatitis, unspecified cause', 'Skin inflammation from contact with an allergen',       'Active'),
('M54.5',  'Low back pain',                              'Pain localized to the lower back',                          'Active'),
('B34.9',  'Viral infection, unspecified',                'General viral illness not otherwise specified',             'Inactive');
