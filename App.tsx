
import React, { useState, useEffect, useCallback } from 'react';
import { User, Agency, AppView, Contact, Listing, Task, Offer, Thread, Activity, Notification, ListingStatus, OfferStatus } from './types';
import { APP_NAME, MOCK_USERS, MOCK_AGENCIES, NAV_ITEMS } from './constants';
import { db } from './services/db.service';
import { Dashboard } from './components/Dashboard';
import { Pipeline } from './components/Pipeline';
import { Offers } from './components/Offers';
import { Messaging } from './components/Messaging';
import { AgencyAdmin } from './components/AgencyAdmin';
import { CSVImportModal } from './components/CSVImportModal';
import { 
  LogOut, 
  Search, 
  Plus, 
  ChevronRight,
  Menu,
  X,
  Clock,
  CheckCircle2,
  Circle,
  Home,
  Bell,
  Building2,
  Check
} from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('ep_current_user');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      setCurrentAgency(MOCK_AGENCIES.find(a => a.id === user.agencyId) || null);
    }
  }, []);

  const loadData = useCallback((user: User) => {
    setContacts(db.getContacts(user.agencyId, user.role, user.id));
    setListings(db.getListings(user.agencyId, user.role, user.id));
    setTasks(db.getTasks(user.agencyId, user.role, user.id));
    setOffers(db.getOffers(user.agencyId, user.role, user.id));
    setThreads(db.getThreads(user.agencyId));
    setActivities(db.getActivity(user.agencyId));
    setNotifs(db.getNotifications(user.agencyId, user.id));
  }, []);

  const login = (u: User) => {
    setCurrentUser(u);
    setCurrentAgency(MOCK_AGENCIES.find(a => a.id === u.agencyId) || null);
    localStorage.setItem('ep_current_user', JSON.stringify(u));
    db.seed(MOCK_USERS);
    loadData(u);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentAgency(null);
    localStorage.removeItem('ep_current_user');
  };

  useEffect(() => {
    if (currentUser) loadData(currentUser);
  }, [currentUser, loadData]);

  // Handlers
  const handleMoveListing = (id: string, status: ListingStatus) => {
    if (!currentUser) return;
    db.updateListingStatus(id, currentUser.agencyId, status, currentUser.id);
    loadData(currentUser);
  };

  const handleUpdateOffer = (id: string, status: OfferStatus) => {
    if (!currentUser) return;
    const allOffers = db.getOffers(currentUser.agencyId, 'admin', '');
    const offer = allOffers.find(o => o.id === id);
    if (offer) {
      offer.status = status;
      db.saveOffer(offer, currentUser.id);
      db.logActivity(currentUser.agencyId, currentUser.id, `updated offer for ${offer.buyerName} to`, status);
      loadData(currentUser);
    }
  };

  if (!currentUser || !currentAgency) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-white/20 animate-in zoom-in-95 duration-700">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-indigo-600 p-5 rounded-[1.5rem] mb-6 shadow-2xl shadow-indigo-200">
              <Building2 className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">EstatePulse <span className="text-indigo-600 italic">SaaS</span></h1>
            <p className="text-slate-400 mt-3 font-bold uppercase tracking-widest text-[10px]">Select Your Agency Workspace</p>
          </div>
          
          <div className="space-y-4">
            {MOCK_AGENCIES.map(agency => (
              <div key={agency.id} className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{agency.name} ({agency.plan})</p>
                <div className="space-y-2">
                  {MOCK_USERS.filter(u => u.agencyId === agency.id).map(u => (
                    <button
                      key={u.id}
                      onClick={() => login(u)}
                      className="w-full flex items-center gap-4 p-4 bg-slate-50 border border-transparent rounded-2xl hover:border-indigo-400 hover:bg-white transition-all text-left group shadow-sm"
                    >
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" />
                      <div>
                        <p className="font-black text-slate-800 group-hover:text-indigo-700">{u.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{u.role}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 ml-auto text-slate-200 group-hover:text-indigo-400" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-white border-r flex flex-col transition-all duration-500 ease-in-out relative z-30 shadow-2xl shadow-slate-100`}
      >
        <div className="p-10 flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shrink-0 shadow-xl shadow-indigo-100">
            <Building2 className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && <span className="font-black text-2xl text-slate-800 tracking-tighter truncate">{APP_NAME}</span>}
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(currentUser.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black transition-all group ${
                currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${currentView === item.id ? 'text-white' : 'group-hover:text-indigo-500'}`} />
              {isSidebarOpen && <span className="text-sm tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t mt-auto">
          <div className={`mb-6 flex items-center gap-4 ${isSidebarOpen ? 'px-2' : 'justify-center'}`}>
            <div className="relative shrink-0">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-2xl border-2 border-slate-100 shadow-xl" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white"></div>
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{currentAgency.name}</p>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-300 hover:bg-red-50 hover:text-red-600 transition-all font-black`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-24 bg-white/60 backdrop-blur-xl border-b px-10 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-8 flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-3 hover:bg-slate-100 rounded-2xl">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-xl hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input 
                type="text" 
                placeholder={`Search ${currentAgency.name}...`} 
                className="w-full bg-slate-100/50 border-none focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agency Region</p>
              <p className="text-sm font-black text-slate-800">North America East</p>
            </div>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
            >
              <Bell className="w-6 h-6" />
              {notifs.some(n => !n.read) && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 rounded-full border-4 border-white flex items-center justify-center text-[8px] text-white font-black">
                  {notifs.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Notif Drawer */}
        {isNotifOpen && (
          <div className="absolute top-24 right-10 w-96 max-h-[70vh] bg-white rounded-3xl border shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-800">Agency Alerts</h3>
              <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {notifs.length === 0 && <p className="text-center text-slate-400 py-10 font-bold uppercase text-[10px]">No new alerts</p>}
              {notifs.map(n => (
                <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-black text-slate-800 text-sm">{n.title}</p>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
            <button className="p-4 text-center text-[10px] font-black text-indigo-600 uppercase tracking-widest border-t hover:bg-slate-50">Clear All Alerts</button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {currentView === 'dashboard' && (
            <Dashboard 
              contacts={contacts} 
              listings={listings} 
              tasks={tasks} 
              offers={offers}
              activities={activities}
              user={currentUser}
              users={MOCK_USERS.filter(u => u.agencyId === currentAgency.id)}
            />
          )}

          {currentView === 'admin' && (
            <AgencyAdmin 
              agency={currentAgency}
              users={MOCK_USERS.filter(u => u.agencyId === currentAgency.id)}
              activities={activities}
            />
          )}

          {currentView === 'contacts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Contacts Registry</h2>
                <div className="flex items-center gap-2">
                  <button className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all text-sm"><Plus className="w-4 h-4" /> New Contact</button>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags</th>
                      <th className="px-8 py-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-black text-slate-800">{contact.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{contact.email}</p>
                        </td>
                        <td className="px-8 py-6">
                          <img 
                            src={MOCK_USERS.find(u => u.id === contact.assignedTo)?.avatar} 
                            className="w-8 h-8 rounded-full border shadow-sm" 
                            alt=""
                          />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2">
                            {contact.tags.map(tag => (
                              <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-full border border-slate-200/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-300 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'pipeline' && (
            <Pipeline 
              listings={listings} 
              users={MOCK_USERS.filter(u => u.agencyId === currentAgency.id)} 
              onMove={handleMoveListing} 
            />
          )}

          {currentView === 'offers' && (
            <Offers 
              offers={offers} 
              listings={listings} 
              users={MOCK_USERS.filter(u => u.agencyId === currentAgency.id)} 
              onUpdateStatus={handleUpdateOffer}
              onImport={() => setIsImportModalOpen(true)}
            />
          )}

          {currentView === 'messaging' && (
            <Messaging 
              threads={threads} 
              users={MOCK_USERS.filter(u => u.agencyId === currentAgency.id)} 
              currentUser={currentUser} 
              onSendMessage={(tid, txt) => {
                const thread = threads.find(t => t.id === tid);
                if (thread) {
                  thread.messages.push({ id: `msg-${Date.now()}`, senderId: currentUser.id, text: txt, timestamp: new Date().toISOString() });
                  db.saveThread(thread);
                  loadData(currentUser);
                }
              }}
            />
          )}

          {currentView === 'tasks' && (
            <div className="max-w-4xl mx-auto space-y-10 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Agency Ops</h2>
                <button className="p-4 bg-indigo-600 text-white rounded-3xl shadow-2xl shadow-indigo-100"><Plus className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-6 p-8 rounded-[2.5rem] border-2 transition-all ${task.status === 'Done' ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-white shadow-xl hover:scale-[1.01]'}`}>
                    <button 
                      onClick={() => { db.toggleTaskStatus(task.id, currentUser.agencyId); loadData(currentUser); }}
                      className={`shrink-0 transition-all ${task.status === 'Done' ? 'text-indigo-500' : 'text-slate-200 hover:text-indigo-400'}`}
                    >
                      {task.status === 'Done' ? <CheckCircle2 className="w-10 h-10" /> : <Circle className="w-10 h-10" />}
                    </button>
                    <div className="flex-1">
                      <p className={`font-black text-xl text-slate-800 ${task.status === 'Done' ? 'line-through' : ''}`}>{task.title}</p>
                      <div className="flex items-center gap-6 mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                         <Clock className="w-4 h-4" /> {new Date(task.dueDate).toLocaleDateString()} • {MOCK_USERS.find(u => u.id === task.assignedTo)?.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="max-w-2xl mx-auto py-10">
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-10">Agency Settings</h2>
              <div className="bg-white rounded-[3rem] p-12 border shadow-sm space-y-12">
                <div className="flex items-center gap-8">
                  <img src={currentAgency.logo} className="w-24 h-24 rounded-[2rem] border-8 border-slate-50 shadow-2xl" alt="" />
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{currentAgency.name}</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Tier: {currentAgency.plan} Workspace</p>
                  </div>
                </div>
                <div className="pt-10 border-t space-y-8">
                   <div className="flex items-center justify-between">
                      <p className="font-black text-slate-800 uppercase tracking-tighter">API Audit Log</p>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full border border-emerald-100">Enabled</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <p className="font-black text-slate-800 uppercase tracking-tighter">Secure File Encryption</p>
                      <div className="w-12 h-6 bg-indigo-600 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <CSVImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Agent Data"
        expectedHeaders={['Name', 'Email', 'Phone']}
        onImport={(data) => {
          data.forEach(item => db.saveContact({
            id: `saas-${Date.now()}-${Math.random()}`,
            agencyId: currentUser.agencyId,
            name: item.name || 'SaaS Lead',
            email: item.email || '',
            phone: item.phone || '',
            tags: ['Imported'],
            notes: '',
            assignedTo: currentUser.id,
            createdAt: new Date().toISOString()
          }));
          loadData(currentUser);
        }}
      />
    </div>
  );
};

export default App;
