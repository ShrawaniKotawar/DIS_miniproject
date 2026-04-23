const db = require('./db');
require('dotenv').config();

async function fixSchema() {
  try {
    console.log('🔄 Fixing database schema...');

    // Add Asset_Name to EquipmentAsset
    const [cols] = await db.query('DESCRIBE EquipmentAsset');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('Asset_Name')) {
      console.log('➕ Adding Asset_Name to EquipmentAsset...');
      await db.query('ALTER TABLE EquipmentAsset ADD COLUMN Asset_Name VARCHAR(100) AFTER Asset_ID');
    }

    if (!colNames.includes('Status')) {
      console.log('➕ Adding Status to EquipmentAsset...');
      await db.query('ALTER TABLE EquipmentAsset ADD COLUMN Status VARCHAR(50) DEFAULT "Active" AFTER Purchase_Date');
    }

    // Check Department table
    const [deptCols] = await db.query('DESCRIBE Department');
    const deptColNames = deptCols.map(c => c.Field);

    if (!deptColNames.includes('Total_Budget')) {
      console.log('➕ Adding Total_Budget to Department...');
      await db.query('ALTER TABLE Department ADD COLUMN Total_Budget DECIMAL(12,2)');
    }

    // Create MaintenanceLog if it doesn't exist
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0].toLowerCase());

    if (!tableNames.includes('maintenancelog')) {
      console.log('➕ Creating MaintenanceLog table...');
      await db.query(`
        CREATE TABLE MaintenanceLog (
          Log_ID INT PRIMARY KEY AUTO_INCREMENT,
          Asset_ID INT,
          Generated_ID VARCHAR(100),
          Issue_Description TEXT,
          Status VARCHAR(50) DEFAULT 'Issue_Reported',
          Reported_Date DATE,
          Repair_Cost DECIMAL(10,2),
          Repair_Date DATE,
          Technician_Name VARCHAR(100),
          FOREIGN KEY (Asset_ID) REFERENCES EquipmentAsset(Asset_ID) ON DELETE CASCADE
        )
      `);
    } else {
        // Check if MaintenanceLog has Generated_ID
        const [mLogCols] = await db.query('DESCRIBE MaintenanceLog');
        const mLogColNames = mLogCols.map(c => c.Field);
        if (!mLogColNames.includes('Generated_ID')) {
            console.log('➕ Adding Generated_ID to MaintenanceLog...');
            await db.query('ALTER TABLE MaintenanceLog ADD COLUMN Generated_ID VARCHAR(100) AFTER Asset_ID');
        }
    }

    console.log('✅ Schema fixed successfully!');
  } catch (err) {
    console.error('❌ Schema fix failed:', err);
  } finally {
    process.exit(0);
  }
}

fixSchema();
