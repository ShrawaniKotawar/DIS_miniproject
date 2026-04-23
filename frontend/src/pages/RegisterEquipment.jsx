import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const CATEGORIES = ['Mouse', 'Keyboard', 'Computer Set', 'Monitor', 'Printer', 'Power Cable', 'USB Cable'];

export default function RegisterEquipment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    supplier_name: '',
    category: 'Mouse',
    model: '',
    manufacturer: '',
    unit_price: '',
    quantity: '1',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier_email: '',
    supplier_contact: '',
    warranty: '',
    order_no: '',
  });

  const totalCost = (parseFloat(form.unit_price) || 0) * (parseInt(form.quantity) || 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.supplier_name || !form.unit_price || !form.quantity) {
      alert('Please fill in Supplier Name, Unit Price, and Quantity.');
      return;
    }
    navigate('/register-equipment/assign', { state: { equipmentData: form } });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Outfit'] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-bold text-sm">Exit Registration</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
            <div className="h-px w-8 bg-slate-200"></div>
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-xs font-bold">2</div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-12">
        <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Equipment Details</h1>
            <p className="text-slate-500 mt-2 font-medium">Step 1: Enter information about the new asset</p>
        </div>

        <form onSubmit={handleNext} className="space-y-8 bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2">
              <label className="label">Supplier Name</label>
              <input
                name="supplier_name"
                value={form.supplier_name}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Dell India"
                required
              />
            </div>

            <div>
              <label className="label">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field cursor-pointer">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Supplier Email</label>
              <input
                name="supplier_email"
                type="email"
                value={form.supplier_email}
                onChange={handleChange}
                className="input-field"
                placeholder="contact@supplier.com"
              />
            </div>

            <div>
              <label className="label">Supplier Contact Number</label>
              <input
                name="supplier_contact"
                type="tel"
                value={form.supplier_contact}
                onChange={handleChange}
                className="input-field"
                placeholder="+91..."
              />
            </div>

            <div>
              <label className="label">Warranty</label>
              <input
                name="warranty"
                type="text"
                value={form.warranty}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 2 years"
              />
            </div>

            <div>
              <label className="label">Order Number</label>
              <input
                name="order_no"
                type="text"
                value={form.order_no}
                onChange={handleChange}
                className="input-field"
                placeholder="ORD-12345"
              />
            </div>

            <div>
              <label className="label">Model</label>
              <input name="model" value={form.model} onChange={handleChange} className="input-field" placeholder="Model designation" />
            </div>

            <div>
              <label className="label">Manufacturer</label>
              <input name="manufacturer" value={form.manufacturer} onChange={handleChange} className="input-field" placeholder="e.g. Dell, Cisco, HP" />
            </div>

            <div>
              <label className="label">Unit Price (₹)</label>
              <input
                name="unit_price"
                type="number"
                value={form.unit_price}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="label">Quantity</label>
              <input
                name="quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Purchase Date</label>
              <input
                name="purchase_date"
                type="date"
                value={form.purchase_date}
                onChange={handleChange}
                className="input-field"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-slate-600 font-bold uppercase tracking-widest text-xs">Calculated Total Cost</span>
            <span className="text-2xl font-black text-blue-600 tracking-tighter">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalCost)}
            </span>
          </div>

          <button type="submit" className="btn-primary w-full py-4 text-base mt-4 shadow-xl shadow-blue-600/20">
            Next: Assign Location →
          </button>
        </form>
      </main>
    </div>
  );
}
