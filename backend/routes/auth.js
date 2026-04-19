const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM Users WHERE Email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (role && user.Role !== role) {
      return res.status(401).json({ message: `Access denied. Please check your selected login type (${role}).` });
    }

    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Fetch extra info based on role
    let extraInfo = {};
    if (user.Role === 'Department' && user.Dept_ID) {
      const [deptRows] = await db.query(
        'SELECT Dept_Name, HOD_Name FROM Department WHERE Dept_ID = ?',
        [user.Dept_ID]
      );
      if (deptRows.length > 0) extraInfo = { deptName: deptRows[0].Dept_Name, hodName: deptRows[0].HOD_Name };
    } else if (user.Role === 'Lab' && user.Lab_ID) {
      const [labRows] = await db.query(
        'SELECT Lab_Name, Lab_Incharge FROM Lab WHERE Lab_ID = ?',
        [user.Lab_ID]
      );
      if (labRows.length > 0) extraInfo = { labName: labRows[0].Lab_Name, labIncharge: labRows[0].Lab_Incharge };
    }

    const token = jwt.sign(
      {
        userId: user.User_ID,
        email: user.Email,
        role: user.Role,
        deptId: user.Dept_ID,
        labId: user.Lab_ID,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.User_ID,
        email: user.Email,
        role: user.Role,
        deptId: user.Dept_ID,
        labId: user.Lab_ID,
        ...extraInfo,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
