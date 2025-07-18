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
        name: 'Personal Banking',
        subServices: [
            {
                name: 'Account Services',
                avgTime: 10,
                counter: 'Counter 2',
                subServices: [
                    { name: 'Open New Account', avgTime: 15, counter: 'Counter 2' },
                    { name: 'Close Account', avgTime: 10, counter: 'Counter 2' },
                    { name: 'Account Maintenance', avgTime: 5, counter: 'Counter 1' },
                ]
            },
            {
                name: 'Card Services',
                avgTime: 8,
                counter: 'Counter 1',
                subServices: [
                    { name: 'Report Lost/Stolen Card', avgTime: 5, counter: 'Counter 1' },
                    { name: 'New Debit Card', avgTime: 7, counter: 'Counter 1' },
                    { name: 'Credit Card Inquiry', avgTime: 10, counter: 'Counter 4' },
                ]
            },
            {
                name: 'General Inquiry',
                avgTime: 5,
                counter: 'Counter 1',
                needsDescription: true,
            },
        ]
    },
    {
        name: 'Loans & Mortgages',
        subServices: [
            {
                name: 'Personal Loan',
                avgTime: 20,
                counter: 'Counter 4',
                needsDescription: true
            },
            {
                name: 'Mortgage Application',
                avgTime: 30,
                counter: 'Counter 4',
                needsDescription: true
            },
            {
                name: 'Loan Payment',
                avgTime: 5,
                counter: 'Counter 3'
            }
        ]
    },
    {
        name: 'Transactions',
        subServices: [
            {
                name: 'Deposit',
                avgTime: 3,
                counter: 'Counter 3'
            },
            {
                name: 'Withdrawal',
                avgTime: 3,
                counter: 'Counter 3'
            },
            {
                name: 'Wire Transfer',
                avgTime: 12,
                counter: 'Counter 3'
            }
        ]
    },
];

// Flat list for old parts of the app that might need it
export const flatServices: { name: string; avgTime: number; counter: string; }[] = [
    { name: 'General Inquiry', avgTime: 5, counter: 'Counter 1' },
    { name: 'New Account', avgTime: 15, counter: 'Counter 2' },
    { name: 'Deposit/Withdrawal', avgTime: 3, counter: 'Counter 3' },
    { name: 'Loan Application', avgTime: 20, counter: 'Counter 4' },
]
