
import React from 'react';
import { Listing, ListingStatus, User } from '../types';
import { MapPin, DollarSign, User as UserIcon, ArrowRightLeft } from 'lucide-react';

interface PipelineProps {
  listings: Listing[];
  users: User[];
  onMove: (id: string, status: ListingStatus) => void;
}

export const Pipeline: React.FC<PipelineProps> = ({ listings, users, onMove }) => {
  const stages: ListingStatus[] = ['New', 'Active', 'Under Contract', 'Sold'];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Listings Pipeline</h2>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {stages.map(stage => (
          <div key={stage} className="flex-shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-xl border border-slate-200">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">{stage}</span>
              <span className="bg-white border text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold">
                {listings.filter(l => l.status === stage).length}
              </span>
            </div>
            
            <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
              {listings.filter(l => l.status === stage).map(listing => (
                <div key={listing.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-indigo-300 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{listing.address}</p>
                    <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <DollarSign className="w-3 h-3" />
                      <span className="font-semibold text-indigo-600">${listing.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <UserIcon className="w-3 h-3" />
                      <span>{listing.sellerName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1.5">
                      <img 
                        src={users.find(u => u.id === listing.assignedAgent)?.avatar} 
                        className="w-5 h-5 rounded-full border border-white shadow-sm"
                        alt=""
                      />
                      <span className="text-[10px] font-medium text-slate-400">
                        {users.find(u => u.id === listing.assignedAgent)?.name.split(' ')[0]}
                      </span>
                    </div>
                    
                    <div className="flex gap-1">
                      {stage !== 'Sold' && (
                        <button 
                          onClick={() => onMove(listing.id, stages[stages.indexOf(stage) + 1])}
                          className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-600 hover:bg-indigo-600 hover:text-white rounded border transition-all"
                        >
                          Move Next
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
    </div>
  );
};
