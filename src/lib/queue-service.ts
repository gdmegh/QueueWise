// NOTE: This service uses localStorage for simplicity in this prototype.
// In a real production application, this would be replaced with a proper
// database like Firestore, and these functions would become API calls.

import { QueueMember, SubService } from "./types";
import { services } from "./services";

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
}

const setLocalStorage = <T>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
}

// --- Public API for the Queue Service ---

/**
 * Creates an initial queue with sample data.
 * This is for demonstration purposes.
 */
export const createInitialQueue = (): QueueMember[] => {
    const now = new Date();
    const queue: QueueMember[] = [];
    
    // Distribute services to create a predictable queue for each counter
    const counterServices: { [key: string]: SubService[] } = {
        'Room 1': services.flatMap(s => s.subServices).filter(s => s.counter === 'Room 1'),
        'Room 2': services.flatMap(s => s.subServices).filter(s => s.counter === 'Room 2'),
        'Room 3': services.flatMap(s => s.subServices).filter(s => s.counter === 'Room 3'),
        'Room 4': services.flatMap(s => s.subServices).filter(s => s.counter === 'Room 4'),
        'Lab': services.flatMap(s => s.subServices).filter(s => s.counter === 'Lab'),
        'Imaging': services.flatMap(s => s.subServices).filter(s => s.counter === 'Imaging'),
        'Pharmacy Counter': services.flatMap(s => s.subServices).filter(s => s.counter === 'Pharmacy Counter'),
        'Room 5': services.flatMap(s => s.subServices).filter(s => s.counter === 'Room 5'),
    };
    
    const allCounters = ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Lab', 'Imaging', 'Pharmacy Counter'];


    for (let i = 0; i < 50; i++) {
        const checkInTime = new Date(now.getTime() - (50 - i) * 2 * 60000);
        
        // Assign customers to counters in a round-robin fashion for a distributed queue
        const counterName = allCounters[i % allCounters.length];
        const servicePool = counterServices[counterName as keyof typeof counterServices] || [];
        const assignedService = servicePool.length > 0 ? servicePool[Math.floor(Math.random() * servicePool.length)] : services[0].subServices[0];

        queue.push({
            id: Date.now() + i,
            ticketNumber: `A-${String(i + 1).padStart(3, '0')}`,
            name: `Patient ${i + 1}`,
            phone: `012345678${String(10 + i).padStart(2, '0')}`,
            checkInTime: checkInTime,
            // Estimate service time based on check-in + avg time. Actual start time will be later.
            estimatedServiceTime: new Date(checkInTime.getTime() + assignedService.avgTime * 60000),
            status: 'waiting',
            services: [assignedService],
        });
    }
    setLocalStorage('queue', queue);
    return queue;
};


/**
 * Fetches the entire current queue.
 */
export const getQueue = (): QueueMember[] => {
    let queue = getLocalStorage<QueueMember[]>('queue', []);
    if (queue.length === 0) {
        queue = createInitialQueue();
    }
    return queue;
}

/**
 * Fetches all serviced members.
 */
export const getServiced = (): QueueMember[] => {
    return getLocalStorage<QueueMember[]>('serviced', []);
}

/**
 * Updates the entire queue.
 * @param queue The new queue array.
 */
export const updateQueue = (queue: QueueMember[]): void => {
    setLocalStorage('queue', queue);
}

/**
 * Adds a list of members to the serviced list.
 * @param members The members to add.
 */
export const addAllToServiced = (members: QueueMember[]): void => {
    const currentServiced = getServiced();
    setLocalStorage('serviced', [...currentServiced, ...members]);
}

/**
 * Runs a simulation step to update the queue state.
 * - Moves completed customers from 'in-service' to the 'serviced' list.
 * - Fills empty counters with the next appropriate 'waiting' customer.
 */
export const runQueueSimulation = (): { updatedQueue: QueueMember[], newlyServiced: QueueMember[] } => {
    let queue = getQueue();
    const now = new Date();
    let newlyServiced: QueueMember[] = [];

    // 1. Check if any 'in-service' customers are done
    const remainingQueue = queue.filter(member => {
        if (member.status === 'in-service' && new Date(member.estimatedServiceTime) <= now) {
            newlyServiced.push({ ...member, status: 'serviced' });
            return false; // Remove from active queue
        }
        return true;
    });

    let updatedQueue = remainingQueue;
    
    // 2. Fill empty counters
    const servingCounters = updatedQueue
        .filter(m => m.status === 'in-service')
        .flatMap(m => m.services.map(s => s.counter).filter(Boolean) as string[]);
    
    const availableCounters = Array.from({length: 6}, (_, i) => `Room ${i+1}`)
        .filter(c => !servingCounters.includes(c));

    if (availableCounters.length > 0) {
        const waitingQueue = updatedQueue
            .filter(m => m.status === 'waiting')
            .sort((a,b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());
        
        const assignedMemberIds = new Set<number>();

        availableCounters.forEach(counterName => {
            const nextInLine = waitingQueue.find(member => 
                !assignedMemberIds.has(member.id) &&
                member.services.some(s => s.counter === counterName)
            );
            
            if (nextInLine) {
                assignedMemberIds.add(nextInLine.id);
                updatedQueue = updatedQueue.map(member => 
                    member.id === nextInLine.id 
                    ? { 
                        ...member, 
                        status: 'in-service',
                        // Assign actual counter and calculate estimated finish time
                        services: member.services.map(s => ({...s, counter: counterName})),
                        estimatedServiceTime: new Date(Date.now() + member.services.reduce((acc, s) => acc + s.avgTime, 0) * 60000)
                      } 
                    : member
                );
            }
        });
    }
    
    // Persist changes
    updateQueue(updatedQueue);
    if (newlyServiced.length > 0) {
        addAllToServiced(newlyServiced);
    }
    
    return { updatedQueue, newlyServiced };
}
