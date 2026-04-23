# Lab Management System

A state-of-the-art, full-stack Laboratory Management System designed for engineering colleges to handle asset tracking, maintenance audits, and departmental financial oversight with a premium, glassmorphism-inspired interface.

## ✨ Features

###  Department Dashboard
- **Financial Oversight**: Real-time tracking of Total Valuation vs. ₹1,000,000 Annual Budget.
- **Global Inventory Audit**: Consolidated view of all equipment across all labs (Room 301, 302, etc.).
- **Centralized Maintenance**: Audit trail of every repair, scrap, and internal transfer.
- **Distribution Control**: Exclusive authority to transfer equipment between labs.

###  Lab-Specific Dashboard
- **Live Inventory Tracking**: Real-time valuation and quantity breakdown for specific lab assets.
- **Action Management**: Quick reporting for equipment issues and logging of repairs.
- **Localized Analytics**: Visual charts showing equipment distribution by category (Mouse, Keyboard, Printer, etc.).

###  Smart Registration Flow
- **Two-Step Registration**: Modern, public-facing multi-step form for registering new assets.
- **Bulk Assignment**: Logical distribution of bulk orders across multiple labs in a single session.
- **Automated Tracking IDs**: Generates unique tracking IDs for every single unit (e.g., `246/2026/IT/302`).

###  Maintenance & Audit System
- **Repair Logging**: Track technician assignments, resolution dates, and financial impact.
- **Transfer History**: Complete audit trail for equipment moving between labs (Inbound/Outbound).
- **Scrap Management**: Decommission broken assets while preserving historical purchase data.

##  Technology Stack

- **Frontend**: React.js with Vite, Tailwind CSS (Modern Glassmorphism UI)
- **Backend**: Node.js & Express.js
- **Database**: MySQL (Reliable relational data for financial auditing)
- **Charts**: Recharts (Dynamic inventory analytics)
- **Icons**: Lucide React / SVG (State-of-the-art micro-interactions)

##  Installation & Setup

### 1. Database Configuration
Create a MySQL database named `lab_management_db` and run the `schema.sql` (if provided) or manually set up the tables: `Department`, `Lab`, `EquipmentAsset`, `Users`, and `MaintenanceLog`.

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with your DB credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASS=yourpassword
# DB_NAME=lab_management_db
# JWT_SECRET=your_secret_key
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

##  Design Philosophy
The system utilizes a **Modern Glassmorphism** aesthetic, featuring:
- Soft backdrop blurs and subtle gradients.
- High-contrast typography (Outfit font).
- Dynamic hover states and micro-animations.
- Role-specific color palettes (Indigo for Department, Blue for Lab).

##  Budget Logic
The system maintains a fixed Departmental Budget of **₹1,000,000**. 
- **Total Valuation**: Sum of all `Total_Cost` fields in `EquipmentAsset`.
- **Remaining Budget**: `1,000,000 - Total_Valuation`.
- **Status Metrics**: Automatically alerts with red highlights if the spending exceeds the allocated budget.

---
*Created for Advanced Engineering Lab Management.*
