import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const statusBadge = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'active') return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-100 italic">Active</span>;
  if (s.includes('repair') || s.includes('maintenance')) return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 italic">Under Repair</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100 italic">{status}</span>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [eqRes, labRes] = await Promise.all([
        API.get('/equipment'),
        API.get('/labs'),
      ]);
      setEquipment(eqRes.data);
      if (labRes.data.length > 0) setLabInfo(labRes.data[0]);
    } catch (err) {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalCost = equipment.reduce((s, e) => s + parseFloat(e.Total_Cost || 0), 0);
  const activeCount = equipment.filter((e) => (e.Status || '').toLowerCase() === 'active').length;
  const repairCount = equipment.filter((e) => (e.Status || '').toLowerCase().includes('repair')).length;

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
                    label="Active Assets" 
                    value={activeCount} 
                    color="text-green-600"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                />
                <StatCard 
                    label="Under Repair" 
                    value={repairCount} 
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
                      {['#','Asset Details','Model & Brand','Stats','Pricing','Status','Purchased'].map((h) => (
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
                              <p className="font-black text-slate-900 tracking-tight text-base group-hover:text-blue-600 transition-colors">{eq.Asset_Name}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{eq.Category}</p>
                          </td>
                          <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-700">{eq.Model || '—'}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{eq.Manufacturer || 'Generic'}</p>
                          </td>
                          <td className="px-8 py-6">
                              <div className="bg-slate-100/80 px-4 py-1.5 rounded-lg inline-flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900">{eq.Quantity}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units</span>
                              </div>
                          </td>
                          <td className="px-8 py-6">
                              <p className="text-lg font-black text-slate-900 tracking-tighter">{fmt(eq.Total_Cost)}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{fmt(eq.Unit_Price)} each</p>
                          </td>
                          <td className="px-8 py-6">{statusBadge(eq.Status)}</td>
                          <td className="px-8 py-6">
                             <p className="text-sm font-bold text-slate-700">
                                {eq.Purchase_Date ? new Date(eq.Purchase_Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending'}
                             </p>
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
    </div>
  );
}

