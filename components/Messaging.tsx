
import React, { useState } from 'react';
import { Thread, User, Message } from '../types';
import { Send, Hash, Home, HandCoins, Info, BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { AIService } from '../services/ai.service';
import { db } from '../services/db.service';

interface MessagingProps {
  threads: Thread[];
  users: User[];
  currentUser: User;
  onSendMessage: (threadId: string, text: string) => void;
}

export const Messaging: React.FC<MessagingProps> = ({ threads, users, currentUser, onSendMessage }) => {
  const [activeThreadId, setActiveThreadId] = useState(threads[0]?.id || 'general');
  const [messageText, setMessageText] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(activeThreadId, messageText);
    setMessageText('');
  };

  const handleAIDraft = async () => {
    if (!activeThread) return;
    setIsDrafting(true);
    try {
      if (db.consumeCredits(currentUser.agencyId, currentUser.id, 10)) {
        const draft = await AIService.draftResponse(activeThread, currentUser.name);
        setMessageText(draft);
      } else {
        alert("Insufficient AI Credits");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="h-full flex rounded-[3rem] border bg-white overflow-hidden shadow-2xl">
      {/* Thread Sidebar */}
      <div className="w-72 border-r bg-slate-50 flex flex-col">
        <div className="p-8 border-b">
          <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Communications</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {threads.map(thread => (
            <button
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-[1.5rem] text-sm font-bold transition-all ${
                activeThreadId === thread.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl ${activeThreadId === thread.id ? 'bg-white/20' : 'bg-slate-200'}`}>
                {thread.type === 'general' ? <Hash className="w-4 h-4" /> : 
                 thread.type === 'listing' ? <Home className="w-4 h-4" /> : <HandCoins className="w-4 h-4" />}
              </div>
              <span className="truncate">{thread.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-8 border-b flex items-center justify-between bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-2 rounded-2xl">
              {activeThread?.type === 'general' ? <Hash className="w-5 h-5 text-indigo-500" /> : 
               activeThread?.type === 'listing' ? <Home className="w-5 h-5 text-indigo-500" /> : <HandCoins className="w-5 h-5 text-indigo-500" />}
            </div>
            <div>
              <span className="font-black text-slate-900 text-xl tracking-tight">{activeThread?.title}</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Team Sync Active</span>
              </div>
            </div>
          </div>
          <button className="text-slate-300 hover:text-slate-600 p-3 hover:bg-slate-50 rounded-2xl transition-all">
            <Info className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
          {activeThread?.messages.map((msg, i) => {
            const sender = users.find(u => u.id === msg.senderId);
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <img src={sender?.avatar} className="w-10 h-10 rounded-[1rem] border-2 border-white shadow-md shrink-0" alt="" />
                <div className={`max-w-[70%] space-y-1`}>
                  {!isMe && <p className="text-[9px] font-black text-slate-300 ml-2 uppercase tracking-widest">{sender?.name}</p>}
                  <div className={`px-6 py-4 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${
                    isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <p className="text-[9px] text-slate-300 font-bold px-2 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 border-t bg-white/80 backdrop-blur-lg">
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <button 
                  onClick={handleAIDraft}
                  disabled={isDrafting}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {isDrafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isDrafting ? 'Drafting...' : 'Draft Response with AI (10 Credits)'}
                </button>
             </div>
             <div className="flex items-center gap-3 bg-slate-50 rounded-[2rem] p-3 focus-within:ring-4 focus-within:ring-indigo-100 border-2 border-slate-100 transition-all group">
                <input 
                  type="text" 
                  placeholder="Type a secure message..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold px-4 py-2 text-slate-800 placeholder:text-slate-300"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  className="p-4 bg-slate-900 text-white rounded-full hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-20"
                  disabled={!messageText.trim()}
                >
                  <Send className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
