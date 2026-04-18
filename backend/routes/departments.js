const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/departments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*,
        (SELECT COUNT(*) FROM Lab l WHERE l.Dept_ID = d.Dept_ID) AS Lab_Count
       FROM Department d
       ORDER BY d.Dept_ID`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ message: 'Server error fetching departments.' });
  }
});

module.exports = router;
