import { useState, useContext } from 'react';
import { UserContext } from '../UserContext';
import MainLayout from '../layouts/MainLayout';
import api from '../api/axios';

// ==========================================
// REUSABLE UI SUB-COMPONENTS & STYLES
// ==========================================
const inputStyles =
  'w-full px-4 py-3 rounded-xl bg-[#0d121f] border border-slate-800/80 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-inner disabled:opacity-50';
const labelStyles = 'block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2';

function InlineAlert({ type, text }) {
  if (!text) return null;
  const isSuccess = type === 'success';
  return (
    <div
      className={`mb-6 p-4 rounded-lg text-sm font-medium border ${
        isSuccess
          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
          : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
      }`}
    >
      {text}
    </div>
  );
}

function PermissionBadge({ label, enabled }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
        enabled
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-slate-800/50 text-slate-500 border border-slate-800'
      }`}
    >
      {label} {enabled ? '✓' : '×'}
    </span>
  );
}

export default function ProfileSettings() {
  const { user } = useContext(UserContext);

  const farms = JSON.parse(localStorage.getItem('farms')) || [];
  const activeFarm = localStorage.getItem('active_farm');

  const membership = farms.find((f) => String(f.id) === String(activeFarm));

  // Strictly restrict employee account configuration tools to the Farm Owner
  const isOwner = membership?.role === 'owner';

  // Password Management States
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    confirm: '',
  });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Staff Management States
  const [staff, setStaff] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff',
  });
  const [staffStatusMsg, setStaffStatusMsg] = useState({ type: '', text: '' });
  const [staffLoading, setStaffLoading] = useState(false);

  // Ephemeral In-Memory Onboarding Summary
  const [createdSummary, setCreatedSummary] = useState(null);

  // ==========================================
  // HANDLERS
  // ==========================================
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setStaff({
      ...staff,
      password: pwd,
    });
  };

  const copyCredentials = async () => {
    if (!createdSummary) return;

    const text = `
Username: ${createdSummary.username}
Password: ${createdSummary.password}
Login URL: /login
`.trim();

    try {
      await navigator.clipboard.writeText(text);

      setStaffStatusMsg({
        type: 'success',
        text: 'Credentials copied.',
      });
    } catch {
      setStaffStatusMsg({
        type: 'error',
        text: 'Unable to copy credentials.',
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (passwords.new_password.length < 8) {
      return setStatusMsg({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
    }

    if (passwords.new_password !== passwords.confirm) {
      return setStatusMsg({
        type: 'error',
        text: 'New passwords do not match.',
      });
    }

    try {
      setLoading(true);
      await api.post('/api/my-farm/accounts/change-password/', {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      });

      setPasswords({ old_password: '', new_password: '', confirm: '' });
      setStatusMsg({ type: 'success', text: 'Password updated successfully.' });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.error || 'Update failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (e) => {
    e.preventDefault();

    setStaffLoading(true);
    setStaffStatusMsg({
      type: '',
      text: '',
    });

    setCreatedSummary(null);

    try {
      const tempPassword = staff.password;

      const response = await api.post('/api/my-farm/accounts/staff-create/', staff);

      const createdUser = response.data?.user;

      setCreatedSummary({
        username: createdUser?.username,
        email: staff.email,
        role: createdUser?.role,
        farm: createdUser?.farm,
        password: tempPassword,
      });

      setStaffStatusMsg({
        type: 'success',
        text: 'Employee created successfully.',
      });

      setStaff({
        username: '',
        email: '',
        password: '',
        role: 'staff',
      });
    } catch (err) {
      setStaffStatusMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to create employee.',
      });
    } finally {
      setStaffLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="border-b border-slate-800 pb-6 mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-400">
              Account <span className="text-[#6366f1] font-bold">Settings</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage your personal credentials and team permissions.
            </p>
          </div>

          {/* Access Control Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#111726]/60 border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                CURRENT USER
              </p>
              <div className="flex items-center gap-2 mt-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <p className="text-lg font-medium text-slate-200 truncate">
                  {user?.username || 'User'}
                </p>
              </div>
            </div>

            <div className="bg-[#111726]/60 border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ACTIVE ORGANIZATION
              </p>
              <div className="flex items-center gap-2 mt-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
                </svg>
                <p className="text-lg font-medium text-slate-200 truncate">
                  {membership?.name || 'No active farm'}
                </p>
              </div>
            </div>

            <div className="bg-[#111726]/60 border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ACCESS LEVEL
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <PermissionBadge label="Inventory" enabled={!!membership?.permissions?.inventory} />
                <PermissionBadge label="Finance" enabled={!!membership?.permissions?.finance} />
                <PermissionBadge label="Sales" enabled={!!membership?.permissions?.sales} />
                <PermissionBadge label="Staff" enabled={!!membership?.permissions?.staff} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* PASSWORD UPDATE SECTION */}
            <section className="bg-[#111726]/40 border border-slate-800/80 rounded-xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-800/60 bg-[#141b2d]/40 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <div>
                  <h3 className="text-md font-semibold text-slate-200">Security Update</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ensure your account is using a secure password.
                  </p>
                </div>
              </div>

              <div className="p-6">
                <InlineAlert type={statusMsg.type} text={statusMsg.text} />

                <form onSubmit={handlePasswordChange} className="space-y-5 max-w-2xl">
                  <div>
                    <label className={labelStyles}>Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={passwords.old_password}
                      disabled={loading}
                      onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                      className={inputStyles}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelStyles}>New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password (min 8 chars)"
                      value={passwords.new_password}
                      disabled={loading}
                      onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                      className={inputStyles}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelStyles}>Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwords.confirm}
                      disabled={loading}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className={inputStyles}
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2.5 bg-[#141b2d] hover:bg-[#1c263f] text-slate-200 border border-slate-700/60 font-medium text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {loading ? 'Saving...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* STAFF MANAGEMENT SECTION WITH CONDITIONAL OWNER GATEWAY */}
            {isOwner ? (
              <section className="bg-[#111726]/40 border border-slate-800/80 rounded-xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-800/60 bg-[#141b2d]/40 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-md font-semibold text-slate-200">
                      Owner Terminal: Create Employee Account
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Register farm personnel and assign functional system roles.
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <InlineAlert type={staffStatusMsg.type} text={staffStatusMsg.text} />

                  {/* FIXED ONBOARDING CARD CONTAINER */}
                  {createdSummary && (
                    <div className="mb-6 rounded-xl border border-blue-900/40 bg-blue-950/20 p-5">
                      <div className="flex justify-between items-center mb-5">
                        <div>
                          <h4 className="text-blue-400 font-bold">Employee Created</h4>

                          <p className="text-xs text-slate-400">Save these credentials now.</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={copyCredentials}
                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreatedSummary(null)}
                            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700/40"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-slate-500 block">Username</span>

                            <div className="font-mono text-white">{createdSummary.username}</div>
                          </div>

                          <div>
                            <span className="text-xs text-slate-500 block">Email</span>

                            <div className="text-slate-200">{createdSummary.email}</div>
                          </div>

                          <div>
                            <span className="text-xs text-slate-500 block">Assigned Role</span>

                            <div className="capitalize text-slate-200">{createdSummary.role}</div>
                          </div>

                          <div>
                            <span className="text-xs text-slate-500 block">Farm Node</span>

                            <div className="text-slate-200">{createdSummary.farm}</div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
                          <div className="text-xs text-amber-400 uppercase font-bold tracking-wide">
                            Temporary Password
                          </div>

                          <div className="mt-2 font-mono text-lg text-amber-300 font-bold tracking-wider">
                            {createdSummary.password}
                          </div>

                          <div className="mt-5 text-xs text-slate-400">Login route:</div>

                          <div className="font-mono text-blue-300">/login</div>

                          <div className="mt-4 text-[11px] text-slate-500 italic">
                            Employee should change password immediately after first login.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={createEmployee} className="space-y-5 max-w-2xl">
                    <div>
                      <label className={labelStyles}>Username</label>
                      <input
                        type="text"
                        placeholder="johndoe"
                        value={staff.username}
                        disabled={staffLoading}
                        onChange={(e) => setStaff({ ...staff, username: e.target.value })}
                        className={inputStyles}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelStyles}>Email Address</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={staff.email}
                        disabled={staffLoading}
                        onChange={(e) => setStaff({ ...staff, email: e.target.value })}
                        className={inputStyles}
                        required
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Temporary Password
                        </label>
                        <button
                          type="button"
                          onClick={generatePassword}
                          disabled={staffLoading}
                          className="text-blue-400 hover:text-blue-300 text-xs focus:outline-none disabled:opacity-50"
                        >
                          Generate Secure Password
                        </button>
                      </div>
                      <input
                        type="password"
                        placeholder="Enter or generate temporary password"
                        value={staff.password}
                        disabled={staffLoading}
                        onChange={(e) => setStaff({ ...staff, password: e.target.value })}
                        className={inputStyles}
                        required
                      />
                    </div>

                    <div>
                      <label className={labelStyles}>System Role Assignment</label>
                      <div className="relative">
                        <select
                          value={staff.role}
                          disabled={staffLoading}
                          onChange={(e) => setStaff({ ...staff, role: e.target.value })}
                          className={`${inputStyles} cursor-pointer appearance-none pr-10`}
                        >
                          <option value="staff">Staff Member</option>
                          <option value="manager">Manager</option>
                          <option value="finance">Finance Specialist</option>
                          <option value="viewer">Viewer (Read Only)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1.5 italic">
                        The role assigned here determines which modules (Inventory, Finance, Sales,
                        or Staff) this individual is permitted to manage and interact with inside
                        the organization.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={staffLoading}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        {staffLoading ? 'Creating Employee...' : 'Create Employee Account'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            ) : (
              <div className="p-6 rounded-xl text-sm font-medium border bg-slate-900/20 text-slate-400 border-slate-800/60 text-center">
                Only the designated Farm Owner has the authority to create employee accounts and
                manage organizational roles.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
