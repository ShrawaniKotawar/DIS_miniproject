const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/history/issue
// Create a History Log when an issue is discovered
router.post('/issue', authenticateToken, async (req, res) => {
  const { assetId, generatedId, issueDescription, reportedDate } = req.body;

  if (!assetId || !generatedId || !issueDescription) {
    return res.status(400).json({ message: 'Asset ID, Generated ID, and Issue Description are required.' });
  }

  try {
    const date = reportedDate || new Date().toISOString().split('T')[0];

    const [result] = await db.query(
      `INSERT INTO MaintenanceLog (Asset_ID, Generated_ID, Issue_Description, Status, Reported_Date)
       VALUES (?, ?, ?, 'Issue_Reported', ?)`,
      [assetId, generatedId, issueDescription, date]
    );

    res.status(201).json({ message: 'Issue logged successfully.', logId: result.insertId });
  } catch (err) {
    console.error('Log issue error:', err);
    res.status(500).json({ message: 'Server error while logging issue.' });
  }
});

// POST /api/history/repair
// Log a repair, update status, and deduct from Department Budget
router.post('/repair', authenticateToken, async (req, res) => {
  const { logId, repairCost, repairDate, technicianName } = req.body;

  if (!logId || repairCost === undefined || !technicianName) {
    return res.status(400).json({ message: 'Log ID, Repair Cost, and Technician Name are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const date = repairDate || new Date().toISOString().split('T')[0];

    // Update the MaintenanceLog
    const [updateResult] = await connection.query(
      `UPDATE MaintenanceLog 
       SET Status = 'Repaired', Repair_Cost = ?, Repair_Date = ?, Technician_Name = ? 
       WHERE Log_ID = ?`,
      [repairCost, date, technicianName, logId]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Maintenance log not found.' });
    }

    // Find the Department ID to deduct the budget from
    // EquipmentAsset -> Lab -> Department
    const [assetRows] = await connection.query(
      `SELECT l.Dept_ID 
       FROM MaintenanceLog m
       JOIN EquipmentAsset e ON m.Asset_ID = e.Asset_ID
       JOIN Lab l ON e.Lab_ID = l.Lab_ID
       WHERE m.Log_ID = ?`,
      [logId]
    );

    if (assetRows.length === 0 || !assetRows[0].Dept_ID) {
      await connection.rollback();
      return res.status(404).json({ message: 'Associated department not found.' });
    }

    const deptId = assetRows[0].Dept_ID;

    // Deduct Repair_Cost from Department.Total_Budget
    await connection.query(
      `UPDATE Department 
       SET Total_Budget = Total_Budget - ? 
       WHERE Dept_ID = ?`,
      [repairCost, deptId]
    );

    await connection.commit();
    res.json({ message: 'Repair logged and budget deducted successfully.' });
  } catch (err) {
    await connection.rollback();
    console.error('Log repair error:', err);
    res.status(500).json({ message: 'Server error while logging repair.' });
  } finally {
    connection.release();
  }
});

// GET /api/history
// Fetch all maintenance logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, e.Asset_Name, e.Lab_ID, l.Room_No, l.Dept_ID
       FROM MaintenanceLog m
       JOIN EquipmentAsset e ON m.Asset_ID = e.Asset_ID
       JOIN Lab l ON e.Lab_ID = l.Lab_ID
       ORDER BY m.Reported_Date DESC, m.Log_ID DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ message: 'Server error fetching history logs.' });
  }
});

module.exports = router;
