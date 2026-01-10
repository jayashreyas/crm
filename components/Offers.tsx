
import React from 'react';
import { Offer, Listing, User, OfferStatus } from '../types';
import { Plus, HandCoins, Calendar, DollarSign, Filter } from 'lucide-react';

interface OffersProps {
  offers: Offer[];
  listings: Listing[];
  users: User[];
  onUpdateStatus: (id: string, status: OfferStatus) => void;
  onImport: () => void;
}

export const Offers: React.FC<OffersProps> = ({ offers, listings, users, onUpdateStatus, onImport }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Offers Hub</h2>
          <p className="text-slate-500 text-sm">Managing active negotiations and purchase agreements.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onImport}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all text-sm"
          >
            Import CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all text-sm">
            <Plus className="w-4 h-4" /> New Offer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {offers.map(offer => {
          const listing = listings.find(l => l.id === offer.listingId);
          return (
            <div key={offer.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{offer.buyerName}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <HandCoins className="w-3.5 h-3.5" /> For: {listing?.address || 'Deleted Listing'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    offer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                    offer.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                    offer.status === 'Counter' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {offer.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Offer Price</p>
                    <p className="font-bold text-indigo-600">${offer.price.toLocaleString()}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Financing</p>
                    <p className="font-semibold text-slate-700">{offer.financing}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Closing Date</p>
                    <p className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(offer.closingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned</p>
                    <div className="flex items-center gap-1.5">
                      <img src={users.find(u => u.id === offer.assignedTo)?.avatar} className="w-5 h-5 rounded-full border" alt="" />
                      <span className="text-xs font-medium text-slate-600">{users.find(u => u.id === offer.assignedTo)?.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                <button 
                  onClick={() => onUpdateStatus(offer.id, 'Counter')}
                  className="px-4 py-2 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-600 hover:text-white transition-all"
                >
                  Counter Offer
                </button>
                <button 
                  onClick={() => onUpdateStatus(offer.id, 'Accepted')}
                  className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all"
                >
                  Accept Offer
                </button>
                <button 
                  onClick={() => onUpdateStatus(offer.id, 'Rejected')}
                  className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-600 hover:text-white transition-all"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
