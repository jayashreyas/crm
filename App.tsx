
import React, { useState, useEffect, useCallback } from 'react';
import { User, Agency, AppView, Contact, Listing, Task, Offer, Thread, Activity, Notification, ListingStatus, OfferStatus, Message } from './types';
import { APP_NAME, MOCK_USERS, MOCK_AGENCIES, NAV_ITEMS } from './constants';
import { db } from './services/db.service';
import { AIService } from './services/ai.service';
import { Dashboard } from './components/Dashboard';
import { Pipeline } from './components/Pipeline';
import { Offers } from './components/Offers';
import { Messaging } from './components/Messaging';
import { AgencyAdmin } from './components/AgencyAdmin';
import { Tasks } from './components/Tasks';
import { Contacts } from './components/Contacts';
import { CSVImportModal } from './components/CSVImportModal';
import {
  LogOut,
  Search,
  ChevronRight,
  Menu,
  Bell,
  Building2,
  Plus,
  Phone,
  Mail,
  User as UserIcon,
  Users,
  Database,
  X,
  MapPin,
  Tag,
  Star,
  MoreVertical,
  Contact as ContactIcon,
  Smartphone,
  Info,
  Edit2,
  Trash2,
  ExternalLink,
  Printer,
  Download,
  Save,
  Home,
  DollarSign,
  HandCoins,
  Calendar,
  Globe,
  FileText,
  ShieldCheck,
  Zap,
  CheckSquare,
  UserPlus,
  StickyNote
} from 'lucide-react';

type ImportType = 'contacts' | 'listings' | 'offers' | 'tasks';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateContactModalOpen, setIsCreateContactModalOpen] = useState(false);
  const [isCreateListingModalOpen, setIsCreateListingModalOpen] = useState(false);
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [importType, setImportType] = useState<ImportType>('contacts');

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Form States
  const [newContact, setNewContact] = useState({
    name: '', email: '', phone: '', tags: '', notes: ''
  });

  const [newTask, setNewTask] = useState({
    title: '', assignedTo: '', dueDate: new Date().toISOString().split('T')[0], priority: 'Medium' as any
  });

  const [newListing, setNewListing] = useState({
    address: '', sellerName: '', price: '', assignedAgent: ''
  });

  const [newOffer, setNewOffer] = useState({
    isExternal: true,
    externalAddress: '',
    listingId: '',
    buyerName: '',
    price: '',
    downPayment: '',
    earnestMoney: '',
    financing: 'Conventional' as any,
    inspectionPeriod: '10',
    contingencies: ['Inspection', 'Appraisal', 'Financing'],
    closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);

  // ... (existing state)

  const loadData = useCallback(async (user: User) => {
    setLoading(true);
    try {
      const contactsData = await db.getContacts(user.agencyId, user.role, user.id);
      setContacts(contactsData);

      const listingsData = await db.getListings(user.agencyId, user.role, user.id);
      setListings(listingsData);

      const tasksData = await db.getTasks(user.agencyId, user.role, user.id);
      setTasks(tasksData);

      const offersData = await db.getOffers(user.agencyId, user.role, user.id);
      setOffers(offersData);

      const threadsData = await db.getThreads(user.agencyId);
      setThreads(threadsData);

      const usersData = await db.getUsers(user.agencyId);
      // If no users found (first load), seed with current user/mocks if needed, or just set empty?
      // Better to ensure we at least have the current user in the list
      if (usersData.length === 0 && currentUser) {
        // This might be a fresh migration, let's auto-save the current user to the DB ?
        // Or just wait for manual addition. For now, assume fetched list.
      }
      // Merge current user if missing (safety net for auth/db sync) or just trust DB.
      // We will trust the DB, but ensure we fallback to MOCK if empty for demo purposes? NO, user wants real control.
      setUsers(usersData.length > 0 ? usersData : [user]);

      const activityData = await db.getActivity(user.agencyId);
      setActivities(activityData);

      const notifsData = await db.getNotifications(user.agencyId, user.id);
      setNotifs(notifsData);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
    const agenciesStr = localStorage.getItem('ep_agencies');
    const agencies = agenciesStr ? JSON.parse(agenciesStr) : MOCK_AGENCIES;
    setCurrentAgency(agencies.find((a: any) => a.id === user.agencyId) || null);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('ep_current_user');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      loadData(user);
    }
  }, [loadData]);

  const login = (u: User) => {
    setCurrentUser(u);
    localStorage.setItem('ep_current_user', JSON.stringify(u));
    localStorage.setItem('ep_current_user', JSON.stringify(u));
    loadData(u);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentAgency(null);
    localStorage.removeItem('ep_current_user');
  };

  const handleSaveManualContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newContact.name) return;

    const contact: Contact = {
      id: crypto.randomUUID(),
      agencyId: currentUser.agencyId,
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      tags: newContact.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      notes: newContact.notes,
      assignedTo: currentUser.id,
      createdAt: new Date().toISOString(),
      metadata: {}
    };

    await db.saveContact(contact);
    await db.logActivity(currentUser.agencyId, currentUser.id, 'captured new lead:', contact.name);
    setIsCreateContactModalOpen(false);
    setNewContact({ name: '', email: '', phone: '', tags: '', notes: '' });
    loadData(currentUser);
  };

  const handleSaveManualListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newListing.address) return;

    const listing: Listing = {
      id: crypto.randomUUID(),
      agencyId: currentUser.agencyId,
      address: newListing.address,
      sellerName: newListing.sellerName,
      price: parseFloat(newListing.price.replace(/[^0-9.]/g, '')) || 0,
      assignedAgent: newListing.assignedAgent || currentUser.id,
      status: 'New',
      createdAt: new Date().toISOString(),
      notes: '',
      metadata: {}
    };

    await db.saveListing(listing);
    await db.logActivity(currentUser.agencyId, currentUser.id, 'added new property to pipeline', listing.address);
    setIsCreateListingModalOpen(false);
    setNewListing({ address: '', sellerName: '', price: '', assignedAgent: '' });
    loadData(currentUser);
  };



  const handleSaveManualTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTask.title) return;

    const task: Task = {
      id: crypto.randomUUID(),
      agencyId: currentUser.agencyId,
      title: newTask.title,
      assignedTo: newTask.assignedTo || currentUser.id,
      dueDate: newTask.dueDate,
      priority: newTask.priority,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    await db.saveTask(task);
    await db.logActivity(currentUser.agencyId, currentUser.id, 'scheduled a new task:', task.title);
    setIsCreateTaskModalOpen(false);
    setNewTask({ title: '', assignedTo: '', dueDate: new Date().toISOString().split('T')[0], priority: 'Medium' as any });
    loadData(currentUser);
  };

  const handleSaveManualOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newOffer.buyerName) return;

    let finalListingId = newOffer.listingId;

    if (newOffer.isExternal && newOffer.externalAddress) {
      const shellListing: Listing = {
        id: crypto.randomUUID(),
        agencyId: currentUser.agencyId,
        address: newOffer.externalAddress,
        sellerName: 'Listing Agent / Seller Side',
        price: parseFloat(String(newOffer.price).replace(/[^0-9.]/g, '')) || 0,
        assignedAgent: currentUser.id,
        status: 'Active',
        createdAt: new Date().toISOString(),
        notes: 'Target asset for Buyer Representation.',
        metadata: {}
      };
      await db.saveListing(shellListing);
      finalListingId = shellListing.id;
    }

    if (!finalListingId) {
      alert("Property identification is required for offer preparation.");
      return;
    }

    const offer: Offer = {
      id: crypto.randomUUID(),
      agencyId: currentUser.agencyId,
      listingId: finalListingId,
      buyerName: newOffer.buyerName,
      price: parseFloat(String(newOffer.price).replace(/[^0-9.]/g, '')) || 0,
      downPayment: parseFloat(String(newOffer.downPayment).replace(/[^0-9.]/g, '')) || 0,
      earnestMoney: parseFloat(String(newOffer.earnestMoney).replace(/[^0-9.]/g, '')) || 0,
      financing: newOffer.financing,
      inspectionPeriod: parseInt(newOffer.inspectionPeriod) || 0,
      contingencies: newOffer.contingencies,
      closingDate: new Date(newOffer.closingDate).toISOString(),
      status: 'Draft',
      assignedTo: currentUser.id,
      createdAt: new Date().toISOString()
    };

    await db.saveOffer(offer, currentUser.id);
    await db.logActivity(currentUser.agencyId, currentUser.id, 'finalized offer sheet for buyer', offer.buyerName);
    setIsCreateOfferModalOpen(false);

    setNewOffer({
      isExternal: true,
      externalAddress: '',
      listingId: '',
      buyerName: '',
      price: '',
      downPayment: '',
      earnestMoney: '',
      financing: 'Conventional',
      inspectionPeriod: '10',
      contingencies: ['Inspection', 'Appraisal', 'Financing'],
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    loadData(currentUser);
  };

  const toggleContingency = (c: string) => {
    setNewOffer(prev => ({
      ...prev,
      contingencies: prev.contingencies.includes(c)
        ? prev.contingencies.filter(item => item !== c)
        : [...prev.contingencies, c]
    }));
  };

  const handleMoveListing = (id: string, status: ListingStatus) => {
    if (!currentUser) return;
    db.updateListingStatus(id, currentUser.agencyId, status, currentUser.id);
    loadData(currentUser);
  };

  const handleUpdateOffer = async (id: string, status: OfferStatus) => {
    if (!currentUser) return;
    const allOffers = await db.getOffers(currentUser.agencyId, 'admin', '');
    const offer = allOffers.find(o => o.id === id);
    if (offer) {
      offer.status = status;
      db.saveOffer(offer, currentUser.id);
      db.logActivity(currentUser.agencyId, currentUser.id, `marked offer for ${offer.buyerName} as`, status);
      loadData(currentUser);
    }
  };

  const handleSendMessage = (threadId: string, text: string) => {
    if (!currentUser) return;
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      const newMessage: Message = { id: `m-${Date.now()}`, senderId: currentUser.id, text, timestamp: new Date().toISOString() };
      thread.messages.push(newMessage);
      db.saveThread(thread);
      loadData(currentUser);
    }
  };

  const handleOpenImport = (type: ImportType) => {
    setImportType(type);
    setIsImportModalOpen(true);
  };

  const getImportConfig = () => {
    switch (importType) {
      case 'listings':
        return {
          title: 'Properties & Pipeline',
          expectedHeaders: ['Address', 'Seller', 'Price', 'Status'],
          fieldAliases: {
            'Address': ['Property', 'Site', 'Location', 'Street', 'Property Address', 'PropertyAddressFormatted', 'Prop Address'],
            'Seller': ['Owner', 'Vendor', 'Client', 'Seller Name', 'Listing Agent', 'OwnerNames', 'OwnerLastName'],
            'Price': ['Cost', 'Value', 'List Price', 'Amount', 'Asking Price', 'SaleAmt', 'Sale Amount', 'Total Assessed'],
            'Status': ['Stage', 'State', 'Pipeline Status', 'Current Status', 'Status']
          },
          onImport: async (data: any[]) => {
            if (!currentUser) return;
            // Process individually or batch? Batch is better but upsert supports array.
            // For logic complexity (price/status deteciton), we process one by one
            const promises = data.map(item => {
              // 1. Enhanced Price Parsing
              let priceVal = 0;

              // Try explicit price fields first
              const priceStr = item.price || item.cost || item.value || item.amount || '';
              if (priceStr) {
                // Remove currency symbols, commas, spaces
                const cleaned = String(priceStr).replace(/[$,\s]/g, '').replace(/[^0-9.]/g, '');
                priceVal = parseFloat(cleaned) || 0;
              }

              // Fallback: Search all fields for number that looks like a price (5-8 digits)
              if (priceVal === 0) {
                const priceKey = Object.keys(item).find(k => {
                  const val = String(item[k]).replace(/[$,\s]/g, '');
                  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                  // Price likely between 10,000 and 99,999,999
                  return num >= 10000 && num <= 99999999;
                });
                if (priceKey) {
                  const cleaned = String(item[priceKey]).replace(/[$,\s]/g, '').replace(/[^0-9.]/g, '');
                  priceVal = parseFloat(cleaned) || 0;
                }
              }

              // 2. Enhanced Status Detection
              let rawStatus = (item.status || item.stage || item.state || '').toString().trim().toLowerCase();

              // PRIORITY CHECK: MLS/Tax Record Logic for Settle Date
              // If we have a Settle Date (and it's not a generic placeholder), this is definitely a Sold property.
              // We check this BEFORE anything else to override potentially confusing "status" fields (like "Malvern, PA")
              const settleDateVal = item.settledate || item['settle date'] || item.closedate || item['close date'] || '';
              const hasValidSettleDate = settleDateVal && settleDateVal.length > 5 && !isNaN(Date.parse(settleDateVal));

              if (hasValidSettleDate) {
                rawStatus = 'sold';
              } else {
                // Standard Logic if no Settle Date found

                // If no status field, search all fields for status keywords
                if (!rawStatus) {
                  const statusKey = Object.keys(item).find(k =>
                    k.toLowerCase().includes('status') ||
                    k.toLowerCase().includes('stage') ||
                    k.toLowerCase().includes('state')
                  );
                  if (statusKey) rawStatus = String(item[statusKey]).trim().toLowerCase();
                }

                // NUCLEAR OPTION: If header mapping failed, search EVERY CELL for status keywords
                // ONLY run this if we didn't find a standard status field 
                if (!rawStatus) {
                  const statusKeywords = ['sold', 'closed', 'settled', 'contract', 'pending', 'escrow', 'active', 'market', 'listed', 'new', 'draft'];
                  const statusKey = Object.keys(item).find(k => {
                    const val = String(item[k]).toLowerCase();
                    return statusKeywords.some(kw => val.includes(kw));
                  });

                  if (statusKey) rawStatus = String(item[statusKey]).trim().toLowerCase();
                }
              }

              // 3. Fallback Price: Search all fields for ANY number (lowered threshold to 500)
              if (priceVal === 0) {
                const priceKey = Object.keys(item).find(k => {
                  // Skip keys that we just used for status
                  if (rawStatus && String(item[k]).toLowerCase() === rawStatus) return false;
                  // Skip Zip codes
                  if (k.toLowerCase().includes('zip')) return false;

                  const val = String(item[k]).replace(/[$,\s]/g, '');
                  // Check if it's a pure number string
                  if (!/^\d+(\.\d+)?$/.test(val)) return false;

                  const num = parseFloat(val);
                  return num >= 500 && num <= 999999999;
                });
                if (priceKey) {
                  const cleaned = String(item[priceKey]).replace(/[$,\s]/g, '').replace(/[^0-9.]/g, '');
                  priceVal = parseFloat(cleaned) || 0;
                }
              }

              let finalStatus: ListingStatus = 'New';

              if (['sold', 'closed', 'settled', 'archived', 'done', 'complete'].some(k => rawStatus.includes(k))) {
                finalStatus = 'Sold';
              } else if (['contract', 'pending', 'option', 'escrow', 'offer', 'accepted'].some(k => rawStatus.includes(k))) {
                finalStatus = 'Under Contract';
              } else if (['active', 'sale', 'available', 'market', 'listed', 'open'].some(k => rawStatus.includes(k))) {
                finalStatus = 'Active';
              } else if (['new', 'draft', 'incoming', 'fresh'].some(k => rawStatus.includes(k))) {
                finalStatus = 'New';
              }

              const listing: Listing = {
                id: crypto.randomUUID(),
                agencyId: currentUser.agencyId,
                address: item.address || item.property || item.site || item.location || 'Unknown Address',
                sellerName: item.seller || item.owner || item.vendor || item.client || 'Unknown Seller',
                price: priceVal,
                assignedAgent: currentUser.id,
                status: finalStatus,
                createdAt: new Date().toISOString(),
                notes: item.notes || `Imported MLS Record. MLS#: ${item.mlsnumber || item['mls number'] || 'N/A'}`,
                metadata: item
              };
              return db.saveListing(listing);
            });
            await Promise.all(promises);
            await loadData(currentUser);
          }
        };
      case 'offers':
        return {
          title: 'Offer Negotiations',
          expectedHeaders: ['Buyer', 'Amount', 'Property'],
          onImport: (data: any[]) => {
            if (!currentUser) return;
            data.forEach(item => {
              const offer: Offer = {
                id: crypto.randomUUID(),
                agencyId: currentUser.agencyId,
                listingId: '',
                buyerName: item.buyer || 'Unknown Buyer',
                price: parseFloat(String(item.amount).replace(/[^0-9.]/g, '')) || 0,
                downPayment: 0,
                earnestMoney: 0,
                financing: 'Conventional',
                inspectionPeriod: 10,
                contingencies: ['Inspection'],
                closingDate: new Date().toISOString(),
                status: 'Draft',
                assignedTo: currentUser.id,
                createdAt: new Date().toISOString()
              };
              db.saveOffer(offer, currentUser.id);
            });
            loadData(currentUser);
          }
        };
      case 'tasks':
        return {
          title: 'Agency Productivity Tasks',
          expectedHeaders: ['Title', 'Due Date', 'Priority'],
          onImport: (data: any[]) => {
            if (!currentUser) return;
            data.forEach(item => {
              const task: Task = {
                id: crypto.randomUUID(),
                agencyId: currentUser.agencyId,
                title: item.title || 'Untitled Task',
                assignedTo: currentUser.id,
                dueDate: item['due date'] || new Date().toISOString(),
                status: 'Pending',
                priority: (item.priority as any) || 'Medium',
                createdAt: new Date().toISOString()
              };
              db.saveTask(task);
            });
            loadData(currentUser);
          }
        };
      case 'contacts':
      default:
        return {
          title: 'CRM Leads & Contacts',
          expectedHeaders: ['Name', 'Email', 'Phone'],
          // Added aliases for better matching
          fieldAliases: {
            'Name': ['Full Name', 'Contact Name', 'Lead Name', 'Client'],
            'Email': ['Email Address', 'E-mail', 'Contact Email'],
            'Phone': ['Mobile', 'Cell', 'Telephone', 'Ph', 'Contact Number', 'Phone Number']
          },
          onImport: async (data: any[]) => {
            if (!currentUser) return;

            // Use AI to parse/map the CSV data intelligently
            let processedData = data;
            try {
              // Only process first 10 rows via AI to save credits/time, then map others? 
              // For now, let's just try to process a batch or assume the map logic holds.
              // We'll pass the WHOLE data to AI if small (<20 rows), or just use simple logic if large.
              // Actually, best "demo" approach: Use AI to fix the dataset.
              if (data.length < 50) {
                processedData = await AIService.parseCSV(data, 'contact');
              }
            } catch (e) {
              console.error("AI Parse failed, falling back to manual", e);
            }

            const promises = processedData.map(async (item) => {
              // 1. Try explicit columns first (using AI mapped keys or raw)
              let phoneVal = item.phone || item.mobile || item.cell || item.number || '';

              // 2. Fallback: Search keys with "phone"
              if (!phoneVal) {
                const phoneKey = Object.keys(item).find(k =>
                  k.toLowerCase().includes('phone') ||
                  k.toLowerCase().includes('mobile') ||
                  k.toLowerCase().includes('cell')
                );
                if (phoneKey) phoneVal = item[phoneKey];
              }

              // 3. Ultimate Fallback: Scan ALL values (legacy logic kept for safety)
              if (!phoneVal) {
                const phoneRegex = /^(\+?[\d\s-]{7,})$/;
                const potentialKey = Object.keys(item).find(k => {
                  const val = String(item[k]).trim();
                  return val.length > 6 && val.length < 20 && /[\d]{5,}/.test(val) && !/[a-wy-z]/i.test(val) && phoneRegex.test(val);
                });
                if (potentialKey) phoneVal = item[potentialKey];
              }

              const contact: Contact = {
                id: crypto.randomUUID(),
                agencyId: currentUser.agencyId,
                name: item.name || 'Unknown',
                email: item.email || '',
                phone: phoneVal,
                tags: item.tags || [],
                notes: item.notes || '',
                assignedTo: currentUser.id,
                createdAt: new Date().toISOString(),
                metadata: item
              };
              return db.saveContact(contact);
            });
            await Promise.all(promises);
            await loadData(currentUser);
          }
        };
    }
  };

  const handleDeleteContacts = (ids: string[]) => {
    db.deleteContacts(ids);
    loadData(currentUser!);
  };

  const renderView = () => {
    if (!currentUser) return null;
    switch (currentView) {
      case 'dashboard':
        return <Dashboard
          contacts={contacts} listings={listings} tasks={tasks} offers={offers}
          activities={activities} user={currentUser} users={users}
        />;
      case 'contacts':
        return <Contacts
          contacts={contacts} users={users} currentUser={currentUser}
          onRefresh={() => loadData(currentUser)}
          onImport={() => handleOpenImport('contacts')}
          onAddContact={() => setIsCreateContactModalOpen(true)}
          onDelete={handleDeleteContacts}
        />;
      case 'pipeline':
        return <Pipeline
          listings={listings} users={users} currentUser={currentUser}
          onMove={handleMoveListing} onRefresh={() => loadData(currentUser)}
          onImport={() => handleOpenImport('listings')}
          onAddListing={() => setIsCreateListingModalOpen(true)}
          onDelete={(ids) => {
            db.deleteListings(ids);
            loadData(currentUser);
          }}
        />;
      case 'offers':
        return <Offers
          offers={offers} listings={listings} users={users} currentUser={currentUser}
          onUpdateStatus={handleUpdateOffer} onImport={() => handleOpenImport('offers')}
          onRefresh={() => loadData(currentUser)}
          onAddOffer={() => setIsCreateOfferModalOpen(true)}
        />;
      case 'tasks':
        return <Tasks
          tasks={tasks} users={users} currentUser={currentUser}
          onRefresh={() => loadData(currentUser)}
          onAddTask={() => setIsCreateTaskModalOpen(true)}
          onImport={() => handleOpenImport('tasks')}
        />;
      case 'messaging':
        return <Messaging
          threads={threads} users={users} currentUser={currentUser}
          onSendMessage={handleSendMessage}
        />;
      case 'admin':
        return <AgencyAdmin
          agency={currentAgency!}
          users={users}
          activities={activities}
          onSaveUser={async (u) => { await db.saveUser(u); loadData(currentUser); }}
          onDeleteUser={async (id) => { await db.deleteUser(id); loadData(currentUser); }}
          onResetTeam={async () => {
            if (!currentUser) return;
            // Delete everyone except current user
            const toDelete = users.filter(u => u.id !== currentUser.id).map(u => u.id);
            await Promise.all(toDelete.map(id => db.deleteUser(id)));
            loadData(currentUser);
          }}
        />;
      default:
        return <div>Section Coming Soon</div>;
    }
  };

  if (!currentUser) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <div className="max-w-md w-full p-10 bg-white rounded-[3rem] shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-100">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{APP_NAME}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Enterprise Real Estate Operating System</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Workspace Access</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoginLoading(true);
              setLoginError('');

              try {
                // 1. Check if user exists
                let user = await db.getUserByEmail(loginEmail);

                // 2. If not found, check if it's the master admin email
                if (loginEmail.toLowerCase() === 'shreyas@rm.com' && !user) {
                  // Auto-provision admin
                  const newAdmin: User = {
                    id: crypto.randomUUID(),
                    agencyId: 'a1',
                    name: 'Shreyas',
                    email: loginEmail,
                    role: 'admin',
                    status: 'Active',
                    aiUsage: 0
                  };
                  await db.saveUser(newAdmin);
                  login(newAdmin);
                } else if (user) {
                  login(user);
                } else {
                  // New user signup
                  const newUser: User = {
                    id: crypto.randomUUID(),
                    agencyId: 'a1', // default to main agency for now
                    name: loginEmail.split('@')[0],
                    email: loginEmail,
                    role: 'agent', // default role
                    status: 'Active',
                    aiUsage: 0
                  };
                  await db.saveUser(newUser);
                  login(newUser);
                }
              } catch (err) {
                console.error(err);
                setLoginError('An error occurred. Please try again.');
              } finally {
                setLoginLoading(false);
              }
            }} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="name@company.com"
                  disabled={loginLoading}
                />
              </div>
              {loginError && (
                <p className="text-xs font-bold text-red-500">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Verifying...' : 'Enter Workspace'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-900" >
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-40`}>
        <div className="p-8 shrink-0 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">{APP_NAME}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            {isSidebarOpen ? <Menu className="w-6 h-6 text-slate-400" /> : <ChevronRight className="w-6 h-6 text-slate-400" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-bold transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-indigo-500'}`} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t bg-slate-50/50">
          <button onClick={logout} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 shrink-0 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 z-30">
          <div className="flex items-center gap-6 flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                placeholder="Search deals, clients, addresses..."
                className="w-full bg-slate-50 border-none rounded-lg py-2.5 pl-11 pr-6 text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right mr-2">
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{currentUser.name}</p>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Workspace Member</p>
            </div>
            <button className="relative p-2.5 hover:bg-slate-100 rounded-lg transition-all border">
              <Bell className="w-5 h-5 text-slate-400" />
            </button>
            <img src={currentUser.avatar} className="w-10 h-10 rounded-lg border shadow-md cursor-pointer hover:scale-105 transition-transform" alt="" />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {renderView()}
        </section>

        {/* CREATE CONTACT MODAL */}
        {isCreateContactModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="px-10 py-8 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Lead Entry</h3>
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">Asset & CRM Protocol</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateContactModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSaveManualContact} className="p-10 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Legal Name</label>
                  <input
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                    value={newContact.name}
                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="e.g. Jonathan Wick"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      required
                      type="email"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                      value={newContact.email}
                      onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="leads@agency.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      required
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                      value={newContact.phone}
                      onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CRM Tags (Comma separated)</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      className="w-full px-5 py-4 pl-11 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                      value={newContact.tags}
                      onChange={e => setNewContact({ ...newContact, tags: e.target.value })}
                      placeholder="Buyer, High Intent, Investor..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Strategic Notes</label>
                  <div className="relative">
                    <StickyNote className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                    <textarea
                      className="w-full px-5 py-4 pl-11 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm min-h-[100px]"
                      value={newContact.notes}
                      onChange={e => setNewContact({ ...newContact, notes: e.target.value })}
                      placeholder="Key details about the lead's requirements..."
                    />
                  </div>
                </div>

                <div className="pt-6 border-t flex gap-4">
                  <button type="button" onClick={() => setIsCreateContactModalOpen(false)} className="flex-1 py-5 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                  <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs rounded-[1.5rem] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                    <Save className="w-4 h-4" /> Initialize Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATE LISTING MODAL */}
        {isCreateListingModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="px-10 py-8 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Asset Entry</h3>
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">Pipeline Injection</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateListingModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSaveManualListing} className="p-10 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Property Address</label>
                  <input
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                    value={newListing.address}
                    onChange={e => setNewListing({ ...newListing, address: e.target.value })}
                    placeholder="e.g. 123 Skyline Blvd"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seller / Vendor</label>
                  <input
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                    value={newListing.sellerName}
                    onChange={e => setNewListing({ ...newListing, sellerName: e.target.value })}
                    placeholder="e.g. Meridian Holdings LLC"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target List Price ($)</label>
                  <input
                    required
                    type="number"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                    value={newListing.price}
                    onChange={e => setNewListing({ ...newListing, price: e.target.value })}
                    placeholder="e.g. 1500000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Agent</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                    value={newListing.assignedAgent}
                    onChange={e => setNewListing({ ...newListing, assignedAgent: e.target.value })}
                  >
                    <option value="">Assign to Me ({currentUser?.name})</option>
                    {MOCK_USERS.filter(u => u.agencyId === currentUser?.agencyId && u.id !== currentUser?.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-6 border-t flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateListingModalOpen(false)}
                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Asset
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isCreateTaskModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="px-10 py-8 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Schedule Action</h3>
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">Productivity & Accountability Flow</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateTaskModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSaveManualTask} className="p-10 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Task Definition</label>
                  <input
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="e.g. Follow up on 123 Oak St inspection"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Due Date</label>
                    <input
                      required
                      type="date"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority</label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm appearance-none"
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign To Specialist</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm appearance-none"
                    value={newTask.assignedTo}
                    onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  >
                    <option value="">Myself ({currentUser.name})</option>
                    {users.filter(u => u.agencyId === currentUser.agencyId && u.id !== currentUser.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-6 border-t flex gap-4">
                  <button type="button" onClick={() => setIsCreateTaskModalOpen(false)} className="flex-1 py-5 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                  <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs rounded-[1.5rem] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                    <Save className="w-4 h-4" /> Initialize Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isCreateOfferModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="px-10 py-8 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Purchase Agreement Draft</h3>
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">Buyer Agency Representation Protocol</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateOfferModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSaveManualOffer} className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">1. Asset Identification</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                      <button type="button" onClick={() => setNewOffer({ ...newOffer, isExternal: true })} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${newOffer.isExternal ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>External Site</button>
                      <button type="button" onClick={() => setNewOffer({ ...newOffer, isExternal: false })} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!newOffer.isExternal ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Internal Listing</button>
                    </div>
                    {newOffer.isExternal ? (
                      <input
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                        value={newOffer.externalAddress}
                        onChange={e => setNewOffer({ ...newOffer, externalAddress: e.target.value })}
                        placeholder="Full Street Address, City, State, Zip"
                      />
                    ) : (
                      <select
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                        value={newOffer.listingId}
                        onChange={e => setNewOffer({ ...newOffer, listingId: e.target.value })}
                      >
                        <option value="">Select office property...</option>
                        {listings.map(l => <option key={l.id} value={l.id}>{l.address} (${l.price.toLocaleString()})</option>)}
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">2. Financial Consideration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Purchase Price ($)</label>
                      <input
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-black text-indigo-600 text-lg"
                        value={newOffer.price}
                        onChange={e => setNewOffer({ ...newOffer, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Down Payment ($)</label>
                      <input
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                        value={newOffer.downPayment}
                        onChange={e => setNewOffer({ ...newOffer, downPayment: e.target.value })}
                        placeholder="Amount at closing"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Earnest Money / Escrow ($)</label>
                      <input
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                        value={newOffer.earnestMoney}
                        onChange={e => setNewOffer({ ...newOffer, earnestMoney: e.target.value })}
                        placeholder="Initial deposit"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Financing Strategy</label>
                      <select
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm appearance-none"
                        value={newOffer.financing}
                        onChange={e => setNewOffer({ ...newOffer, financing: e.target.value as any })}
                      >
                        <option value="Cash">Cash Offer</option>
                        <option value="Conventional">Conventional Loan</option>
                        <option value="FHA">FHA Loan</option>
                        <option value="VA">VA Loan</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">3. Protections & Timelines</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inspection Period (Days)</label>
                      <input
                        required
                        type="number"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                        value={newOffer.inspectionPeriod}
                        onChange={e => setNewOffer({ ...newOffer, inspectionPeriod: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Requested Closing Date</label>
                      <input
                        required
                        type="date"
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                        value={newOffer.closingDate}
                        onChange={e => setNewOffer({ ...newOffer, closingDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Critical Contingencies</label>
                    <div className="flex flex-wrap gap-2">
                      {['Inspection', 'Appraisal', 'Financing', 'Sale of Home', 'Title Search'].map(c => (
                        <button key={c} type="button" onClick={() => toggleContingency(c)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newOffer.contingencies.includes(c) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Buyer Entity Name</label>
                    <input
                      required
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm"
                      value={newOffer.buyerName}
                      onChange={e => setNewOffer({ ...newOffer, buyerName: e.target.value })}
                      placeholder="John & Mary Doe"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t flex gap-4">
                  <button type="button" onClick={() => setIsCreateOfferModalOpen(false)} className="flex-1 py-5 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-2xl transition-all">Discard Draft</button>
                  <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs rounded-[1.5rem] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                    <Save className="w-4 h-4" /> Finalize Offer Sheet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Use a unique key for each import type to ensure the modal state is completely destroyed/recreated when switching sections */}
        {isImportModalOpen && (
          <CSVImportModal
            key={importType}
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            {...getImportConfig()}
          />
        )}
      </main>
    </div >
  );
};

export default App;
