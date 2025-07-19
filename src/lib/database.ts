
// NOTE: This service uses localStorage for simplicity in this prototype.
// In a real production application, this would be replaced with a proper
// database like Firestore, and these functions would become API calls.

import { QueueMember, User, Shift, ShiftChangeRequest, CompanySettings } from "./types";
import { services } from "./services";

interface Company {
  id: string;
  name: string;
  status: 'active' | 'trial' | 'inactive';
  users: number;
  plan: 'Enterprise' | 'Business' | 'Trial' | 'None';
}

const MOCK_CURRENT_USER: User = { id: 1, name: 'Admin User', role: 'admin' };
const initialUsers: User[] = [
    MOCK_CURRENT_USER,
    { id: 2, name: 'Dr. John Smith', role: 'staff' },
    { id: 3, name: 'Nurse Jane', role: 'supervisor' },
    { id: 4, name: 'Emily Clerk', role: 'staff' },
];

const initialShifts: Shift[] = [
    { id: 1, userId: 2, start: new Date('2024-08-01T09:00:00'), end: new Date('2024-08-01T17:00:00')},
    { id: 2, userId: 3, start: new Date('2024-08-01T10:00:00'), end: new Date('2024-08-01T18:00:00')},
    { id: 3, userId: 4, start: new Date('2024-08-01T09:00:00'), end: new Date('2024-08-01T17:00:00')},
];

const initialCompanySettings: CompanySettings = {
    name: 'GD Clinic',
    logoUrl: '/assets/logo.svg',
    primaryColor: '38 92% 50%',
};

const initialCompanies: Company[] = [
    { id: 'comp-001', name: 'Innovate Corp', status: 'active', users: 150, plan: 'Enterprise' },
    { id: 'comp-002', name: 'Solutions Inc.', status: 'active', users: 75, plan: 'Business' },
    { id: 'comp-003', name: 'Data Systems', status: 'trial', users: 10, plan: 'Trial' },
    { id: 'comp-004', name: 'NextGen Ventures', status: 'inactive', users: 0, plan: 'None' },
    { id: 'comp-005', name: 'Global Connect', status: 'active', users: 300, plan: 'Enterprise' },
];

const initialData: Record<string, any> = {
    'queue': [],
    'serviced': [],
    'ticketCounter': 111,
    'users': initialUsers,
    'shifts': initialShifts,
    'shiftRequests': [],
    'companySettings': initialCompanySettings,
    'companies': initialCompanies,
};

const initializeLocalStorage = () => {
    if (typeof window === 'undefined') return;
    for (const key in initialData) {
        if (localStorage.getItem(key) === null) {
            localStorage.setItem(key, JSON.stringify(initialData[key]));
        }
    }
};

initializeLocalStorage();

export const getData = <T>(key: string): T => {
    if (typeof window === 'undefined') {
        return initialData[key] as T;
    }
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialData[key];
};

export const setData = <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
};

// --- Specific Data Functions ---

// Queue
export const getQueue = (): QueueMember[] => getData<QueueMember[]>('queue');
export const updateQueue = (queue: QueueMember[]): void => setData('queue', queue);
export const getServiced = (): QueueMember[] => getData<QueueMember[]>('serviced');
export const addAllToServiced = (members: QueueMember[]): void => {
    const currentServiced = getServiced();
    setData('serviced', [...currentServiced, ...members]);
};
export const updateMemberFeedback = (memberId: number, feedback: any): void => {
    const allMembers = [...getQueue(), ...getServiced()];
    const member = allMembers.find(m => m.id === memberId);
    
    if (member) {
        member.feedback = feedback;
        
        let queueList = getQueue();
        const queueIndex = queueList.findIndex(q => q.id === memberId);
        if (queueIndex > -1) {
            queueList[queueIndex] = member;
            updateQueue(queueList);
        }

        let servicedList = getServiced();
        const servicedIndex = servicedList.findIndex(s => s.id === memberId);
        if (servicedIndex > -1) {
            servicedList[servicedIndex] = member;
            setData('serviced', servicedList);
        }
    }
};

export const resolveQueueMember = (memberId: number, notes: string): void => {
    const queue = getQueue();
    const member = queue.find(m => m.id === memberId);
    if (member) {
        const resolvedMember: QueueMember = {
            ...member,
            status: 'serviced',
            serviceNotes: notes,
        };
        const newServiced = [...getServiced(), resolvedMember];
        const newQueue = queue.filter(m => m.id !== memberId);
        setData('serviced', newServiced);
        setData('queue', newQueue);
    }
};

export const transferQueueMember = (memberId: number, targetStaffId: number): void => {
    const queue = getQueue();
    const updatedQueue = queue.map(m => m.id === memberId ? { ...m, assignedTo: targetStaffId } : m);
    updateQueue(updatedQueue);
};

// Users
export const getUsers = (): User[] => getData<User[]>('users');
export const addUser = (user: User): void => setData('users', [...getUsers(), user]);
export const updateUser = (user: User): void => setData('users', getUsers().map(u => u.id === user.id ? user : u));
export const deleteUser = (userId: number): void => setData('users', getUsers().filter(u => u.id !== userId));

// Shifts
export const getShifts = (): Shift[] => getData<Shift[]>('shifts');
export const addShift = (shift: Shift): void => setData('shifts', [...getShifts(), shift]);

// Shift Requests
export const getShiftRequests = (): ShiftChangeRequest[] => getData<ShiftChangeRequest[]>('shiftRequests');
export const addShiftRequest = (request: ShiftChangeRequest): void => setData('shiftRequests', [...getShiftRequests(), request]);
export const updateShiftRequestStatus = (requestId: number, status: 'approved' | 'denied'): ShiftChangeRequest | undefined => {
    const requests = getShiftRequests();
    let updatedRequest: ShiftChangeRequest | undefined;
    const updatedRequests = requests.map(req => {
        if (req.id === requestId) {
            updatedRequest = { ...req, status };
            return updatedRequest;
        }
        return req;
    });
    setData('shiftRequests', updatedRequests);
    return updatedRequest;
};

// Company Settings
export const getCompanySettings = (): CompanySettings => getData<CompanySettings>('companySettings');
export const setCompanySettings = (settings: CompanySettings): void => setData('companySettings', settings);

// Companies (for Super Admin)
export const getCompanies = (): Company[] => getData<Company[]>('companies');
export const addCompany = (company: Company): void => setData('companies', [...getCompanies(), company]);
