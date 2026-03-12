import { useState, useContext } from "react";
import { UserContext } from "../UserContext";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";

export default function ProfileSettings() {
  const { user } = useContext(UserContext);
  const [passwords, setPasswords] = useState({ old_password: "", new_password: "", confirm: "" });
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      return setStatusMsg({ type: "error", text: "New passwords do not match." });
    }

    setLoading(true);
    try {
      await api.post("accounts/change-password/", {
        old_password: passwords.old_password,
        new_password: passwords.new_password
      });
      setStatusMsg({ type: "success", text: "Password updated successfully!" });
      setPasswords({ old_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setStatusMsg({ type: "error", text: err.response?.data?.error || "Update failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase mb-8">
          User <span className="text-blue-600">Profile</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Current User</p>
            <p className="text-xl font-black text-slate-800 uppercase">{user?.username}</p>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{user?.role} Access</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Assigned Farm</p>
            <p className="text-xl font-black text-slate-800 uppercase">{user?.farm?.name || "Independent"}</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Security Update</h3>
          
          {statusMsg.text && (
            <div className={`mb-6 p-4 rounded-2xl text-xs font-bold uppercase text-center ${
              statusMsg.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}>
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Current Password</label>
              <input 
                type="password" 
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
                value={passwords.old_password}
                onChange={(e) => setPasswords({...passwords, old_password: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4">New Password</label>
                <input 
                  type="password" 
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Confirm New</label>
                <input 
                  type="password" 
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  required
                />
              </div>
            </div>
            <button 
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all"
            >
              {loading ? "SAVING..." : "UPDATE SECURITY KEY"}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}