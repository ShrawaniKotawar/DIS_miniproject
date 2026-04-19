import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api';
import { useAuth } from '../context/AuthContext';

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
  const [selectedLab, setSelectedLab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [labRes, eqRes] = await Promise.all([
          API.get('/labs'),
          API.get('/equipment'),
        ]);
        setLabs(labRes.data);
        setEquipment(eqRes.data);
      } catch (err) {
        setError('Failed to load data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
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
          
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            <button 
                onClick={() => setSelectedLab('all')}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedLab === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                All Information
            </button>
            {labs.map(lab => (
                <button 
                    key={lab.Lab_ID}
                    onClick={() => setSelectedLab(String(lab.Lab_ID))}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedLab === String(lab.Lab_ID) ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    {lab.Room_No}
                </button>
            ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard 
                label="Total Equipment" 
                value={totalItems.toLocaleString('en-IN')} 
                sub="Units across labs"
                color="text-slate-900" 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              />
              <StatCard 
                label="Total Suppliers" 
                value={uniqueSuppliers} 
                sub="Active Vendors"
                color="text-green-600" 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              />
              <StatCard 
                label="Categories" 
                value={uniqueCategories} 
                sub="Asset Types"
                color="text-amber-500" 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard 
                label="Total Valuation" 
                value={fmt(totalAssetValue)} 
                sub="Est. Replacement cost"
                color="text-blue-600" 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>

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
                      {['Supplier Details','Specs & Model','Location','Inventory','Value','Order Details','Date Added'].map((h) => (
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
                          <td className="px-8 py-6">
                              <div className="bg-slate-100/80 px-4 py-1.5 rounded-lg inline-flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900">{eq.Quantity}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units</span>
                              </div>
                              {eq.Generated_ID && (
                                  <div className="mt-2 space-y-1">
                                      {eq.Generated_ID.split(', ').map((tag, i) => (
                                          <p key={i} className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white inline-block px-1 rounded border border-slate-100">{tag}</p>
                                      ))}
                                  </div>
                              )}
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
    </div>
  );
}

