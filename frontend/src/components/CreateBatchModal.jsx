import React, { useState } from 'react';
import { X, Save, Bird, Calendar, Hash, Tag, CheckCircle2 } from 'lucide-react';
import api from "../api/axios";

export default function CreateBatchModal({ isOpen, onClose, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false); // Track success for UI feedback
    const [formData, setFormData] = useState({
        batch_number: '', 
        name: '',
        breed: 'Cobb 500',
        quantity_received: '',
        date_received: new Date().toISOString().split('T')[0],
        status: 'active'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                batch_number: formData.batch_number || undefined, 
                breed: formData.breed,
                quantity_received: parseInt(formData.quantity_received),
                acquisition_date: formData.date_received, 
                status: formData.status
            };

            await api.post("my-farm/flock/batches/", payload);
            
            // Trigger Success State
            setSuccess(true);
            onRefresh();

            // Auto-close after 1.5 seconds to let the user see the success message
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1500);

        } catch (error) {
            console.error("Validation Error:", error.response?.data);
            const errorMsg = error.response?.data 
                ? JSON.stringify(error.response.data) 
                : "Connection to registry failed.";
            alert("Error: " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-slate-900">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 relative">
                
                {/* --- SUCCESS OVERLAY --- */}
                {success && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-500">
                        <div className="bg-green-100 p-4 rounded-full mb-4 animate-bounce">
                            <CheckCircle2 size={48} className="text-green-600" />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                            Batch <span className="text-green-600">Committed</span>
                        </h3>
                        <p className="text-slate-500 font-bold text-sm mt-2">Registry updated successfully.</p>
                    </div>
                )}

                {/* --- HEADER --- */}
                <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase italic">
                            Initialize <span className="text-blue-600">New Batch</span>
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* --- FORM --- */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Batch ID</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-3.5 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Auto-generate"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                                    value={formData.batch_number}
                                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Display Name</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-3.5 text-slate-300" size={16} />
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Batch A"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Breed Variant</label>
                        <div className="relative">
                            <Bird className="absolute left-4 top-3.5 text-slate-300" size={16} />
                            <select
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                value={formData.breed}
                                onChange={(e) => setFormData({...formData, breed: e.target.value})}
                            >
                                <option value="Cobb 500">Cobb 500</option>
                                <option value="Ross 308">Ross 308</option>
                                <option value="Hubbard">Hubbard</option>
                                <option value="Mixed/Local">Mixed / Local</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Initial Count</label>
                            <input
                                required
                                type="number"
                                placeholder="0"
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.quantity_received}
                                onChange={(e) => setFormData({...formData, quantity_received: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Date Received</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-3.5 text-slate-300" size={16} />
                                <input
                                    required
                                    type="date"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.date_received}
                                    onChange={(e) => setFormData({...formData, date_received: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className={`w-full py-4 mt-4 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
                            loading || success ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-blue-600'
                        }`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Commit to Registry</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}