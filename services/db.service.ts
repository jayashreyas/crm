import { Contact, Listing, Task, User, Offer, Thread, Activity, Notification, ListingStatus, OfferStatus } from '../types';
import { supabase } from './supabaseClient';

class DBService {

  // --- MAPPERS (Snake Case <-> Camel Case) ---

  private mapToContact(row: any): Contact {
    return {
      id: row.id,
      agencyId: row.agency_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      tags: row.tags || [],
      notes: row.notes,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      metadata: row.metadata || {}
    };
  }

  private mapFromContact(c: Contact): any {
    return {
      id: c.id,
      agency_id: c.agencyId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      tags: c.tags,
      notes: c.notes,
      assigned_to: c.assignedTo,
      created_at: c.createdAt,
      metadata: c.metadata
    };
  }

  private mapToListing(row: any): Listing {
    return {
      id: row.id,
      agencyId: row.agency_id,
      address: row.address,
      sellerName: row.seller_name,
      price: row.price,
      assignedAgent: row.assigned_agent,
      status: row.status as ListingStatus,
      createdAt: row.created_at,
      notes: row.notes,
      metadata: row.metadata || {}
    };
  }

  private mapFromListing(l: Listing): any {
    return {
      id: l.id,
      agency_id: l.agencyId,
      address: l.address,
      seller_name: l.sellerName,
      price: l.price,
      assigned_agent: l.assignedAgent,
      status: l.status,
      created_at: l.createdAt,
      notes: l.notes,
      metadata: l.metadata
    };
  }

  private mapToOffer(row: any): Offer {
    // 1. Try DB metadata column
    let meta = row.metadata || {};

    // 2. Fallback to LocalStorage (Agency Persistence Layer for Legacy DBs)
    if (typeof window !== 'undefined') {
      const localMeta = localStorage.getItem(`crm_offer_meta_${row.id}`);
      if (localMeta) {
        try {
          const parsed = JSON.parse(localMeta);
          meta = { ...meta, ...parsed };
        } catch (e) { console.warn("Failed to parse local metadata", e); }
      }
    }

    return {
      id: row.id,
      listingId: row.listing_id,
      buyerName: row.buyer_name,
      amount: row.amount,
      status: row.status as OfferStatus,
      // Core fields from DB, fallback to metadata (local or DB)
      agencyId: 'admin',
      price: row.amount,
      downPayment: meta.downPayment || 0,
      earnestMoney: meta.earnestMoney || 0,
      financing: meta.financing || 'Cash',
      inspectionPeriod: meta.inspectionPeriod || 0,
      contingencies: meta.contingencies || [],
      closingDate: meta.closingDate || '',
      assignedTo: meta.assignedTo || '',
      createdAt: row.created_at,
      metadata: meta
    } as Offer;
  }



  private mapToUser(row: any): User {
    return {
      id: row.id,
      agencyId: row.agency_id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar: row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=random`,
      status: row.status || 'Active',
      aiUsage: row.ai_usage || 0
    };
  }

  private mapFromUser(u: User): any {
    return {
      id: u.id,
      agency_id: u.agencyId,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      // status: u.status, // Removed - column doesn't exist in Supabase
      // ai_usage: u.aiUsage // Optional: Add if column exists
    };
  }

  // USERS (Team Management)
  async getUsers(agencyId: string): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').eq('agency_id', agencyId);
    if (error) console.error("Error fetching users:", error);
    return (data || []).map(this.mapToUser);
  }

  async saveUser(user: User): Promise<void> {
    const row = this.mapFromUser(user);
    const { error } = await supabase.from('users').upsert(row);
    if (error) console.error("Error saving user:", error);
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error finding user by email:", error);
    }
    return data ? this.mapToUser(data) : null;
  }

  // AI & BILLING
  async consumeCredits(agencyId: string, userId: string, amount: number = 1): Promise<boolean> {
    return true;
  }

  // ACTIVITY
  async logActivity(agencyId: string, userId: string, action: string, target: string, type: 'event' | 'audit' | 'ai' = 'event'): Promise<void> {
    await supabase.from('activities').insert({
      id: `act-${Date.now()}`,
      agency_id: agencyId,
      user_id: userId,
      action,
      target,
      type,
      timestamp: new Date().toISOString()
    });
  }

  async getActivity(agencyId: string): Promise<Activity[]> {
    const { data } = await supabase.from('activities').select('*').eq('agency_id', agencyId).order('timestamp', { ascending: false }).limit(50);
    return (data || []).map((row: any) => ({
      id: row.id,
      agencyId: row.agency_id,
      userId: row.user_id,
      action: row.action,
      target: row.target,
      type: row.type,
      timestamp: row.timestamp
    }));
  }

  // NOTIFICATIONS 
  async getNotifications(agencyId: string, userId: string): Promise<Notification[]> {
    return [];
  }
  async pushNotification(agencyId: string, userId: string, title: string, message: string): Promise<void> { }

  // CONTACTS
  async getContacts(agencyId: string, role: string, userId: string): Promise<Contact[]> {
    let query = supabase.from('contacts').select('*').eq('agency_id', agencyId);
    if (role !== 'admin') {
      query = query.eq('assigned_to', userId);
    }
    const { data, error } = await query;
    if (error) console.error(error);
    return (data || []).map(this.mapToContact);
  }

  async saveContact(contact: Contact): Promise<void> {
    const row = this.mapFromContact(contact);
    const { error } = await supabase.from('contacts').upsert(row);
    if (error) console.error(error);
  }

  async deleteContacts(ids: string[]): Promise<void> {
    const BATCH_SIZE = 20;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('contacts').delete().in('id', batch);
      if (error) {
        console.error("Error deleting contacts batch:", error);
        throw error;
      }
    }
  }

  // LISTINGS
  async getListings(agencyId: string, role: string, userId: string): Promise<Listing[]> {
    const { data, error } = await supabase.from('listings').select('*').eq('agency_id', agencyId);
    if (error) console.error(error);
    return (data || []).map(this.mapToListing);
  }

  async saveListing(listing: Listing): Promise<void> {
    const row = this.mapFromListing(listing);
    const { error } = await supabase.from('listings').upsert(row);
    if (error) console.error(error);
  }

  async deleteListings(ids: string[]): Promise<void> {
    const BATCH_SIZE = 20;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('listings').delete().in('id', batch);
      if (error) {
        console.error("Error deleting listings batch:", error);
        throw error;
      }
    }
  }

  async updateListingStatus(id: string, agencyId: string, status: ListingStatus, userId: string): Promise<void> {
    await supabase.from('listings').update({ status }).eq('id', id);
  }



  // OFFERS
  async getOffers(agencyId: string, role: string, userId: string): Promise<Offer[]> {
    const { data } = await supabase.from('offers').select('*');
    return (data || []).map(this.mapToOffer);
  }

  async saveOffer(offer: Offer, userId: string): Promise<void> {
    // 1. Prepare Metadata (Extended Fields)
    const metadata = {
      ...(offer.metadata || {}),
      earnestMoney: offer.earnestMoney,
      downPayment: offer.downPayment,
      financing: offer.financing,
      inspectionPeriod: offer.inspectionPeriod,
      contingencies: offer.contingencies,
      closingDate: offer.closingDate,
      assignedTo: offer.assignedTo,
    };

    // 2. Save Metadata to LocalStorage (Bypass Schema Limits)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`crm_offer_meta_${offer.id}`, JSON.stringify(metadata));
    }

    // 3. Save Core Fields to Database (Schema Compliant)
    const row = {
      id: offer.id,
      listing_id: offer.listingId || null,
      buyer_name: offer.buyerName,
      amount: offer.price,
      status: offer.status,
      created_at: offer.createdAt,
      // metadata stripped to avoid schema error
    };
    const { error } = await supabase.from('offers').upsert(row);
    if (error) {
      console.error("Error saving offer:", error);
      throw error;
    }
  }

  async updateOfferSummary(id: string, summary: string): Promise<void> {
    // no-op for now
  }

  async deleteOffers(ids: string[]): Promise<void> {
    const BATCH_SIZE = 20;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('offers').delete().in('id', batch);
      if (error) {
        console.error("Error deleting offers batch:", error);
        throw error;
      }
    }
  }

  // TASKS
  async getTasks(agencyId: string, role: string, userId: string): Promise<Task[]> {
    const { data } = await supabase.from('tasks').select('*').eq('agency_id', agencyId);
    return (data || []).map((row: any) => ({
      id: row.id,
      agencyId: row.agency_id,
      title: row.title,
      assignedTo: row.assigned_to,
      dueDate: row.due_date,
      status: row.status,
      priority: row.priority || 'Medium',
      createdAt: row.created_at
    }));
  }

  async saveTask(task: Task): Promise<void> {
    const row = {
      id: task.id,
      agency_id: task.agencyId,
      title: task.title,
      assigned_to: task.assignedTo,
      due_date: task.dueDate,
      status: task.status,
      priority: task.priority,
      created_at: task.createdAt
    };
    await supabase.from('tasks').upsert(row);
  }

  async deleteTasks(ids: string[]): Promise<void> {
    await supabase.from('tasks').delete().in('id', ids);
  }

  async toggleTaskStatus(task: Task, agencyId: string): Promise<void> {
    // We accept Task object now to know current status
    const newStatus = task.status === 'Pending' ? 'Done' : 'Pending';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  }

  // THREADS
  async getThreads(agencyId: string): Promise<Thread[]> {
    return [];
  }
  async saveThread(thread: Thread): Promise<void> { }

  // SEED
  async seed(users: User[]): Promise<void> {
    // No-op for cloud
  }
}

export const db = new DBService();
