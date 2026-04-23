-- =============================================================
-- Lab Management System - Database Init Script
-- Run: mysql -u root -p < lab_management.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS lab_management_db;
USE lab_management_db;

-- Drop tables in reverse FK order
DROP TABLE IF EXISTS EquipmentAsset;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Lab;
DROP TABLE IF EXISTS Department;

-- --------------------------
-- Department
-- --------------------------
CREATE TABLE Department (
  Dept_ID INT PRIMARY KEY AUTO_INCREMENT,
  Dept_Name VARCHAR(100),
  HOD_Name VARCHAR(100),
  Repair_Budget DECIMAL(10,2),
  Purchase_Budget DECIMAL(10,2),
  Total_Budget DECIMAL(12,2)
);

-- --------------------------
-- Lab
-- --------------------------
CREATE TABLE Lab (
  Lab_ID INT PRIMARY KEY AUTO_INCREMENT,
  Room_No VARCHAR(20),
  Lab_Name VARCHAR(100),
  Lab_Incharge VARCHAR(100),
  Lab_Cost DECIMAL(10,2),
  Dept_ID INT,
  FOREIGN KEY (Dept_ID) REFERENCES Department(Dept_ID)
);

-- --------------------------
-- Users
-- --------------------------
CREATE TABLE Users (
  User_ID INT PRIMARY KEY AUTO_INCREMENT,
  Email VARCHAR(100) UNIQUE,
  Password VARCHAR(255),
  Role ENUM('Department','Lab'),
  Dept_ID INT NULL,
  Lab_ID INT NULL,
  FOREIGN KEY (Dept_ID) REFERENCES Department(Dept_ID),
  FOREIGN KEY (Lab_ID) REFERENCES Lab(Lab_ID)
);

-- --------------------------
-- EquipmentAsset
-- --------------------------
CREATE TABLE EquipmentAsset (
  Asset_ID INT PRIMARY KEY AUTO_INCREMENT,
  Asset_Name VARCHAR(100),
  Category VARCHAR(50),
  Model VARCHAR(100),
  Manufacturer VARCHAR(100),
  Unit_Price DECIMAL(10,2),
  Quantity INT,
  Total_Cost DECIMAL(12,2),
  Purchase_Date DATE,
  Status VARCHAR(50),
  Lab_ID INT,
  FOREIGN KEY (Lab_ID) REFERENCES Lab(Lab_ID)
);

-- --------------------------
-- MaintenanceLog
-- --------------------------
CREATE TABLE MaintenanceLog (
  Log_ID INT PRIMARY KEY AUTO_INCREMENT,
  Asset_ID INT,
  Issue_Description TEXT,
  Status VARCHAR(50) DEFAULT 'Issue_Reported',
  Reported_Date DATE,
  Repair_Cost DECIMAL(10,2),
  Repair_Date DATE,
  Technician_Name VARCHAR(100),
  FOREIGN KEY (Asset_ID) REFERENCES EquipmentAsset(Asset_ID) ON DELETE CASCADE
);

-- =============================================================
-- SEED DATA
-- =============================================================

-- Department
INSERT INTO Department (Dept_Name, HOD_Name, Repair_Budget, Purchase_Budget, Total_Budget) VALUES
('Information Technology', 'Dr. Alok Sharma', 150000.00, 500000.00, 650000.00);

-- Labs
INSERT INTO Lab (Room_No, Lab_Name, Lab_Incharge, Lab_Cost, Dept_ID) VALUES
('301', 'DBMS Lab', 'Prof. Meera Nair', 250000.00, 1),
('302', 'Network Lab', 'Prof. Ravi Kulkarni', 300000.00, 1);

-- Users (passwords are bcrypt of: dept@123 and lab@123)
-- These will be inserted by the seed script (server/seed.js)
-- Placeholder rows; server/seed.js will hash passwords properly.
-- DO NOT insert raw passwords here.

-- EquipmentAsset
INSERT INTO EquipmentAsset (Asset_Name, Category, Model, Manufacturer, Unit_Price, Quantity, Total_Cost, Purchase_Date, Status, Lab_ID) VALUES
('Dell Workstation', 'Computer', 'Precision 3660', 'Dell', 85000.00, 20, 1700000.00, '2023-06-15', 'Active', 1),
('Cisco Router', 'Networking', 'ISR 4321', 'Cisco', 45000.00, 5, 225000.00, '2023-07-01', 'Active', 2),
('Network Switch', 'Networking', 'Catalyst 2960', 'Cisco', 18000.00, 8, 144000.00, '2023-07-01', 'Active', 2),
('HP Laptop', 'Computer', 'ProBook 450', 'HP', 62000.00, 30, 1860000.00, '2023-08-10', 'Active', 1),
('LCD Projector', 'Display', 'EB-X41', 'Epson', 32000.00, 2, 64000.00, '2023-05-20', 'Active', 1),
('UPS System', 'Power', 'Smart-UPS 1500', 'APC', 15000.00, 10, 150000.00, '2023-09-01', 'Active', 1),
('Oscilloscope', 'Measurement', 'TDS 2024C', 'Tektronix', 55000.00, 5, 275000.00, '2023-10-15', 'Active', 2),
('Soldering Station', 'Tool', 'WSD 81', 'Weller', 8500.00, 10, 85000.00, '2023-11-01', 'Active', 2),
('Multimeter', 'Measurement', 'True-RMS 179', 'Fluke', 12000.00, 8, 96000.00, '2023-11-01', 'Active', 2),
('Power Supply', 'Power', 'E3634A', 'Keysight', 22000.00, 6, 132000.00, '2024-01-10', 'Under Maintenance', 2);
