import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const statusBadge = (status) => {
  return null;
};

function StatCard({ label, value, color, icon }) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
      </div>
    );
}

export default function LabDashboard() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [labInfo, setLabInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States
  const [issueModal, setIssueModal] = useState(null);
  const [issueDesc, setIssueDesc] = useState('');
  const [repairModal, setRepairModal] = useState(null);
  const [repairCost, setRepairCost] = useState('');
  const [repairTech, setRepairTech] = useState('');
  const [historyModal, setHistoryModal] = useState(null); // { assetId, generatedId, logs: [] }
  const [manageModal, setManageModal] = useState(null); // the batch object

  const fetchData = async () => {
    try {
      const [eqRes, labRes, histRes] = await Promise.all([
        API.get('/equipment'),
        API.get('/labs'),
        API.get('/history')
      ]);
      setEquipment(eqRes.data);
      if (labRes.data.length > 0) setLabInfo(labRes.data[0]);
      setHistory(histRes.data);
    } catch (err) {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    try {
      await API.post('/history/issue', { 
        assetId: issueModal.assetId, 
        generatedId: issueModal.generatedId,
        issueDescription: issueDesc 
      });
      setIssueModal(null);
      setIssueDesc('');
      setManageModal(null);
      fetchData();
    } catch(err) {
      alert('Error reporting issue');
    }
  };

  const handleScrap = async (assetId, generatedId) => {
    if (!window.confirm(`Are you sure you want to scrap unit ${generatedId}? This action cannot be undone.`)) return;
    try {
      await API.put(`/equipment/${assetId}/scrap`, { generatedId });
      setManageModal(null);
      fetchData();
    } catch(err) {
      alert(err.response?.data?.message || 'Error scrapping equipment');
    }
  };

  const handleLogRepair = async (e) => {
    e.preventDefault();
    try {
      await API.post('/history/repair', { 
        logId: repairModal.logId, 
        repairCost: parseFloat(repairCost),
        technicianName: repairTech
      });
      setRepairModal(null);
      setRepairCost('');
      setRepairTech('');
      setManageModal(null);
      fetchData();
    } catch(err) {
      alert(err.response?.data?.message || 'Error logging repair');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalCost = equipment.reduce((s, e) => s + parseFloat(e.Total_Cost || 0), 0);

  const inventorySummary = useMemo(() => {
    const summary = {};
    equipment.forEach(eq => {
      const name = eq.Asset_Name || 'Unknown';
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


  const totalQuantity = equipment.reduce((s, e) => s + parseInt(e.Quantity || 0), 0);
  const uniqueCategories = new Set(equipment.map(e => e.Category)).size;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Outfit'] pb-20 selection:bg-blue-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Lab Info Banner */}
        <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-900/20">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 -ml-20 -mb-20 bg-blue-400/20 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md">
                                Information Technology
                            </span>
                            <span className="hidden sm:inline w-1 h-1 bg-white/40 rounded-full"></span>
                            <span className="text-white/70 font-bold text-sm">Room {labInfo?.Room_No || '...'}</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">{labInfo?.Lab_Name || 'Lab Dashboard'}</h1>
                        <p className="text-blue-100 font-medium mt-1">Incharge: <span className="text-white font-bold">{labInfo?.Lab_Incharge || 'Loading...'}</span></p>
                    </div>
                </div>

                <Link 
                    to="/register-equipment" 
                    className="self-start md:self-center px-8 py-4 bg-white text-blue-700 rounded-2xl font-black text-sm uppercase tracking-wider transition-all hover:bg-blue-50 hover:shadow-xl hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Equipment
                </Link>
            </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-3xl text-red-700 text-sm font-bold flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">!</div>
             {error}
          </div>
        )}

        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-[5px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Lab Vault...</p>
             </div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard 
                    label="Total Quantity" 
                    value={totalQuantity} 
                    color="text-green-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                />
                <StatCard 
                    label="Categories" 
                    value={uniqueCategories} 
                    color="text-amber-500"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard 
                    label="Total Records" 
                    value={equipment.length} 
                    color="text-slate-900"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                />
                <StatCard 
                    label="Lab Valuation" 
                    value={fmt(totalCost)} 
                    color="text-blue-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
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

            {/* Equipment Table */}
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lab Equipment Assets</h2>
                <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{equipment.length} assets audited</p>
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <p className="text-xs font-bold text-slate-300 italic italic">Restricted View</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      {['#','Supplier Details','Model & Brand','Stats','Pricing','Order Details','Purchased', 'Actions'].map((h) => (
                        <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {equipment.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-24 text-center">
                          <div className="flex flex-col items-center gap-6 max-w-xs mx-auto">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">No equipment discovered</h3>
                                <p className="text-slate-400 font-medium text-sm mt-1">Start building your lab's digital inventory today.</p>
                            </div>
                            <Link to="/register-equipment" className="btn-primary w-full">
                              + Register First Item
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      equipment.map((eq, idx) => (
                        <tr key={eq.Asset_ID} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-8 py-6 text-slate-300 font-black text-xs">{(idx + 1).toString().padStart(2, '0')}</td>
                          <td className="px-8 py-6">
                              <p className="font-black text-slate-900 tracking-tight text-base group-hover:text-blue-600 transition-colors">{eq.Supplier_Name}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{eq.Category}</p>
                          </td>
                          <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-700">{eq.Model || '—'}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{eq.Manufacturer || 'Generic'}</p>
                          </td>
                          <td className="px-8 py-6 align-top">
                              <div className="bg-slate-100/80 px-4 py-1.5 rounded-lg inline-flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900">{eq.Quantity}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units</span>
                              </div>
                          </td>
                          <td className="px-8 py-6">
                              <p className="text-lg font-black text-slate-900 tracking-tighter">{fmt(eq.Total_Cost)}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{fmt(eq.Unit_Price)} each</p>
                          </td>
                          <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-700">{eq.Order_No || '—'}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{eq.Warranty || 'No Warranty'}</p>
                          </td>
                          <td className="px-8 py-6">
                             <p className="text-sm font-bold text-slate-700">
                                {eq.Purchase_Date ? new Date(eq.Purchase_Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending'}
                             </p>
                          </td>
                          <td className="px-8 py-6 align-middle">
                            {eq.Generated_ID ? (
                                <button 
                                    onClick={() => setManageModal(eq)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
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
            </div>
          </>
        )}
      </main>

      {/* Manage Units Modal */}
      {manageModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{manageModal.Category}</span>
                            <span className="text-slate-400 text-sm font-bold">{manageModal.Quantity} Active Units</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{manageModal.Asset_Name || manageModal.Model || 'Equipment Batch'}</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{manageModal.Supplier_Name}</p>
                    </div>
                    <button onClick={() => setManageModal(null)} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="overflow-y-auto flex-1 pr-4 space-y-4">
                    {manageModal.Generated_ID.split(', ').map(tag => {
                        const activeLog = history.find(h => h.Asset_ID === manageModal.Asset_ID && h.Generated_ID === tag && h.Status === 'Issue_Reported');
                        
                        return (
                            <div key={tag} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 rounded-2xl border ${activeLog ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'} hover:border-blue-200 transition-colors group`}>
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${activeLog ? 'bg-amber-100 text-amber-600' : 'bg-white text-green-500'}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {activeLog ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 tracking-wide text-lg group-hover:text-blue-600 transition-colors">{tag}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`w-2 h-2 rounded-full ${activeLog ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeLog ? 'Needs Repair' : 'Active & Healthy'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button 
                                        onClick={() => {
                                            const assetLogs = history.filter(h => h.Asset_ID === manageModal.Asset_ID && h.Generated_ID === tag);
                                            setHistoryModal({ assetId: manageModal.Asset_ID, generatedId: tag, assetName: manageModal.Asset_Name, logs: assetLogs });
                                        }}
                                        className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        History
                                    </button>
                                    
                                    {activeLog ? (
                                        <button 
                                            onClick={() => setRepairModal({ logId: activeLog.Log_ID })}
                                            className="px-5 py-2.5 bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                            Log Repair
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setIssueModal({ assetId: manageModal.Asset_ID, generatedId: tag })}
                                            className="px-5 py-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            Report Issue
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => handleScrap(manageModal.Asset_ID, tag)}
                                        className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Scrap
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* Issue Modal */}
      {issueModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-2xl font-black text-slate-900 mb-2">Report Equipment Issue</h3>
                <p className="text-slate-500 text-sm mb-6">Describe the problem encountered. This will alert the department and prepare for a repair log.</p>
                <form onSubmit={handleReportIssue}>
                    <textarea 
                        required
                        value={issueDesc}
                        onChange={(e) => setIssueDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none h-32 mb-6"
                        placeholder="E.g., The screen is flickering on startup..."
                    ></textarea>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setIssueModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">Report Issue</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Repair Modal */}
      {repairModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-2xl font-black text-slate-900 mb-2">Log Repair</h3>
                <p className="text-slate-500 text-sm mb-6">Record the successful repair. This will automatically deduct the repair cost from the Department Budget.</p>
                <form onSubmit={handleLogRepair}>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Technician Name</label>
                            <input 
                                type="text"
                                required
                                value={repairTech}
                                onChange={(e) => setRepairTech(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Repair Cost (INR)</label>
                            <input 
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={repairCost}
                                onChange={(e) => setRepairCost(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                placeholder="e.g. 5000"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setRepairModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20">Confirm Repair</button>
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
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${log.Status === 'Repaired' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
    </div>
  );
}

