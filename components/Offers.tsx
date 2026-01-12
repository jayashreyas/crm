
import React, { useState, useEffect } from 'react';
import { Offer, Listing, User, OfferStatus } from '../types';
import {
  Plus,
  HandCoins,
  Calendar,
  DollarSign,
  BrainCircuit,
  Loader2,
  ShieldCheck,
  Clock,
  FileText,
  Send,
  UserCheck,
  MapPin,
  Zap,
  ArrowRight,
  MoreHorizontal,
  X,
  Save,
  Layers,
  ListChecks,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AIService } from '../services/ai.service';
import { db } from '../services/db.service';

interface OffersProps {
  offers: Offer[];
  listings: Listing[];
  users: User[];
  currentUser: User;
  onUpdateStatus: (id: string, status: OfferStatus) => void;
  onImport: () => void;
  onRefresh: () => void;
  onAddOffer: () => void;
  onPDFUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isPdfAnalyzing?: boolean;
}

export const Offers: React.FC<OffersProps> = ({ offers, listings, users, currentUser, onUpdateStatus, onImport, onRefresh, onAddOffer, onPDFUpload, isPdfAnalyzing }) => {
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<Offer>>({});

  const stages: OfferStatus[] = ['Draft', 'Offer Sent', 'In Talks', 'Offer Accepted', 'Offer Declined'];

  useEffect(() => {
    if (selectedOffer) {
      setEditForm({ ...selectedOffer });
    }
  }, [selectedOffer]);

  const getStatusColor = (status: OfferStatus) => {
    switch (status) {
      case 'Offer Accepted': return 'bg-emerald-500';
      case 'Offer Declined': return 'bg-slate-400';
      case 'In Talks': return 'bg-amber-500';
      case 'Draft': return 'bg-slate-300';
      case 'Offer Sent': return 'bg-indigo-500';
      default: return 'bg-indigo-600';
    }
  };

  const handleAISummary = async (e: React.MouseEvent, offer: Offer) => {
    e.stopPropagation();
    setSummarizingId(offer.id);
    try {
      if (await db.consumeCredits(currentUser.agencyId, currentUser.id, 2)) {
        const listing = listings.find(l => l.id === offer.listingId);
        if (listing) {
          const summary = await AIService.summarizeOffer(offer, listing);
          await db.updateOfferSummary(offer.id, summary);
          onRefresh();
          if (selectedOffer?.id === offer.id) {
            setSelectedOffer({ ...offer, aiSummary: summary });
          }
        }
      } else {
        alert("Insufficient AI Credits");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSummarizingId(null);
    }
  };

  const handleSaveOfferDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !editForm.buyerName) return;

    const updatedOffer: Offer = {
      ...selectedOffer,
      ...editForm as Offer,
    };

    await db.saveOffer(updatedOffer, currentUser.id);
    await db.logActivity(currentUser.agencyId, currentUser.id, 'updated negotiation terms for', updatedOffer.buyerName);
    onRefresh();
    setSelectedOffer(updatedOffer);
  };

  const toggleContingency = (c: string) => {
    const current = editForm.contingencies || [];
    const updated = current.includes(c)
      ? current.filter(item => item !== c)
      : [...current, c];
    setEditForm({ ...editForm, contingencies: updated });
  };

  return (
    <div className="h-full flex flex-col space-y-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Negotiation Pipeline</h2>
          <p className="text-slate-500 font-medium text-sm flex items-center gap-2 mt-1">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            Buyer Agent Command Center • <span className="text-indigo-600 font-bold">{offers.length} Active Negotiations</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onImport} className="px-6 py-2.5 border border-slate-200 bg-white text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all text-xs">Import Negotiations</button>

          <label className={`px-6 py-2.5 border-2 border-indigo-200 bg-indigo-50 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-100 transition-all text-xs cursor-pointer flex items-center gap-2 ${isPdfAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="file"
              accept=".pdf"
              onChange={onPDFUpload}
              className="hidden"
              disabled={isPdfAnalyzing}
            />
            {isPdfAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Upload PDF Offer
              </>
            )}
          </label>

          <button type="button" onClick={onAddOffer} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all text-xs uppercase tracking-widest">
            <Plus className="w-4 h-4" /> New Offer
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 custom-scrollbar min-h-0">
        {stages.map(stage => (
          <div key={stage} className="flex-shrink-0 w-80 flex flex-col bg-slate-100/40 rounded-[2.5rem] border border-slate-200/60 p-2">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(stage)}`}></div>
                <span className="font-black text-slate-700 text-[11px] uppercase tracking-[0.15em]">{stage}</span>
              </div>
              <span className="bg-white border text-slate-400 text-[10px] px-2.5 py-1 rounded-full font-black shadow-sm">
                {offers.filter(o => o.status === stage).length}
              </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-4 custom-scrollbar">
              {offers.filter(o => o.status === stage).map(offer => {
                const listing = listings.find(l => l.id === offer.listingId);
                return (
                  <div
                    key={offer.id}
                    onClick={() => setSelectedOffer(offer)}
                    className={`bg-white p-6 rounded-[2rem] shadow-sm border transition-all group cursor-pointer relative ${selectedOffer?.id === offer.id ? 'border-indigo-500 shadow-indigo-100 ring-2 ring-indigo-50' : 'border-transparent hover:border-indigo-300 hover:shadow-xl'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-black text-slate-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">{offer.buyerName}</p>
                      <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mb-4">
                      <MapPin className="w-3.5 h-3.5 text-slate-300" />
                      <span className="truncate">{listing?.address || 'Property Data...'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Price</p>
                        <p className="text-xs font-black text-slate-900">${(offer.price / 1000).toFixed(0)}k</p>
                      </div>
                      <div className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/20">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">EMD</p>
                        <p className="text-xs font-black text-indigo-700">${(offer.earnestMoney / 1000).toFixed(1)}k</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center -space-x-2">
                        <img
                          src={users.find(u => u.id === offer.assignedTo)?.avatar}
                          className="w-7 h-7 rounded-lg border-2 border-white shadow-sm"
                          alt=""
                        />
                      </div>

                      <div className="flex gap-1.5">
                        {stage !== 'Offer Accepted' && stage !== 'Offer Declined' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextIndex = stages.indexOf(stage) + 1;
                              if (nextIndex < stages.length) onUpdateStatus(offer.id, stages[nextIndex]);
                            }}
                            className="p-2 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl border border-slate-100 transition-all"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* OFFER DETAILS MODULE (Side Panel) */}
      {selectedOffer && (
        <div className="absolute inset-y-0 right-0 w-[550px] bg-white shadow-2xl border-l z-50 flex flex-col animate-in slide-in-from-right duration-300 rounded-l-[3rem]">
          <div className="p-8 border-b flex items-center justify-between shrink-0 bg-slate-50/50">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <HandCoins className="w-6 h-6 text-indigo-600" />
                Negotiation Brief
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Transaction Ref: {selectedOffer.id}</p>
            </div>
            <button onClick={() => setSelectedOffer(null)} className="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X className="w-6 h-6" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {/* Stage Selector */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Negotiation Stage
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {stages.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setEditForm({ ...editForm, status: stage })}
                    className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${editForm.status === stage
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                      : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                      }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            {/* Financials Edit Form */}
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Agreement Terms
                </h4>
                <ShieldCheck className="w-4 h-4 text-indigo-300" />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Buyer Entity</label>
                  <input
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none"
                    value={editForm.buyerName}
                    onChange={e => setEditForm({ ...editForm, buyerName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Offer Price ($)</label>
                    <input
                      type="number"
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none"
                      value={editForm.price}
                      onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Earnest Money ($)</label>
                    <input
                      type="number"
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-emerald-600 focus:ring-4 focus:ring-indigo-100 outline-none"
                      value={editForm.earnestMoney}
                      onChange={e => setEditForm({ ...editForm, earnestMoney: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Inspection (Days)</label>
                    <input
                      type="number"
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none"
                      value={editForm.inspectionPeriod}
                      onChange={e => setEditForm({ ...editForm, inspectionPeriod: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Closing Date</label>
                    <input
                      type="date"
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none"
                      value={editForm.closingDate ? editForm.closingDate.split('T')[0] : ''}
                      onChange={e => setEditForm({ ...editForm, closingDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contingencies */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-400" />
                Active Contingencies
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Inspection', 'Appraisal', 'Financing', 'Sale of Home', 'Title Search'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleContingency(c)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${(editForm.contingencies || []).includes(c)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Summary Module */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  Audit Insight
                </h4>
                <button
                  onClick={(e) => handleAISummary(e, selectedOffer)}
                  disabled={summarizingId === selectedOffer.id}
                  className="flex items-center gap-2 text-[9px] font-black text-indigo-600 hover:text-indigo-800 disabled:opacity-50 uppercase tracking-widest"
                >
                  {summarizingId === selectedOffer.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Refresh Audit (2 Credits)
                </button>
              </div>

              <div className="p-6 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100/50 relative overflow-hidden">
                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                  {selectedOffer.aiSummary || "Run a deal audit to identify risks and leverage points for this buyer."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 border-t bg-white shrink-0 flex gap-4">
            <button
              onClick={() => setSelectedOffer(null)}
              className="flex-1 py-4 text-slate-500 font-black text-sm hover:bg-slate-50 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOfferDetails}
              className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Update Negotiation Brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
