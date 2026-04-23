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
    assignments = [],
    asset_name
  } = req.body;

  const finalAssetName = asset_name || model || category || 'Unknown Equipment';

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
          (Asset_Name, Supplier_Name, Category, Model, Manufacturer, Unit_Price, Quantity, Total_Cost, Purchase_Date, Supplier_Email, Supplier_Contact, Warranty, Order_No, Lab_ID, Generated_ID)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [finalAssetName, supplier_name, category, model, manufacturer, unit_price, allocQty, total_cost, purchase_date, supplier_email, supplier_contact, warranty, order_no, allocLabId, generatedIdsStr]
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

// PUT /api/equipment/:id/move — Move equipment from one lab to another
router.put('/:id/move', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { newLabId, selectedIds } = req.body;

  if (!newLabId || !selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
    return res.status(400).json({ message: 'New Lab ID and selected IDs array are required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get current asset details
    const [assetRows] = await connection.query(
      `SELECT * FROM EquipmentAsset WHERE Asset_ID = ?`,
      [id]
    );

    if (assetRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    const asset = assetRows[0];
    const oldLabId = asset.Lab_ID;

    if (oldLabId === newLabId) {
      await connection.rollback();
      return res.status(400).json({ message: 'Equipment is already in the specified lab.' });
    }

    const currentIds = asset.Generated_ID ? asset.Generated_ID.split(', ') : [];
    const idsToMove = selectedIds.filter(sid => currentIds.includes(sid));

    if (idsToMove.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'None of the selected IDs belong to this equipment batch.' });
    }

    const moveQuantity = idsToMove.length;
    const unitPrice = parseFloat(asset.Unit_Price);
    const moveCost = unitPrice * moveQuantity;

    if (moveQuantity === asset.Quantity || idsToMove.length === currentIds.length) {
      // Full transfer
      await connection.query(
        `UPDATE EquipmentAsset SET Lab_ID = ? WHERE Asset_ID = ?`,
        [newLabId, id]
      );
    } else {
      // Partial transfer
      const remainingIds = currentIds.filter(sid => !idsToMove.includes(sid));
      const remainingQty = remainingIds.length;
      const remainingCost = unitPrice * remainingQty;

      // Update old asset
      await connection.query(
        `UPDATE EquipmentAsset SET Quantity = ?, Total_Cost = ?, Generated_ID = ? WHERE Asset_ID = ?`,
        [remainingQty, remainingCost, remainingIds.join(', '), id]
      );

      // Create new asset for the new lab
      await connection.query(
        `INSERT INTO EquipmentAsset 
         (Asset_Name, Supplier_Name, Category, Model, Manufacturer, Unit_Price, Quantity, Total_Cost, Purchase_Date, Supplier_Email, Supplier_Contact, Warranty, Order_No, Status, Lab_ID, Generated_ID)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          asset.Asset_Name, asset.Supplier_Name, asset.Category, asset.Model, asset.Manufacturer, 
          asset.Unit_Price, moveQuantity, moveCost, asset.Purchase_Date, asset.Supplier_Email, 
          asset.Supplier_Contact, asset.Warranty, asset.Order_No, asset.Status, newLabId, idsToMove.join(', ')
        ]
      );
    }

    // Update Lab_Cost for old lab
    await connection.query(
      `UPDATE Lab SET Lab_Cost = Lab_Cost - ? WHERE Lab_ID = ?`,
      [moveCost, oldLabId]
    );

    // Update Lab_Cost for new lab
    await connection.query(
      `UPDATE Lab SET Lab_Cost = Lab_Cost + ? WHERE Lab_ID = ?`,
      [moveCost, newLabId]
    );

    await connection.commit();
    res.json({ message: 'Equipment moved successfully.' });
  } catch (err) {
    await connection.rollback();
    console.error('Move equipment error:', err);
    res.status(500).json({ message: 'Server error moving equipment.' });
  } finally {
    connection.release();
  }
});

// PUT /api/equipment/:id/scrap — Scrap a specific unit
router.put('/:id/scrap', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { generatedId } = req.body;

  if (!generatedId) {
    return res.status(400).json({ message: 'Generated ID to scrap is required.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [assetRows] = await connection.query(
      `SELECT * FROM EquipmentAsset WHERE Asset_ID = ?`,
      [id]
    );

    if (assetRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    const asset = assetRows[0];
    const currentIds = asset.Generated_ID ? asset.Generated_ID.split(', ') : [];

    if (!currentIds.includes(generatedId)) {
      await connection.rollback();
      return res.status(400).json({ message: 'The specific equipment ID does not belong to this batch.' });
    }

    const unitPrice = parseFloat(asset.Unit_Price);
    
    // Log the scrap in MaintenanceLog
    await connection.query(
      `INSERT INTO MaintenanceLog (Asset_ID, Generated_ID, Issue_Description, Status, Reported_Date)
       VALUES (?, ?, 'Unit scrapped', 'Scrapped', ?)`,
      [id, generatedId, new Date().toISOString().split('T')[0]]
    );

    if (currentIds.length === 1) {
      // It's the last item in the batch. We can either delete the batch or mark it as 0 quantity.
      // Let's keep it but mark quantity 0 to preserve purchase history.
      await connection.query(
        `UPDATE EquipmentAsset SET Quantity = 0, Total_Cost = 0, Generated_ID = '' WHERE Asset_ID = ?`,
        [id]
      );
    } else {
      // Remove just this item
      const remainingIds = currentIds.filter(sid => sid !== generatedId);
      const remainingQty = remainingIds.length;
      const remainingCost = unitPrice * remainingQty;

      await connection.query(
        `UPDATE EquipmentAsset SET Quantity = ?, Total_Cost = ?, Generated_ID = ? WHERE Asset_ID = ?`,
        [remainingQty, remainingCost, remainingIds.join(', '), id]
      );
    }

    // Deduct cost from Lab
    await connection.query(
      `UPDATE Lab SET Lab_Cost = Lab_Cost - ? WHERE Lab_ID = ?`,
      [unitPrice, asset.Lab_ID]
    );

    await connection.commit();
    res.json({ message: 'Equipment unit scrapped successfully.' });
  } catch (err) {
    await connection.rollback();
    console.error('Scrap equipment error:', err);
    res.status(500).json({ message: 'Server error scrapping equipment.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
