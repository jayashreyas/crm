
import React, { useState, useEffect } from 'react';
import { Listing, ListingStatus, User } from '../types';
// Fixed the "Cannot find name 'Edit2'" error by adding Edit2 to the lucide-react imports.
import { MapPin, DollarSign, User as UserIcon, ArrowRightLeft, AlertTriangle, CheckCircle, Info, Loader2, FileUp, ChevronDown, ListChecks, Home, X, Plus, Layers, Save, Edit2, Trash2, CheckSquare } from 'lucide-react';
import { db } from '../services/db.service';

interface PipelineProps {
  listings: Listing[];
  users: User[];
  currentUser: User;
  onMove: (id: string, status: ListingStatus) => void;
  onRefresh: () => void;
  onImport: () => void;
  onAddListing: () => void;
  onDelete?: (ids: string[]) => void;
}

export const Pipeline: React.FC<PipelineProps> = ({ listings, users, currentUser, onMove, onRefresh, onImport, onAddListing, onDelete }) => {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [editForm, setEditForm] = useState({
    address: '',
    sellerName: '',
    price: 0,
    assignedAgent: '',
    status: 'New' as ListingStatus
  });

  const stages: ListingStatus[] = ['New', 'Active', 'Under Contract', 'Sold'];

  // Update edit form when selection changes
  useEffect(() => {
    if (selectedListing) {
      setEditForm({
        address: selectedListing.address,
        sellerName: selectedListing.sellerName,
        price: selectedListing.price,
        assignedAgent: selectedListing.assignedAgent,
        status: selectedListing.status
      });
    }
  }, [selectedListing]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === listings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listings.map(l => l.id));
    }
  };

  const executeDelete = () => {
    // Temporarily removed confirmation for testing
    if (onDelete) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };



  const handleSavePropertyDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    const updatedListing: Listing = {
      ...selectedListing,
      address: editForm.address,
      sellerName: editForm.sellerName,
      price: editForm.price,
      assignedAgent: editForm.assignedAgent,
      status: editForm.status
    };

    await db.saveListing(updatedListing);
    await db.logActivity(currentUser.agencyId, currentUser.id, 'updated property details', updatedListing.address);
    onRefresh();
    // Keep it open but update the local selection to reflect saved changes
    setSelectedListing(updatedListing);
  };

  const handleStageQuickAction = (status: ListingStatus) => {
    setEditForm(prev => ({ ...prev, status }));
  };

  return (
    <div className="h-full flex flex-col space-y-4 relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Listings Pipeline</h2>

          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
              <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={executeDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-100 transition-all text-xs uppercase tracking-wider"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-slate-400 font-bold hover:text-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs"
              >
                <CheckSquare className="w-4 h-4" />
                Select All
              </button>
              <button
                onClick={onImport}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs"
              >
                <FileUp className="w-4 h-4" />
                Import CSV
              </button>
              <button
                onClick={onAddListing}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all text-xs"
              >
                <Plus className="w-4 h-4" />
                Add Listing
              </button>
            </div>
          )}
        </div>

      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {stages.map(stage => (
          <div key={stage} className="flex-shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-[2rem] border border-slate-200">
            <div className="p-5 border-b flex items-center justify-between">
              <span className="font-black text-slate-700 text-xs uppercase tracking-widest">{stage}</span>
              <span className="bg-white border text-slate-500 text-[10px] px-2.5 py-1 rounded-full font-black">
                {listings.filter(l => l.status === stage).length}
              </span>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
              {listings.filter(l => l.status === stage).map(listing => (
                <div
                  key={listing.id}
                  onClick={() => setSelectedListing(listing)}
                  className={`relative bg-white p-5 rounded-2xl shadow-sm border transition-all group cursor-pointer ${selectedIds.includes(listing.id) ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-transparent hover:border-indigo-300'
                    }`}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(listing.id);
                    }}
                    className={`absolute top-4 left-4 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all z-10 ${selectedIds.includes(listing.id)
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-slate-200 bg-white text-transparent group-hover:border-indigo-300'
                      }`}
                  >
                    <CheckSquare className="w-3 h-3 text-white" />
                  </div>



                  <div className="flex justify-between items-start mb-2 pr-10 pl-8">
                    <p className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{listing.address}</p>
                  </div>

                  <div className="space-y-1.5 mb-4 pl-8">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <DollarSign className="w-3 h-3 text-emerald-500" />
                      <span className="font-black text-slate-900">${listing.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <UserIcon className="w-3 h-3" />
                      <span className="font-medium">{listing.sellerName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 pl-8">
                    <div className="flex items-center gap-2">
                      <img
                        src={users.find(u => u.id === listing.assignedAgent)?.avatar}
                        className="w-6 h-6 rounded-lg border border-white shadow-sm"
                        alt=""
                      />
                    </div>

                    <div className="flex gap-2">
                      {stage !== 'Sold' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMove(listing.id, stages[stages.indexOf(stage) + 1]);
                          }}
                          className="p-1.5 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-lg border border-slate-100 transition-all"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedListing && (
        <div className="absolute inset-y-0 right-0 w-[550px] bg-white shadow-2xl border-l z-50 flex flex-col animate-in slide-in-from-right duration-300 rounded-l-[3rem]">
          <div className="p-8 border-b flex items-center justify-between shrink-0 bg-slate-50/50">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Home className="w-6 h-6 text-indigo-600" />
                Asset Registry
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Ref ID: {selectedListing.id}</p>
            </div>
            <button onClick={() => setSelectedListing(null)} className="p-3 hover:bg-slate-200 rounded-full transition-all"><X className="w-6 h-6 text-slate-400" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {/* Header Fact */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedListing.address}</h2>
                <p className="text-sm font-bold text-indigo-600 mt-1">${selectedListing.price.toLocaleString()} • {selectedListing.sellerName}</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <Edit2 className="w-3 h-3 text-indigo-600" />
                  Property Configuration
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Site Address</label>
                      <input
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                        value={editForm.address}
                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seller Entity</label>
                      <input
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                        value={editForm.sellerName}
                        onChange={e => setEditForm({ ...editForm, sellerName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Price ($)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                        value={editForm.price}
                        onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Specialist</label>
                    <select
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none appearance-none"
                      value={editForm.assignedAgent}
                      onChange={e => setEditForm({ ...editForm, assignedAgent: e.target.value })}
                    >
                      {users.filter(u => u.agencyId === currentUser.agencyId).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* PIPELINE STAGE EDIT MODULE */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Pipeline Stage Transition
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {stages.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => handleStageQuickAction(stage)}
                    className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${editForm.status === stage
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                      : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                      }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>



            {/* RAW DATA MODULE - Show Every Detail */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-400" />
                Extended Site Data
              </h4>
              <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden shadow-inner">
                {selectedListing.metadata ? (
                  <div className="divide-y divide-slate-100">
                    {Object.entries(selectedListing.metadata).map(([key, value]) => {
                      if (!value || value === 'null' || value === 'undefined') return null;
                      return (
                        <div key={key} className="flex px-6 py-4 hover:bg-white transition-colors group">
                          <span className="w-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest truncate pr-4">{key}</span>
                          <span className="w-1/2 text-xs font-bold text-slate-700 break-words group-hover:text-indigo-600">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-10 text-center text-slate-400 text-xs font-medium">No extended metadata found for this listing.</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 border-t bg-white shrink-0 flex gap-4">
            <button
              onClick={() => setSelectedListing(null)}
              className="flex-1 py-4 text-slate-500 font-black text-sm hover:bg-slate-50 rounded-2xl transition-all"
            >
              Dismiss
            </button>
            <button
              onClick={handleSavePropertyDetails}
              className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Update Asset Registry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
