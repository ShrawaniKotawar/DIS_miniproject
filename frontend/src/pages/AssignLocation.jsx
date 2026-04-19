import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import API from '../api';

const LABS = [
  { id: 1, name: '301 - DBMS Lab' },
  { id: 2, name: '302 - Network Lab' },
];

export default function AssignLocation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const equipmentData = state?.equipmentData;

  const totalQty = equipmentData ? parseInt(equipmentData.quantity) : 0;
  
  const [dept, setDept] = useState('');
  const [assignments, setAssignments] = useState([{ labId: '', quantity: totalQty }]);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const allocatedQty = assignments.reduce((s, a) => s + (parseInt(a.quantity) || 0), 0);
  const remainingQty = totalQty - allocatedQty;

  const handleAssignmentChange = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;
    setAssignments(newAssignments);
  };

  const addAssignment = () => {
    if (remainingQty > 0) {
      setAssignments([...assignments, { labId: '', quantity: remainingQty }]);
    }
  };

  const removeAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  // If someone visits directly without state, redirect back to step 1
  if (!equipmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-['Outfit']">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm">
          <p className="text-slate-500 font-bold mb-4">No equipment data found.</p>
          <Link to="/register-equipment" className="btn-primary">Start Over</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dept) return;
    
    if (assignments.some(a => !a.labId || !a.quantity || a.quantity <= 0)) {
        alert('Please select a valid lab and allocate a correct quantity for all rows.');
        return;
    }
    
    if (allocatedQty !== totalQty) {
        alert(`You must allocate exactly ${totalQty} units. Currently allocated: ${allocatedQty}`);
        return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...equipmentData,
        assignments: assignments.map(a => ({
          labId: parseInt(a.labId),
          quantity: parseInt(a.quantity)
        })),
      };
      const res = await API.post('/equipment', payload);
      setSuccess(res.data.assets || true);
      setTimeout(() => navigate('/'), 6000);
    } catch (err) {
      alert('Failed to register equipment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAssignedLabs = () => {
      const labNames = assignments.map(a => {
          const l = LABS.find(lab => String(lab.id) === String(a.labId));
          return l ? l.name : '';
      }).filter(Boolean);
      if (labNames.length === 1) return labNames[0];
      return `Multiple Labs (${labNames.join(', ')})`;
  };

  if (success) {
    const assets = Array.isArray(success) ? success : [];
    const allTags = assets.flatMap(a => a.Generated_ID ? a.Generated_ID.split(', ') : []);

    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600 font-['Outfit'] p-6">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Registration Successful!</h2>
          <p className="text-slate-500 text-base font-medium leading-relaxed px-2">
            Equipment order from <span className="text-blue-600 font-black">"{equipmentData.supplier_name}"</span> has been grouped to <span className="text-slate-900 font-black">{renderAssignedLabs()}</span>.
          </p>

          {allTags.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left overflow-y-auto max-h-40 shadow-inner">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Generated Tracking IDs</p>
                 <div className="flex flex-wrap gap-2">
                     {allTags.map((tag, idx) => (
                         <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-2 py-1 rounded-md tracking-wider shadow-sm">{tag}</span>
                     ))}
                 </div>
              </div>
          )}

          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pt-4 animate-pulse">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Outfit'] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-bold text-sm">Back to Step 1</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
            <div className="h-px w-8 bg-blue-600"></div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="mb-4">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Assign Location</h1>
                <p className="text-slate-500 mt-2 font-medium">Where should this equipment be assigned?</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="label">Select Department</label>
                  <select 
                    value={dept} 
                    onChange={(e) => setDept(e.target.value)} 
                    className="input-field cursor-pointer font-bold text-base bg-blue-50/30 border-blue-100"
                    required
                  >
                    <option value="">Choose a department</option>
                    <option value="IT">Information Technology</option>
                  </select>
                </div>

                {dept === 'IT' && (
                  <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="label mb-0">Assign to Labs</label>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${remainingQty === 0 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            Unassigned: {remainingQty} / {totalQty}
                        </span>
                    </div>
                    
                    {assignments.map((assignment, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl relative group pb-5 pt-6 sm:p-4 mt-2">
                            {assignments.length > 1 && (
                                <button type="button" onClick={() => removeAssignment(idx)} className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center text-xs font-bold shadow-sm transition-colors border border-red-200 z-10 flex sm:hidden sm:group-hover:flex">
                                    ✕
                                </button>
                            )}
                            <div className="flex-1 w-full">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Lab Name</label>
                                <select 
                                  value={assignment.labId} 
                                  onChange={(e) => handleAssignmentChange(idx, 'labId', e.target.value)} 
                                  className="input-field cursor-pointer text-sm font-bold bg-white"
                                  required
                                >
                                  <option value="">Choose a lab</option>
                                  {LABS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-none w-full sm:w-1/3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Allocated Qty</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={parseInt(assignment.quantity) + remainingQty}
                                  value={assignment.quantity}
                                  onChange={(e) => handleAssignmentChange(idx, 'quantity', e.target.value)}
                                  className="input-field text-sm font-bold bg-white"
                                  required
                                />
                            </div>
                        </div>
                    ))}
                    
                    {remainingQty > 0 && (
                        <button type="button" onClick={addAssignment} className="w-full py-4 mt-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                            <span>+ Split to another lab (Remaining: {remainingQty})</span>
                        </button>
                    )}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={submitting || remainingQty !== 0}
                className="btn-primary w-full py-4 text-base shadow-xl shadow-blue-600/30 disabled:bg-slate-200 disabled:shadow-none"
              >
                {submitting ? (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                    </div>
                ) : 'Submit Equipment'}
              </button>
            </form>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
            <div className="sticky top-24 bg-[#1a1a2e] p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-900/20">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    Summary
                </h3>
                <div className="space-y-6">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Supplier Name</p>
                        <p className="text-lg font-bold leading-tight">{equipmentData.supplier_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Category</p>
                            <p className="font-bold text-slate-200">{equipmentData.category}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Quantity</p>
                            <p className="font-bold text-slate-200">{equipmentData.quantity}</p>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Estimated Total</p>
                        <p className="text-3xl font-black text-blue-400 tracking-tighter">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(equipmentData.unit_price) * parseInt(equipmentData.quantity))}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
