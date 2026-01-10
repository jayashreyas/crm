
import React, { useState } from 'react';
import { Thread, User, Message } from '../types';
import { Send, Hash, Home, HandCoins, Info } from 'lucide-react';

interface MessagingProps {
  threads: Thread[];
  users: User[];
  currentUser: User;
  onSendMessage: (threadId: string, text: string) => void;
}

export const Messaging: React.FC<MessagingProps> = ({ threads, users, currentUser, onSendMessage }) => {
  const [activeThreadId, setActiveThreadId] = useState(threads[0]?.id || 'general');
  const [messageText, setMessageText] = useState('');

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(activeThreadId, messageText);
    setMessageText('');
  };

  return (
    <div className="h-full flex rounded-2xl border bg-white overflow-hidden shadow-sm">
      {/* Thread Sidebar */}
      <div className="w-64 border-r bg-slate-50 flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-bold text-slate-800">Messaging</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {threads.map(thread => (
            <button
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeThreadId === thread.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              {thread.type === 'general' ? <Hash className="w-4 h-4" /> : 
               thread.type === 'listing' ? <Home className="w-4 h-4" /> : <HandCoins className="w-4 h-4" />}
              <span className="truncate">{thread.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800">{activeThread?.title}</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-400 font-black uppercase">{activeThread?.type}</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Info className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {activeThread?.messages.map((msg, i) => {
            const sender = users.find(u => u.id === msg.senderId);
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <img src={sender?.avatar} className="w-8 h-8 rounded-full border" alt="" />
                <div className={`max-w-[70%] space-y-1`}>
                  {!isMe && <p className="text-[10px] font-bold text-slate-400 ml-1">{sender?.name}</p>}
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <p className="text-[9px] text-slate-400 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t bg-slate-50">
          <div className="flex items-center gap-2 bg-white border rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <input 
              type="text" 
              placeholder="Write something..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 py-1"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
              disabled={!messageText.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
