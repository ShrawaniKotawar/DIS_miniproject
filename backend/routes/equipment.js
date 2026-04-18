const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/equipment
// Department sees all equipment in their department's labs
// Lab sees only their lab's equipment
router.get('/', authenticateToken, async (req, res) => {
  const { role, deptId, labId } = req.user;

  try {
    let rows;
    if (role === 'Department') {
      [rows] = await db.query(
        `SELECT e.*, l.Lab_Name, l.Room_No
         FROM EquipmentAsset e
         JOIN Lab l ON e.Lab_ID = l.Lab_ID
         WHERE l.Dept_ID = ?
         ORDER BY e.Asset_ID DESC`,
        [deptId]
      );
    } else if (role === 'Lab') {
      [rows] = await db.query(
        `SELECT e.*, l.Lab_Name, l.Room_No
         FROM EquipmentAsset e
         JOIN Lab l ON e.Lab_ID = l.Lab_ID
         WHERE e.Lab_ID = ?
         ORDER BY e.Asset_ID DESC`,
        [labId]
      );
    } else {
      return res.status(403).json({ message: 'Unknown role.' });
    }

    res.json(rows);
  } catch (err) {
    console.error('Get equipment error:', err);
    res.status(500).json({ message: 'Server error fetching equipment.' });
  }
});

// POST /api/equipment — Now Public
router.post('/', async (req, res) => {
  const {
    asset_name,
    category,
    model,
    manufacturer,
    unit_price,
    quantity,
    purchase_date,
    status,
    labId, // Acceptance of Lab_ID from body
  } = req.body;

  if (!asset_name || !unit_price || !quantity || !labId) {
    return res.status(400).json({ message: 'Asset name, unit price, quantity, and Lab ID are required.' });
  }

  const total_cost = parseFloat(unit_price) * parseInt(quantity);

  try {
    const [result] = await db.query(
      `INSERT INTO EquipmentAsset
        (Asset_Name, Category, Model, Manufacturer, Unit_Price, Quantity, Total_Cost, Purchase_Date, Status, Lab_ID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [asset_name, category, model, manufacturer, unit_price, quantity, total_cost, purchase_date, status, labId]
    );

    const [newAsset] = await db.query(
      `SELECT e.*, l.Lab_Name FROM EquipmentAsset e
       JOIN Lab l ON e.Lab_ID = l.Lab_ID
       WHERE e.Asset_ID = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Equipment registered successfully.', asset: newAsset[0] });
  } catch (err) {
    console.error('Add equipment error:', err);
    res.status(500).json({ message: 'Server error registering equipment.' });
  }
});

module.exports = router;
