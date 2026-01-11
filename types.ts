
export type UserRole = 'admin' | 'agent' | 'team_member';
export type AgencyPlan = 'Basic' | 'Pro' | 'Enterprise';

export interface Agency {
  id: string;
  name: string;
  plan: AgencyPlan;
  logo?: string;
  aiCredits: number;
  aiLimits: number;
}

export interface User {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'Active' | 'Inactive';
  aiUsage: number;
}

export interface Contact {
  id: string;
  agencyId: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  notes: string;
  assignedTo: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export type ListingStatus = 'New' | 'Active' | 'Under Contract' | 'Sold';

export interface AIScore {
  score: number;
  explanation: string;
  risks: string[];
  urgency: 'Low' | 'Medium' | 'High';
  lastUpdated: string;
}

export interface Listing {
  id: string;
  agencyId: string;
  address: string;
  sellerName: string;
  price: number;
  assignedAgent: string;
  status: ListingStatus;
  createdAt: string;
  notes?: string;
  aiScore?: AIScore;
  metadata?: Record<string, string>;
}

// Updated Status for the requested Negotiation Pipeline
export type OfferStatus = 'Draft' | 'Offer Sent' | 'In Talks' | 'Offer Accepted' | 'Offer Declined';

export interface Offer {
  id: string;
  agencyId: string;
  listingId: string;
  buyerName: string;
  price: number;
  downPayment: number;
  earnestMoney: number;
  financing: 'Cash' | 'Conventional' | 'FHA' | 'VA';
  inspectionPeriod: number; // Days
  contingencies: string[];
  closingDate: string;
  status: OfferStatus;
  assignedTo: string;
  createdAt: string;
  aiSummary?: string;
}

export type TaskStatus = 'Pending' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  agencyId: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  relatedTo?: {
    type: 'contact' | 'listing' | 'offer';
    id: string;
    label: string;
  };
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Thread {
  id: string;
  agencyId: string;
  title: string;
  type: 'general' | 'listing' | 'offer';
  relatedId?: string;
  messages: Message[];
}

export interface Activity {
  id: string;
  agencyId: string;
  userId: string;
  action: string;
  target: string;
  type: 'event' | 'audit' | 'ai';
  timestamp: string;
}

export interface Notification {
  id: string;
  agencyId: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export type AppView = 'dashboard' | 'contacts' | 'pipeline' | 'offers' | 'tasks' | 'messaging' | 'admin' | 'settings';
