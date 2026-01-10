
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Users, Home, CheckSquare, TrendingUp, DollarSign, Clock, Activity as ActivityIcon, Award } from 'lucide-react';
import { Contact, Listing, Task, User, Offer, Activity } from '../types';

interface DashboardProps {
  contacts: Contact[];
  listings: Listing[];
  tasks: Task[];
  offers: Offer[];
  activities: Activity[];
  user: User;
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ contacts, listings, tasks, offers, activities, user, users }) => {
  const activeListings = listings.filter(l => l.status === 'Active').length;
  const closedListings = listings.filter(l => l.status === 'Sold').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
  const totalVolume = listings.filter(l => l.status === 'Sold').reduce((acc, curr) => acc + curr.price, 0);

  // SaaS Analytics: Leaderboard
  const agentPerformance = users
    .filter(u => u.role === 'agent')
    .map(agent => {
      const closed = listings.filter(l => l.assignedAgent === agent.id && l.status === 'Sold').length;
      const totalVal = listings.filter(l => l.assignedAgent === agent.id && l.status === 'Sold').reduce((a, b) => a + b.price, 0);
      return { name: agent.name, avatar: agent.avatar, closed, totalVal };
    })
    .sort((a, b) => b.totalVal - a.totalVal);

  const stats = [
    { label: 'Active Pipeline', value: activeListings, icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Tasks To Do', value: pendingTasks, icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Total Contacts', value: contacts.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Sales Volume', value: `$${(totalVolume / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  const listingStatusData = [
    { name: 'New', value: listings.filter(l => l.status === 'New').length },
    { name: 'Active', value: listings.filter(l => l.status === 'Active').length },
    { name: 'UC', value: listings.filter(l => l.status === 'Under Contract').length },
    { name: 'Sold', value: listings.filter(l => l.status === 'Sold').length },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Agency Pulse</h2>
          <p className="text-slate-500 font-medium">Overview for <span className="text-indigo-600 font-bold">{user.name}</span> • Agent ID: #{user.id.toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 bg-white px-5 py-2.5 rounded-2xl border shadow-sm">
          <Clock className="w-4 h-4 text-indigo-500" />
          Live: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-2xl`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black text-slate-400 tracking-tighter uppercase">Goal: 100%</div>
            </div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
            <h3 className="font-black text-xl text-slate-800 mb-8 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              Deal Distribution
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={listingStatusData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                Agent Leaderboard
              </h3>
              <div className="space-y-4">
                {agentPerformance.map((agent, i) => (
                  <div key={agent.name} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all">
                    <span className={`text-lg font-black w-6 ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>#{i + 1}</span>
                    <img src={agent.avatar} className="w-10 h-10 rounded-xl border border-white/20" alt="" />
                    <div className="flex-1">
                      <p className="font-black text-sm">{agent.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{agent.closed} Closed Deals</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-indigo-400 text-sm">${(agent.totalVal / 1000).toFixed(0)}k</p>
                      <p className="text-[9px] text-slate-600 font-bold uppercase">Volume</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border shadow-sm flex flex-col h-[650px]">
            <div className="p-6 border-b flex items-center justify-between shrink-0">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                <ActivityIcon className="w-5 h-5 text-indigo-600" />
                Live Ops
              </h3>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {activities.length === 0 && <p className="text-center text-slate-400 py-10">No agency events yet.</p>}
              {activities.map((act) => {
                const actor = users.find(u => u.id === act.userId);
                return (
                  <div key={act.id} className="relative pl-6 border-l border-slate-100 pb-2">
                    <div className="absolute left-[-5px] top-1 w-2 h-2 bg-indigo-400 rounded-full shadow-lg"></div>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-700 leading-snug">
                          <span className="font-black text-slate-900">{actor?.name}</span> {act.action}
                        </p>
                        <p className="text-xs font-bold text-indigo-600 mt-0.5 truncate">{act.target}</p>
                        <p className="text-[9px] text-slate-300 mt-1 uppercase font-black tracking-widest">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
