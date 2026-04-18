/**
 * seed.js — Creates users with hashed passwords
 * Run: node seed.js
 * Requires the DB and tables to already exist (run lab_management.sql first)
 */
const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

async function seed() {
  try {
    console.log('🌱 Seeding users...');

    // Hash passwords
    const deptPassword = await bcrypt.hash('dept@123', 10);
    const lab1Password = await bcrypt.hash('lab@123', 10);
    const lab2Password = await bcrypt.hash('lab2@123', 10);
    const lab3Password = await bcrypt.hash('lab3@123', 10);

    // Check and insert Department user
    const [existing] = await db.query('SELECT * FROM Users WHERE Email = ?', ['dept.it@college.edu']);
    if (existing.length === 0) {
      await db.query(
        'INSERT INTO Users (Email, Password, Role, Dept_ID, Lab_ID) VALUES (?, ?, ?, ?, ?)',
        ['dept.it@college.edu', deptPassword, 'Department', 1, null]
      );
      console.log('✅ Department user created: dept.it@college.edu / dept@123');
    } else {
      console.log('ℹ️  Department user already exists.');
    }

    // Lab 1 (DBMS Lab - 301)
    const [existingLab1] = await db.query('SELECT * FROM Users WHERE Email = ?', ['dbms.lab@college.edu']);
    if (existingLab1.length === 0) {
      await db.query(
        'INSERT INTO Users (Email, Password, Role, Dept_ID, Lab_ID) VALUES (?, ?, ?, ?, ?)',
        ['dbms.lab@college.edu', lab1Password, 'Lab', null, 1]
      );
      console.log('✅ Lab 1 user created: dbms.lab@college.edu / lab@123');
    }

    // Lab 2 (Network Lab - 302)
    const [existingLab2] = await db.query('SELECT * FROM Users WHERE Email = ?', ['network.lab@college.edu']);
    if (existingLab2.length === 0) {
      await db.query(
        'INSERT INTO Users (Email, Password, Role, Dept_ID, Lab_ID) VALUES (?, ?, ?, ?, ?)',
        ['network.lab@college.edu', lab2Password, 'Lab', null, 2]
      );
      console.log('✅ Lab 2 user created: network.lab@college.edu / lab2@123');
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('Test credentials:');
    console.log('  Department: dept.it@college.edu      / dept@123');
    console.log('  Lab 1:      network.lab@college.edu  / lab@123');
    console.log('  Lab 2:      prog.lab@college.edu     / lab2@123');
    console.log('  Lab 3:      hardware.lab@college.edu / lab3@123');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    process.exit(0);
  }
}

seed();
