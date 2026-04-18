const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/labs — all labs (Department sees labs in their dept; Lab sees their own)
router.get('/', authenticateToken, async (req, res) => {
  const { role, deptId, labId } = req.user;

  try {
    let rows;
    if (role === 'Department') {
      [rows] = await db.query(
        `SELECT l.*, d.Dept_Name,
          (SELECT COUNT(*) FROM EquipmentAsset e WHERE e.Lab_ID = l.Lab_ID) AS Equipment_Count,
          (SELECT COALESCE(SUM(e.Total_Cost),0) FROM EquipmentAsset e WHERE e.Lab_ID = l.Lab_ID) AS Total_Asset_Value
         FROM Lab l
         JOIN Department d ON l.Dept_ID = d.Dept_ID
         WHERE l.Dept_ID = ?
         ORDER BY l.Lab_ID`,
        [deptId]
      );
    } else {
      [rows] = await db.query(
        `SELECT l.*, d.Dept_Name,
          (SELECT COUNT(*) FROM EquipmentAsset e WHERE e.Lab_ID = l.Lab_ID) AS Equipment_Count,
          (SELECT COALESCE(SUM(e.Total_Cost),0) FROM EquipmentAsset e WHERE e.Lab_ID = l.Lab_ID) AS Total_Asset_Value
         FROM Lab l
         JOIN Department d ON l.Dept_ID = d.Dept_ID
         WHERE l.Lab_ID = ?`,
        [labId]
      );
    }
    res.json(rows);
  } catch (err) {
    console.error('Get labs error:', err);
    res.status(500).json({ message: 'Server error fetching labs.' });
  }
});

module.exports = router;
