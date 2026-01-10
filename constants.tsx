
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  HandCoins, 
  CheckSquare, 
  MessageSquare,
  ShieldCheck,
  Settings 
} from 'lucide-react';
import { AppView, User, Agency } from './types';

export const APP_NAME = "EstatePulse";

export const MOCK_AGENCIES: Agency[] = [
  { id: 'a1', name: 'Elite Realty Group', plan: 'Enterprise', logo: 'https://i.pravatar.cc/150?u=a1' },
  { id: 'a2', name: 'Summit Properties', plan: 'Pro', logo: 'https://i.pravatar.cc/150?u=a2' }
];

export const MOCK_USERS: User[] = [
  // Agency 1 Users
  { id: 'u1', agencyId: 'a1', name: 'Alex Admin', email: 'alex@eliterealty.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=u1', status: 'Active' },
  { id: 'u2', agencyId: 'a1', name: 'Sarah Agent', email: 'sarah@eliterealty.com', role: 'agent', avatar: 'https://i.pravatar.cc/150?u=u2', status: 'Active' },
  { id: 'u3', agencyId: 'a1', name: 'James Agent', email: 'james@eliterealty.com', role: 'agent', avatar: 'https://i.pravatar.cc/150?u=u3', status: 'Active' },
  // Agency 2 Users
  { id: 'u4', agencyId: 'a2', name: 'Kim Director', email: 'kim@summit.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=u4', status: 'Active' },
  { id: 'u5', agencyId: 'a2', name: 'Leo Agent', email: 'leo@summit.com', role: 'agent', avatar: 'https://i.pravatar.cc/150?u=u5', status: 'Active' },
];

export const NAV_ITEMS = [
  { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'contacts' as AppView, label: 'Contacts', icon: Users },
  { id: 'pipeline' as AppView, label: 'Pipeline', icon: Layers },
  { id: 'offers' as AppView, label: 'Offers', icon: HandCoins },
  { id: 'tasks' as AppView, label: 'Tasks', icon: CheckSquare },
  { id: 'messaging' as AppView, label: 'Messaging', icon: MessageSquare },
  { id: 'admin' as AppView, label: 'Team Control', icon: ShieldCheck, roles: ['admin'] },
  { id: 'settings' as AppView, label: 'Settings', icon: Settings },
];
