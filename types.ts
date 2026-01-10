
export type UserRole = 'admin' | 'agent' | 'team_member';
export type AgencyPlan = 'Basic' | 'Pro' | 'Enterprise';

export interface Agency {
  id: string;
  name: string;
  plan: AgencyPlan;
  logo?: string;
}

export interface User {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'Active' | 'Inactive';
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
}

export type ListingStatus = 'New' | 'Active' | 'Under Contract' | 'Sold';

export interface Listing {
  id: string;
  agencyId: string;
  address: string;
  sellerName: string;
  price: number;
  assignedAgent: string;
  status: ListingStatus;
  createdAt: string;
}

export type OfferStatus = 'Received' | 'Counter' | 'Accepted' | 'Rejected';

export interface Offer {
  id: string;
  agencyId: string;
  listingId: string;
  buyerName: string;
  price: number;
  financing: 'Cash' | 'Conventional' | 'FHA' | 'VA';
  closingDate: string;
  status: OfferStatus;
  assignedTo: string;
  createdAt: string;
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
  type: 'event' | 'audit';
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
