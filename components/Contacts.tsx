
import React, { useState } from 'react';
import { Contact, User } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  FileUp, 
  Mail, 
  Phone, 
  Tag, 
  MoreVertical, 
  UserPlus, 
  ExternalLink,
  Filter
} from 'lucide-react';

interface ContactsProps {
  contacts: Contact[];
  users: User[];
  currentUser: User;
  onRefresh: () => void;
  onImport: () => void;
  onAddContact: () => void;
}

export const Contacts: React.FC<ContactsProps> = ({ contacts, users, currentUser, onRefresh, onImport, onAddContact }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">CRM Contacts</h2>
          <p className="text-slate-500 font-medium text-sm flex items-center gap-2 mt-1">
            <Users className="w-4 h-4 text-indigo-600" />
            Central Asset Database • <span className="text-indigo-600 font-bold">{contacts.length} Total Leads</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onImport} 
            className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 bg-white text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all text-xs"
          >
            <FileUp className="w-4 h-4 text-slate-400" />
            Import CSV
          </button>
          <button 
            type="button" 
            onClick={onAddContact} 
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all text-xs uppercase tracking-widest"
          >
            <UserPlus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border shadow-sm flex flex-col min-h-0 overflow-hidden">
        <div className="p-6 border-b flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search by name, email, or tag..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2.5 border border-slate-200 bg-white text-slate-400 rounded-xl hover:text-indigo-600 transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">Lead Entity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">Contact Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">Tags</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 font-medium">
                    No leads found matching your search.
                  </td>
                </tr>
              ) : (
                filteredContacts.map(contact => {
                  const assignee = users.find(u => u.id === contact.assignedTo);
                  return (
                    <tr key={contact.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shadow-inner">
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{contact.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assigned: {assignee?.name || 'Unassigned'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-300" />
                            {contact.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-slate-300" />
                            {contact.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-1.5">
                          {contact.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
                              <Tag className="w-2.5 h-2.5 text-indigo-400" />
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length === 0 && <span className="text-[10px] text-slate-300 font-medium">No tags</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-xl transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-slate-50/50 border-t flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span>Showing {filteredContacts.length} of {contacts.length} leads</span>
          <div className="flex items-center gap-4">
            <button disabled className="opacity-50 cursor-not-allowed">Previous</button>
            <button className="text-indigo-600 hover:underline">Next Page</button>
          </div>
        </div>
      </div>
    </div>
  );
};
