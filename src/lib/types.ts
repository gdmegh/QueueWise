import { SubService as ImportedSubService } from "./services";

// Renaming for clarity in this file
type ServiceTemplate = ImportedSubService;

export interface Service extends ServiceTemplate {
  status: 'pending' | 'in-progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
}

export interface QueueMember {
  id: number;
  ticketNumber: string;
  name: string;
  phone: string;
  checkInTime: Date;
  status: 'waiting' | 'in-service' | 'serviced';
  services: Service[]; // This now uses the extended Service type
  assignedTo?: number; // Staff user ID
  serviceNotes?: string;
  feedback?: {
    rating: "excellent" | "good" | "fair" | "poor";
    comments?: string;
  }
}

export interface AnalyticsData {
  totalWaiting: number;
  maxWaitTime: number;
  averageServiceTime: number;
  servicedCount: number;
  feedbackReceived: number;
}

export type UserRole = 'admin' | 'supervisor' | 'staff';

export interface User {
  id: number;
  name: string;
  role: UserRole;
}

export interface Shift {
  id: number;
  userId: number;
  start: Date;
  end: Date;
}

export interface ShiftChangeRequest {
  id: number;
  userId: number;
  requesterName: string;
  requestedStart: Date;
  requestedEnd: Date;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface CompanySettings {
  name: string;
  logoUrl: string;
  primaryColor: string; // HSL format e.g. "220 14% 10%"
}
