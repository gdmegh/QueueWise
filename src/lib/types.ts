export interface QueueMember {
  id: number;
  ticketNumber: string;
  name: string;
  phone: string;
  checkInTime: Date;
  estimatedServiceTime: Date;
  status: 'waiting' | 'in-service' | 'serviced';
  service: string;
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
