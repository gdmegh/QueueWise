// NOTE: This service uses localStorage for simplicity in this prototype.
// In a real production application, this would be replaced with a proper
// database like Firestore, and these functions would become API calls.

import { QueueMember, Service } from "./types";
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
    
    const allServices = services.flatMap(cat => 
        cat.subServices.flatMap(sub => 
            sub.subServices ? sub.subServices : sub
        )
    );

    for (let i = 0; i < 20; i++) {
        const checkInTime = new Date(now.getTime() - (20 - i) * 3 * 60000); // 3 mins per person stagger
        
        // Give 1 or 2 services to each person
        const serviceCount = Math.random() > 0.6 ? 2 : 1;
        const assignedServices: Service[] = [];
        const usedIndexes = new Set<number>();

        for (let j = 0; j < serviceCount; j++) {
            let serviceIndex;
            do {
                serviceIndex = Math.floor(Math.random() * allServices.length);
            } while (usedIndexes.has(serviceIndex));
            usedIndexes.add(serviceIndex);

            const serviceTemplate = allServices[serviceIndex];
            assignedServices.push({
                ...serviceTemplate,
                status: 'pending', // All services start as pending
                startTime: undefined,
                endTime: undefined,
            });
        }
        
        // Overall status is 'waiting' until first service starts
        queue.push({
            id: Date.now() + i,
            ticketNumber: `A-${String(i + 101).padStart(3, '0')}`,
            name: `Patient ${i + 101}`,
            phone: `012345678${String(10 + i).padStart(2, '0')}`,
            checkInTime: checkInTime,
            status: 'waiting',
            services: assignedServices,
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
 */
export const runQueueSimulation = (): { updatedQueue: QueueMember[], newlyServiced: QueueMember[] } => {
    let queue = getQueue();
    const now = new Date();
    let newlyServiced: QueueMember[] = [];

    // 1. Mark completed services and update member status
    queue.forEach(member => {
        if (member.status === 'in-service') {
            let allServicesDone = true;
            member.services.forEach(service => {
                if (service.status === 'in-progress' && service.endTime && new Date(service.endTime) <= now) {
                    service.status = 'completed';
                }
                if (service.status !== 'completed') {
                    allServicesDone = false;
                }
            });

            if (allServicesDone) {
                member.status = 'serviced';
            } else {
                 // Check if there are no more 'in-progress' services, but some are still pending.
                 const hasInProgress = member.services.some(s => s.status === 'in-progress');
                 if (!hasInProgress) {
                     member.status = 'waiting'; // Waiting for the next service
                 }
            }
        }
    });

    const activeQueue = queue.filter(member => {
        if (member.status === 'serviced') {
            newlyServiced.push(member);
            return false;
        }
        return true;
    });

    // 2. Assign new services to available counters
    const servingCounters = new Set(
        activeQueue.flatMap(m => m.services)
            .filter(s => s.status === 'in-progress')
            .map(s => s.counter)
    );

    const waitingMembers = activeQueue
        .filter(m => m.status === 'waiting')
        .sort((a,b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());
    
    for (const member of waitingMembers) {
        const nextService = member.services.find(s => s.status === 'pending');
        if (nextService && !servingCounters.has(nextService.counter)) {
            // Assign this service
            nextService.status = 'in-progress';
            nextService.startTime = new Date();
            nextService.endTime = new Date(Date.now() + nextService.avgTime * 60000);
            
            member.status = 'in-service';
            servingCounters.add(nextService.counter);
        }
    }
    
    updateQueue(activeQueue);
    if (newlyServiced.length > 0) {
        addAllToServiced(newlyServiced);
    }
    
    return { updatedQueue: activeQueue, newlyServiced };
}
