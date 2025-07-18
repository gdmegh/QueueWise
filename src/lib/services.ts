export interface Service {
    name: string;
    avgTime: number; // in minutes
    counter: string;
}

export const services: Service[] = [
    { name: 'General Inquiry', avgTime: 5, counter: 'Counter 1' },
    { name: 'New Account', avgTime: 15, counter: 'Counter 2' },
    { name: 'Deposit/Withdrawal', avgTime: 3, counter: 'Counter 3' },
    { name: 'Loan Application', avgTime: 20, counter: 'Counter 2' },
]
