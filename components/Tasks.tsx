
import React from 'react';
import { Task, User, TaskStatus, TaskPriority } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  User as UserIcon, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckSquare,
  Filter,
  MoreVertical
} from 'lucide-react';
import { db } from '../services/db.service';

interface TasksProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onRefresh: () => void;
  onAddTask: () => void;
}

// Helper to determine priority color coding
const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
    case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    default: return 'text-slate-600 bg-slate-50 border-slate-100';
  }
};

// Defined interface for TaskCard props to properly handle types
interface TaskCardProps {
  task: Task;
  users: User[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

// Used React.FC to handle intrinsic attributes like 'key' correctly in JSX lists
const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  users, 
  onToggle, 
  onDelete 
}) => {
  const isDone = task.status === 'Done';
  const assignee = users.find(u => u.id === task.assignedTo);
  
  return (
    <div className={`group flex items-start gap-4 p-5 bg-white rounded-2xl border transition-all ${isDone ? 'opacity-60 grayscale-[0.5]' : 'hover:border-indigo-300 shadow-sm hover:shadow-md'}`}>
      <button 
        onClick={() => onToggle(task.id)}
        className={`shrink-0 mt-0.5 transition-colors ${isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
      >
        {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-bold truncate transition-all ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </h4>
          <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {assignee?.avatar && <img src={assignee.avatar} className="w-4 h-4 rounded-full border border-white shadow-sm" alt="" />}
            {assignee?.name.split(' ')[0]}
          </div>
        </div>
      </div>

      <button 
        onClick={() => onDelete(task.id)}
        className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const Tasks: React.FC<TasksProps> = ({ tasks, users, currentUser, onRefresh, onAddTask }) => {
  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id);
  const teamTasks = tasks.filter(t => t.assignedTo !== currentUser.id);

  const handleToggle = (id: string) => {
    db.toggleTaskStatus(id, currentUser.agencyId);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    const all = JSON.parse(localStorage.getItem('ep_tasks') || '[]');
    const filtered = all.filter((t: any) => t.id !== id);
    localStorage.setItem('ep_tasks', JSON.stringify(filtered));
    onRefresh();
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Task Command Center</h2>
          <p className="text-slate-500 font-medium text-sm flex items-center gap-2 mt-1">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            Productivity Workspace • <span className="text-indigo-600 font-bold">{myTasks.filter(t => t.status === 'Pending').length} Pending Actions</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 border border-slate-200 bg-white text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button 
            onClick={onAddTask}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* MY TASKS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">My Daily Focus</h3>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{myTasks.length} total</span>
          </div>
          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-medium text-sm">Your schedule is clear. Go hunt some leads!</p>
              </div>
            ) : (
              myTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  users={users} 
                  onToggle={handleToggle} 
                  onDelete={handleDelete} 
                />
              ))
            )}
          </div>
        </div>

        {/* TEAM TASKS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Team Oversight</h3>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{teamTasks.length} assigned</span>
          </div>
          <div className="space-y-3">
             {teamTasks.length === 0 ? (
              <div className="p-12 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-medium text-sm">No team tasks have been initialized yet.</p>
              </div>
            ) : (
              teamTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  users={users} 
                  onToggle={handleToggle} 
                  onDelete={handleDelete} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
