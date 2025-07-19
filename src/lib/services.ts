
export interface SubService {
    name: string;
    avgTime: number; // in minutes
    counter: string;
    subServices?: SubService[];
    needsDescription?: boolean;
}

export interface ServiceCategory {
    name: string;
    subServices: SubService[];
}

export const services: ServiceCategory[] = [
    {
        name: 'Consultation',
        subServices: [
            {
                name: 'General Physician',
                avgTime: 15,
                counter: 'Room 1',
                needsDescription: true,
            },
            {
                name: 'Specialist Consultation',
                avgTime: 25,
                counter: 'Room 2',
                subServices: [
                    { name: 'Cardiology', avgTime: 25, counter: 'Room 2' },
                    { name: 'Dermatology', avgTime: 20, counter: 'Room 3' },
                    { name: 'Pediatrics', avgTime: 15, counter: 'Room 4' },
                ]
            }
        ]
    },
    {
        name: 'Diagnostics',
        subServices: [
            {
                name: 'Blood Test',
                avgTime: 10,
                counter: 'Lab'
            },
            {
                name: 'X-Ray',
                avgTime: 15,
                counter: 'Imaging'
            },
            {
                name: 'Ultrasound',
                avgTime: 20,
                counter: 'Imaging'
            }
        ]
    },
    {
        name: 'Pharmacy',
        subServices: [
            {
                name: 'Prescription Pickup',
                avgTime: 5,
                counter: 'Pharmacy Counter'
            },
            {
                name: 'Over-the-counter',
                avgTime: 3,
                counter: 'Pharmacy Counter'
            }
        ]
    },
    {
        name: 'General Check-up',
        subServices: [
            {
                name: 'Annual Physical',
                avgTime: 30,
                counter: 'Room 1'
            },
            {
                name: 'Vaccination',
                avgTime: 10,
                counter: 'Room 5'
            }
        ]
    },
];

// Flat list for old parts of the app that might need it
export const flatServices: { name: string; avgTime: number; counter: string; }[] = [
    { name: 'General Physician', avgTime: 15, counter: 'Room 1' },
    { name: 'Blood Test', avgTime: 10, counter: 'Lab' },
    { name: 'Prescription Pickup', avgTime: 5, counter: 'Pharmacy Counter' },
    { name: 'Vaccination', avgTime: 10, counter: 'Room 5' },
]
