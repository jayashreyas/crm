
import { Contact, Listing, Task, User, Offer, Thread, Activity, Notification, ListingStatus, OfferStatus } from '../types';

const STORAGE_KEYS = {
  CONTACTS: 'ep_contacts',
  LISTINGS: 'ep_listings',
  TASKS: 'ep_tasks',
  OFFERS: 'ep_offers',
  THREADS: 'ep_threads',
  ACTIVITY: 'ep_activity',
  NOTIFS: 'ep_notifs'
};

class DBService {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ACTIVITY
  logActivity(agencyId: string, userId: string, action: string, target: string, type: 'event' | 'audit' = 'event'): void {
    const all = this.get<Activity>(STORAGE_KEYS.ACTIVITY);
    all.unshift({
      id: `act-${Date.now()}`,
      agencyId,
      userId,
      action,
      target,
      type,
      timestamp: new Date().toISOString()
    });
    this.set(STORAGE_KEYS.ACTIVITY, all.slice(0, 200));
  }

  getActivity(agencyId: string): Activity[] {
    return this.get<Activity>(STORAGE_KEYS.ACTIVITY).filter(a => a.agencyId === agencyId);
  }

  // NOTIFICATIONS
  getNotifications(agencyId: string, userId: string): Notification[] {
    return this.get<Notification>(STORAGE_KEYS.NOTIFS).filter(n => n.agencyId === agencyId && n.userId === userId);
  }

  pushNotification(agencyId: string, userId: string, title: string, message: string): void {
    const all = this.get<Notification>(STORAGE_KEYS.NOTIFS);
    all.unshift({
      id: `nt-${Date.now()}`,
      agencyId,
      userId,
      title,
      message,
      read: false,
      timestamp: new Date().toISOString()
    });
    this.set(STORAGE_KEYS.NOTIFS, all.slice(0, 100));
  }

  // CONTACTS (SaaS Scoped)
  getContacts(agencyId: string, role: string, userId: string): Contact[] {
    const all = this.get<Contact>(STORAGE_KEYS.CONTACTS).filter(c => c.agencyId === agencyId);
    if (role === 'admin') return all;
    return all.filter(c => c.assignedTo === userId);
  }

  saveContact(contact: Contact): void {
    const all = this.get<Contact>(STORAGE_KEYS.CONTACTS);
    const index = all.findIndex(c => c.id === contact.id);
    if (index > -1) all[index] = contact;
    else all.push(contact);
    this.set(STORAGE_KEYS.CONTACTS, all);
  }

  // LISTINGS (SaaS Scoped)
  getListings(agencyId: string, role: string, userId: string): Listing[] {
    const all = this.get<Listing>(STORAGE_KEYS.LISTINGS).filter(l => l.agencyId === agencyId);
    if (role === 'admin') return all;
    return all.filter(l => l.assignedAgent === userId);
  }

  updateListingStatus(id: string, agencyId: string, status: ListingStatus, userId: string): void {
    const all = this.get<Listing>(STORAGE_KEYS.LISTINGS);
    const item = all.find(l => l.id === id && l.agencyId === agencyId);
    if (item) {
      const oldStatus = item.status;
      item.status = status;
      this.set(STORAGE_KEYS.LISTINGS, all);
      this.logActivity(agencyId, userId, `changed listing status from ${oldStatus} to ${status}`, item.address);
      this.pushNotification(agencyId, item.assignedAgent, 'Listing Update', `The status for ${item.address} is now ${status}`);
    }
  }

  // OFFERS (SaaS Scoped)
  getOffers(agencyId: string, role: string, userId: string): Offer[] {
    const all = this.get<Offer>(STORAGE_KEYS.OFFERS).filter(o => o.agencyId === agencyId);
    if (role === 'admin') return all;
    return all.filter(o => o.assignedTo === userId);
  }

  saveOffer(offer: Offer, userId: string): void {
    const all = this.get<Offer>(STORAGE_KEYS.OFFERS);
    const index = all.findIndex(o => o.id === offer.id);
    if (index > -1) {
      all[index] = offer;
    } else {
      all.push(offer);
      this.logActivity(offer.agencyId, userId, 'received new offer for', offer.buyerName);
    }
    this.set(STORAGE_KEYS.OFFERS, all);
  }

  // MESSAGING (SaaS Scoped)
  getThreads(agencyId: string): Thread[] {
    return this.get<Thread>(STORAGE_KEYS.THREADS).filter(t => t.agencyId === agencyId);
  }

  saveThread(thread: Thread): void {
    const all = this.get<Thread>(STORAGE_KEYS.THREADS);
    const index = all.findIndex(t => t.id === thread.id);
    if (index > -1) all[index] = thread;
    else all.push(thread);
    this.set(STORAGE_KEYS.THREADS, all);
  }

  // TASKS (SaaS Scoped)
  getTasks(agencyId: string, role: string, userId: string): Task[] {
    const all = this.get<Task>(STORAGE_KEYS.TASKS).filter(t => t.agencyId === agencyId);
    if (role === 'admin') return all;
    return all.filter(t => t.assignedTo === userId);
  }

  saveTask(task: Task): void {
    const all = this.get<Task>(STORAGE_KEYS.TASKS);
    const index = all.findIndex(t => t.id === task.id);
    if (index > -1) all[index] = task;
    else all.push(task);
    this.set(STORAGE_KEYS.TASKS, all);
  }

  toggleTaskStatus(id: string, agencyId: string): void {
    const all = this.get<Task>(STORAGE_KEYS.TASKS);
    const task = all.find(t => t.id === id && t.agencyId === agencyId);
    if (task) {
      task.status = task.status === 'Pending' ? 'Done' : 'Pending';
      this.set(STORAGE_KEYS.TASKS, all);
    }
  }

  seed(users: User[]) {
    const agency1 = users.filter(u => u.agencyId === 'a1');
    const agency2 = users.filter(u => u.agencyId === 'a2');

    if (this.get(STORAGE_KEYS.LISTINGS).length === 0) {
      this.set(STORAGE_KEYS.LISTINGS, [
        { id: 'l1', agencyId: 'a1', address: '123 Oak St, Springfield', sellerName: 'Robert Paulson', price: 450000, assignedAgent: agency1[1].id, status: 'Active', createdAt: new Date().toISOString() },
        { id: 'l2', agencyId: 'a1', address: '456 Maple Ave, Springfield', sellerName: 'Alice Green', price: 620000, assignedAgent: agency1[2].id, status: 'New', createdAt: new Date().toISOString() },
        { id: 'l3', agencyId: 'a2', address: '999 Peak View, Ridge', sellerName: 'Victor Summit', price: 2100000, assignedAgent: agency2[1].id, status: 'Active', createdAt: new Date().toISOString() }
      ]);
    }
    if (this.get(STORAGE_KEYS.THREADS).length === 0) {
      this.set(STORAGE_KEYS.THREADS, [
        { id: 'gen-a1', agencyId: 'a1', title: 'Elite HQ', type: 'general', messages: [{ id: 'm1', senderId: agency1[0].id, text: 'Elite Realty Channel active.', timestamp: new Date().toISOString() }] },
        { id: 'gen-a2', agencyId: 'a2', title: 'Summit Lounge', type: 'general', messages: [{ id: 'm2', senderId: agency2[0].id, text: 'Summit properties comms up.', timestamp: new Date().toISOString() }] }
      ]);
    }
  }
}

export const db = new DBService();
