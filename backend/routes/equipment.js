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
    supplier_name,
    category,
    model,
    manufacturer,
    unit_price,
    purchase_date,
    supplier_email,
    supplier_contact,
    warranty,
    order_no,
    // Legacy support
    quantity,
    labId,
    // New array support
    assignments = []
  } = req.body;

  let assignedLabs = assignments;
  if (assignedLabs.length === 0 && labId && quantity) {
    assignedLabs = [{ labId, quantity }];
  }

  if (!supplier_name || !unit_price || assignedLabs.length === 0) {
    return res.status(400).json({ message: 'Supplier name, unit price, and lab assignments are required.' });
  }

  try {
    const insertedAssets = [];

    const [sumRes] = await db.query('SELECT SUM(Quantity) AS totalQty FROM EquipmentAsset');
    let currentGlobalCount = 100 + (parseInt(sumRes[0].totalQty) || 0) + 1;
    const year = purchase_date ? purchase_date.split('-')[0] : new Date().getFullYear();

    for (const assignment of assignedLabs) {
      const allocQty = parseInt(assignment.quantity);
      if (!allocQty || allocQty <= 0) continue;

      const total_cost = parseFloat(unit_price) * allocQty;
      const allocLabId = assignment.labId;

      const [labRes] = await db.query('SELECT Room_No FROM Lab WHERE Lab_ID = ?', [allocLabId]);
      const roomNo = labRes.length > 0 ? labRes[0].Room_No : '000';

      const generatedIdsArray = [];
      for (let i = 0; i < allocQty; i++) {
         generatedIdsArray.push(`${currentGlobalCount}/${year}/IT/${roomNo}`);
         currentGlobalCount++;
      }
      const generatedIdsStr = generatedIdsArray.join(', ');

      const [result] = await db.query(
        `INSERT INTO EquipmentAsset
          (Supplier_Name, Category, Model, Manufacturer, Unit_Price, Quantity, Total_Cost, Purchase_Date, Supplier_Email, Supplier_Contact, Warranty, Order_No, Lab_ID, Generated_ID)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [supplier_name, category, model, manufacturer, unit_price, allocQty, total_cost, purchase_date, supplier_email, supplier_contact, warranty, order_no, allocLabId, generatedIdsStr]
      );

      const [newAsset] = await db.query(
        `SELECT e.*, l.Lab_Name FROM EquipmentAsset e
         JOIN Lab l ON e.Lab_ID = l.Lab_ID
         WHERE e.Asset_ID = ?`,
        [result.insertId]
      );

      if (newAsset.length > 0) insertedAssets.push(newAsset[0]);
    }

    res.status(201).json({ message: 'Equipment registered successfully.', assets: insertedAssets });
  } catch (err) {
    console.error('Add equipment error:', err);
    res.status(500).json({ message: 'Server error registering equipment.' });
  }
});

module.exports = router;
