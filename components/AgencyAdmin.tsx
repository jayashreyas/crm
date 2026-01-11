
import React, { useState } from 'react';
import { User, Activity, Agency, UserRole } from '../types';
import { UserPlus, Shield, UserX, Clock, Search, MoreHorizontal, X, Trash2, Edit2, Check } from 'lucide-react';

interface AgencyAdminProps {
  agency: Agency;
  users: User[];
  activities: Activity[];
  onAddUser?: (user: User) => void;
  onDeleteUser?: (id: string) => void;
}

export const AgencyAdmin: React.FC<AgencyAdminProps> = ({ agency, users, activities, onAddUser, onDeleteUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'agent' as UserRole });

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const auditLogs = activities.filter(a => a.type === 'audit' || a.action.includes('status'));

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddUser) return;

    // Simple ID gen for now, Supabase usually handles this but we need optimistic UI or proper flow
    const user: User = {
      id: `u-${Date.now()}`,
      agencyId: agency.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Active',
      aiUsage: 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=random`
    };
    onAddUser(user);
    setIsAddModalOpen(false);
    setNewUser({ name: '', email: '', role: 'agent' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Team Management</h2>
          <p className="text-slate-500 font-medium">Controlling workspace access and audit trails for {agency.name}.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
          <UserPlus className="w-5 h-5" /> Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Team Members ({users.length})</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter team..."
                  className="bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" alt="" />
                          <div>
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          {u.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to remove this user?')) {
                              onDeleteUser?.(u.id);
                            }
                          }}
                          className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-300 transition-colors"
                          title="Remove User"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Audit Logs
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {auditLogs.length === 0 && <p className="text-slate-500 text-sm">No critical logs detected.</p>}
              {auditLogs.map(log => (
                <div key={log.id} className="border-l-2 border-indigo-500/30 pl-4 py-1">
                  <p className="text-xs text-slate-300">
                    <span className="font-black text-indigo-400">{users.find(u => u.id === log.userId)?.name || 'Unknown'}</span> {log.action}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
                    {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Workspace Tier</h3>
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">{agency.plan} Plan</p>
                <p className="text-xs text-indigo-700 mt-1 font-medium">Billed annually</p>
              </div>
              <button className="text-xs font-black text-indigo-600 hover:underline">Upgrade</button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD MEMBER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-900">Invite Team Member</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Name</label>
                <input
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Sarah Agent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <input
                  required
                  type="email"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="sarah@agency.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Role</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                  <option value="team_member">Team Member</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all mt-4">
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
