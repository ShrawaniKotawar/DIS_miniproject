import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="card p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110 ${color === 'text-green-600' ? 'bg-green-600' : 'bg-blue-600'}`}></div>
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color === 'text-green-600' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
            <p className={`text-2xl font-black tracking-tight ${color || 'text-slate-900'}`}>{value}</p>
            {sub && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

const statusBadge = (status) => {
  return null;
};

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function DepartmentDashboard() {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [deptInfo, setDeptInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedLab, setSelectedLab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States
  const [manageModal, setManageModal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [moveTargetLab, setMoveTargetLab] = useState('');
  const [historyModal, setHistoryModal] = useState(null);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintenanceLabFilter, setMaintenanceLabFilter] = useState('all');

  const fetchData = async () => {
    try {
      const [labRes, eqRes, deptRes, histRes] = await Promise.all([
        API.get('/labs'),
        API.get('/equipment'),
        API.get('/departments'),
        API.get('/history')
      ]);
      setLabs(labRes.data);
      setEquipment(eqRes.data);
      if (deptRes.data.length > 0) setDeptInfo(deptRes.data[0]);
      setHistory(histRes.data);
    } catch (err) {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveAsset = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return alert('Please select at least one unit to transfer.');
    if (!moveTargetLab) return alert('Please select a destination lab.');

    try {
      await API.put(`/equipment/${manageModal.Asset_ID}/move`, { 
        newLabId: parseInt(moveTargetLab), 
        selectedIds: selectedIds 
      });
      setManageModal(null);
      setSelectedIds([]);
      setMoveTargetLab('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error moving equipment');
    }
  };

  const handleMove = async (assetId, generatedId) => {
    const targetRoom = window.prompt("Enter Target Room Number (e.g., 301, 302):");
    if (!targetRoom) return;

    try {
        const targetLab = labs.find(l => String(l.Room_No) === targetRoom);
        if (!targetLab) {
            alert("Invalid Room Number. Choose an existing lab room.");
            return;
        }

        await API.put(`/equipment/${assetId}/move`, { newLabId: targetLab.Lab_ID, selectedIds: [generatedId] });
        alert(`Unit ${generatedId} moved to Room ${targetRoom} successfully.`);
        setManageModal(null);
        fetchData();
    } catch(err) {
        alert(err.response?.data?.message || 'Error moving equipment');
    }
  };

  const handleScrap = async (assetId, generatedId) => {
    if (!window.confirm(`Are you sure you want to scrap unit ${generatedId}?`)) return;
    try {
        await API.post(`/equipment/${assetId}/scrap`, { generatedId });
        alert(`Unit ${generatedId} marked as scrapped.`);
        setManageModal(null);
        fetchData();
    } catch(err) {
        alert(err.response?.data?.message || 'Error scrapping equipment');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEquipment =
    selectedLab === 'all'
      ? equipment
      : equipment.filter((e) => String(e.Lab_ID) === selectedLab);

  const totalAssetValue = equipment.reduce((s, e) => s + parseFloat(e.Total_Cost || 0), 0);
  const totalItems = equipment.reduce((s, e) => s + parseInt(e.Quantity || 0), 0);
  const uniqueSuppliers = new Set(equipment.map(e => e.Supplier_Name)).size;
  const uniqueCategories = new Set(equipment.map(e => e.Category)).size;

  const TOTAL_BUDGET = 1000000;
  const budgetRemaining = TOTAL_BUDGET - totalAssetValue;

  const inventorySummary = useMemo(() => {
    const summary = {};
    equipment.forEach(eq => {
      const name = eq.Category || 'Unknown';
      if (!summary[name]) {
        summary[name] = { total: 0, batches: [] };
      }
      summary[name].total += eq.Quantity;
      summary[name].batches.push({
        date: eq.Purchase_Date ? new Date(eq.Purchase_Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown',
        qty: eq.Quantity
      });
    });

    Object.keys(summary).forEach(name => {
      const consolidatedBatches = {};
      summary[name].batches.forEach(b => {
        consolidatedBatches[b.date] = (consolidatedBatches[b.date] || 0) + b.qty;
      });
      summary[name].batches = Object.entries(consolidatedBatches).map(([date, qty]) => ({ date, qty }));
    });

    return summary;
  }, [equipment]);

  const chartData = Object.keys(inventorySummary).map(name => ({
    name,
    total: inventorySummary[name].total
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] pb-20 selection:bg-blue-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-200">
                    Dept Administration
                </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Department Dashboard</h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                {user?.deptName || 'Information Technology'} <span className="w-1 h-1 bg-slate-300 rounded-full"></span> Managing all labs and assets
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-3">
              <button 
                  onClick={() => setShowMaintenance(true)}
                  className="w-full md:w-auto h-12 px-6 bg-white text-indigo-600 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all hover:border-indigo-600 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Maintenance & History
              </button>

              <Link 
                  to="/register-equipment" 
                  className="w-full md:w-auto h-12 px-6 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Equipment
              </Link>

              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto overflow-x-auto h-12 items-center">
                <button 
                    onClick={() => setSelectedLab('all')}
                    className={`px-5 h-full rounded-lg font-bold text-xs transition-all whitespace-nowrap ${selectedLab === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    All Labs
                </button>
                {labs.map(lab => (
                    <button 
                        key={lab.Lab_ID}
                        onClick={() => setSelectedLab(String(lab.Lab_ID))}
                        className={`px-5 h-full rounded-lg font-bold text-xs transition-all whitespace-nowrap ${selectedLab === String(lab.Lab_ID) ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {lab.Room_No}
                    </button>
                ))}
              </div>
          </div>
        </div>

        {error && (
          <div className="mb-10 p-5 bg-red-50 border border-red-100 rounded-[2rem] text-red-700 text-sm font-bold flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">!</div>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-[5px] border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Data...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
              <StatCard 
                label="Total Equipment" 
                value={totalItems.toLocaleString('en-IN')} 
                sub="Units across labs"
                color="text-slate-900" 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              />
              <StatCard 
                label="Total Categories" 
                value={uniqueCategories} 
                sub="Equipment Types"
                color="text-green-600" 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              />
              <StatCard 
                label="Total Budget" 
                value={fmt(TOTAL_BUDGET)} 
                sub="Annual Allocation"
                color="text-indigo-600" 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard 
                label="Total Valuation" 
                value={fmt(totalAssetValue)} 
                sub="Spent on Assets"
                color="text-blue-600" 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
              />
              <StatCard 
                label="Budget Remaining" 
                value={fmt(budgetRemaining)} 
                sub={budgetRemaining < 0 ? "Budget Exceeded!" : "Available for Purchase"}
                color={budgetRemaining < 0 ? "text-red-600" : "text-emerald-600"}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>

            {/* Inventory Analytics Section */}
            {equipment.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
                      <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-widest">Inventory Distribution</h3>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                  <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                      {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 max-h-[400px] overflow-y-auto">
                      <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-widest">Purchase Breakdown</h3>
                      <div className="space-y-6">
                          {Object.keys(inventorySummary).map(name => (
                              <div key={name}>
                                  <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-bold text-slate-700 text-sm">{name}</h4>
                                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black">Total: {inventorySummary[name].total}</span>
                                  </div>
                                  <ul className="space-y-2 pl-4 border-l-2 border-slate-100">
                                      {inventorySummary[name].batches.map((batch, i) => (
                                          <li key={i} className="text-xs text-slate-500 font-medium">
                                              <span className="text-slate-700 font-bold">{batch.qty} units</span> purchased on {batch.date}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
            )}

            {/* Labs Overview Section */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Labs Overview</h2>
                    <div className="h-px bg-slate-200 flex-1 mx-8 opacity-50"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {labs.map((lab) => (
                    <div key={lab.Lab_ID} className="bg-white rounded-[2.5rem] p-1 shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all duration-300 hover:shadow-2xl hover:shadow-blue-200/40">
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${lab.Room_No === '301' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                                {lab.Room_No === '301' ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.654 1.328a.678.678 0 00-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 004.168 6.608 17.569 17.569 0 006.608 4.168c.601.211 1.286.033 1.77-.45l.935-.934a.678.678 0 00-.063-1.015l-2.307-1.794a.678.678 0 00-.58-.122l-2.19.547a1.695 1.695 0 01-1.657-.459L5.482 8.062a1.695 1.695 0 01-.46-1.657l.548-2.19a.678.678 0 00-.122-.58L3.654 1.328z" /></svg>
                                )}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">Room {lab.Room_No}</span>
                                <span className="mt-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">Info Tech Dept</span>
                            </div>
                        </div>

                        <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{lab.Lab_Name}</h3>
                        <p className="text-slate-400 font-bold text-sm mb-10 flex items-center gap-2">
                           Incharge: <span className="text-slate-700">{lab.Lab_Incharge || 'TBD'}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Items</p>
                                <p className="text-xl font-black text-slate-900">{lab.Equipment_Count || 0}</p>
                            </div>
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                                <p className="text-xl font-black text-green-600">{fmt(lab.Total_Asset_Value || 0)}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedLab(String(lab.Lab_ID))}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-300 border-2 ${selectedLab === String(lab.Lab_ID) ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-transparent border-slate-200 text-slate-500 hover:border-blue-600 hover:text-blue-600'}`}
                        >
                            {selectedLab === String(lab.Lab_ID) ? 'Filtering Table...' : 'View Equipment'}
                        </button>
                      </div>
                    </div>
                ))}
                </div>
            </div>

            {/* Equipment Table Container */}
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Assets</h2>
                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">
                        {selectedLab === 'all' ? 'Across All Labs' : `Lab ${labs.find(l => String(l.Lab_ID) === selectedLab)?.Room_No} Details`}
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Quick Filter:</span>
                    <select
                        value={selectedLab}
                        onChange={(e) => setSelectedLab(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl px-5 py-2.5 font-bold text-sm text-slate-700 outline-none ring-2 ring-slate-100 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                        <option value="all">Filter by lab: All</option>
                        {labs.map((l) => (
                            <option key={l.Lab_ID} value={String(l.Lab_ID)}>
                                {l.Room_No} - {l.Lab_Name}
                            </option>
                        ))}
                    </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      {['Supplier Details','Specs & Model','Location','Inventory','Value','Order Details','Date Added', 'Actions'].map((h) => (
                        <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredEquipment.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center opacity-40">
                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                <p className="text-lg font-black tracking-tight">No records discovered for this selection</p>
                            </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEquipment.map((eq) => (
                        <tr key={eq.Asset_ID} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-8 py-6">
                              <p className="font-black text-slate-900 tracking-tight text-base group-hover:text-blue-600 transition-colors">{eq.Supplier_Name}</p>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{eq.Category}</p>
                          </td>
                          <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-700">{eq.Model}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{eq.Manufacturer}</p>
                          </td>
                          <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${eq.Room_No === '301' ? 'bg-indigo-400' : 'bg-blue-400'}`}></div>
                                  <p className="text-sm font-black text-slate-900 tracking-tight">{eq.Room_No}</p>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest truncate max-w-[120px]">{eq.Lab_Name}</p>
                          </td>
                          <td className="px-8 py-6 align-middle">
                              <div className="bg-slate-100/80 px-4 py-1.5 rounded-lg inline-flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900">{eq.Quantity}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units</span>
                              </div>
                          </td>
                          <td className="px-8 py-6">
                              <p className="text-lg font-black text-slate-900 tracking-tighter">{fmt(eq.Total_Cost)}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{fmt(eq.Unit_Price)} / unit</p>
                          </td>
                          <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-700">{eq.Order_No || '—'}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{eq.Warranty || 'No Warranty'}</p>
                          </td>
                          <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-700">
                                {eq.Purchase_Date ? new Date(eq.Purchase_Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </p>
                          </td>
                          <td className="px-8 py-6 align-middle">
                            {eq.Generated_ID ? (
                                <button 
                                    onClick={() => {
                                        setManageModal(eq);
                                        setSelectedIds([]);
                                        setMoveTargetLab('');
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                >
                                    Manage {eq.Quantity} Units
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ) : (
                                <span className="text-xs font-bold text-slate-400">No Units</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredEquipment.length > 0 && (
                <div className="px-10 py-5 bg-slate-50/30 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Summary Record Metadata</p>
                  <p className="text-xs font-bold text-slate-500 italic">Showing {filteredEquipment.length} items discovered in deep scan</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Manage Units Modal */}
      {manageModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">{manageModal.Category}</span>
                            <span className="text-slate-400 text-sm font-bold">Currently in Room {manageModal.Room_No}</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{manageModal.Asset_Name || manageModal.Model || 'Equipment Batch'}</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{manageModal.Supplier_Name}</p>
                    </div>
                    <button onClick={() => setManageModal(null)} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleMoveAsset} className="flex-1 overflow-hidden flex flex-col">
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Transfer Equipment</h4>
                            <p className="text-xs font-bold text-slate-500">Select units from the list below and choose a destination lab to transfer them.</p>
                        </div>
                        <div className="flex-1 min-w-[250px]">
                            <select 
                                value={moveTargetLab}
                                onChange={(e) => setMoveTargetLab(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm"
                            >
                                <option value="" disabled>Select Destination Lab...</option>
                                {labs.filter(l => String(l.Lab_ID) !== String(manageModal.Lab_ID)).map(l => (
                                    <option key={l.Lab_ID} value={l.Lab_ID}>Room {l.Room_No} - {l.Lab_Name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button 
                                type="submit" 
                                disabled={selectedIds.length === 0 || !moveTargetLab}
                                className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white disabled:bg-slate-300 disabled:shadow-none rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                Transfer {selectedIds.length > 0 ? selectedIds.length : ''} Units
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 pr-4 space-y-3">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{manageModal.Quantity} Total Units</span>
                            <button 
                                type="button"
                                onClick={() => {
                                    const allIds = manageModal.Generated_ID.split(', ');
                                    if (selectedIds.length === allIds.length) setSelectedIds([]);
                                    else setSelectedIds(allIds);
                                }}
                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                            >
                                {selectedIds.length === manageModal.Generated_ID.split(', ').length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {manageModal.Generated_ID.split(', ').map(tag => {
                                const activeLog = history.find(h => h.Asset_ID === manageModal.Asset_ID && h.Generated_ID === tag && h.Status === 'Issue_Reported');
                                const isSelected = selectedIds.includes(tag);
                                
                                return (
                                    <div 
                                        key={tag} 
                                        className={`flex items-center justify-between gap-4 p-4 rounded-2xl border-2 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100' : 'bg-white border-slate-100'}`}
                                    >
                                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => {
                                            if (isSelected) setSelectedIds(selectedIds.filter(id => id !== tag));
                                            else setSelectedIds([...selectedIds, tag]);
                                        }}>
                                            <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 tracking-wide text-sm">{tag}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${activeLog ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeLog ? 'Needs Repair' : 'Healthy'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => handleMove(manageModal.Asset_ID, tag)}
                                                className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                                title="Transfer Unit"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handleScrap(manageModal.Asset_ID, tag)}
                                                className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                                title="Scrap Unit"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const assetLogs = history.filter(h => h.Asset_ID === manageModal.Asset_ID && h.Generated_ID === tag);
                                                    setHistoryModal({ assetId: manageModal.Asset_ID, generatedId: tag, assetName: manageModal.Asset_Name, logs: assetLogs });
                                                }}
                                                className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                                title="View Unit History"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">Maintenance History</h3>
                        <p className="text-slate-500 text-sm mt-1">{historyModal.assetName} (Unit: {historyModal.generatedId})</p>
                    </div>
                    <button onClick={() => setHistoryModal(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="overflow-y-auto flex-1 pr-2">
                    {historyModal.logs.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-400 font-bold">No maintenance history recorded for this asset.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {historyModal.logs.map(log => (
                                <div key={log.Log_ID} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-slate-800 text-lg">{log.Issue_Description}</h4>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            log.Status === 'Repaired' ? 'bg-green-100 text-green-600' : 
                                            log.Status === 'Transferred' ? 'bg-blue-100 text-blue-600' :
                                            log.Status === 'Scrapped' ? 'bg-slate-100 text-slate-600' :
                                            'bg-amber-100 text-amber-600'
                                        }`}>
                                            {log.Status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reported On</p>
                                            <p className="text-sm font-bold text-slate-700">{new Date(log.Reported_Date).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Repaired On</p>
                                            <p className="text-sm font-bold text-slate-700">{log.Repair_Date ? new Date(log.Repair_Date).toLocaleDateString('en-GB') : '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Technician</p>
                                            <p className="text-sm font-bold text-slate-700">{log.Technician_Name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Repair Cost</p>
                                            <p className="text-sm font-bold text-slate-700">{log.Repair_Cost ? `₹${log.Repair_Cost}` : '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
      {/* Maintenance Global History Modal */}
      {showMaintenance && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Maintenance & Logs</h3>
                        <p className="text-slate-500 font-medium mt-1">Audit trail for all equipment repairs and issue reports.</p>
                        
                        <div className="flex items-center gap-2 mt-6">
                            <button 
                                onClick={() => setMaintenanceLabFilter('all')}
                                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${maintenanceLabFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}
                            >
                                All History
                            </button>
                            {labs.map(l => (
                                <button 
                                    key={l.Lab_ID}
                                    onClick={() => setMaintenanceLabFilter(String(l.Lab_ID))}
                                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${maintenanceLabFilter === String(l.Lab_ID) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}
                                >
                                    Room {l.Room_No}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setShowMaintenance(false)} className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-4 space-y-6">
                    {history.filter(h => maintenanceLabFilter === 'all' || String(h.Lab_ID) === maintenanceLabFilter).length === 0 ? (
                        <div className="py-20 text-center opacity-40">
                             <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                             <p className="text-xl font-black tracking-tight">No maintenance records found for this selection</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {history.filter(h => maintenanceLabFilter === 'all' || String(h.Lab_ID) === maintenanceLabFilter).map(log => (
                                <div key={log.Log_ID} className="group bg-slate-50 hover:bg-indigo-50/30 rounded-3xl p-8 border border-slate-100 hover:border-indigo-100 transition-all">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    log.Status === 'Repaired' ? 'bg-green-100 text-green-600' : 
                                                    log.Status === 'Transferred' ? 'bg-blue-100 text-blue-600' :
                                                    log.Status === 'Scrapped' ? 'bg-slate-100 text-slate-600' :
                                                    'bg-amber-100 text-amber-600'
                                                }`}>
                                                    {log.Status.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs font-black text-slate-400">#LOG-{log.Log_ID}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight mt-2">{log.Asset_Name}</h4>
                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-500 mt-1">
                                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Room {log.Room_No}</span>
                                                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                                                <span className="text-slate-400">Unit ID: {log.Generated_ID}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:items-end text-left md:text-right gap-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {log.Status === 'Repaired' ? 'Resolution' : 
                                                 log.Status === 'Transferred' ? 'Movement Details' :
                                                 log.Status === 'Scrapped' ? 'Decommissioning' :
                                                 'Pending Action'}
                                            </p>
                                            <p className="text-sm font-black text-slate-800 leading-tight bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 italic">{log.Issue_Description}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 pt-6 border-t border-slate-200/50">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incident Date</p>
                                            <p className="text-sm font-bold text-slate-700">{new Date(log.Reported_Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Update</p>
                                            <p className="text-sm font-bold text-slate-700">{log.Repair_Date ? new Date(log.Repair_Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'In Progress'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Personnel</p>
                                            <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{log.Technician_Name || 'Awaiting Tech'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Financial Impact</p>
                                            <p className={`text-sm font-black ${log.Repair_Cost ? 'text-red-600' : 'text-slate-300'}`}>{log.Repair_Cost ? `- ${fmt(log.Repair_Cost)}` : '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span>Audit System Active</span>
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        Live Data Streaming
                    </span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

