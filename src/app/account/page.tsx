'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { QueueMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Ticket, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


// Mock logged-in user data - in a real app this would come from an auth context
const MOCK_REGISTERED_USER = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '09876543210'
};

const MAX_QUEUE_SIZE = 20;

export default function AccountPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [serviced, setServiced] = useLocalStorage<QueueMember[]>('serviced', []);
    const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', []);
    const [ticketCounter, setTicketCounter] = useLocalStorage('ticketCounter', 111);

    // Filter history for the mock user
    const userHistory = serviced.filter(item => item.phone === MOCK_REGISTERED_USER.phone);

    const handleNewCheckin = () => {
        if (queue.filter(q => q.status === 'waiting').length >= MAX_QUEUE_SIZE) {
            toast({
                title: "Queue is full",
                description: "We're sorry, the queue is currently full. Please try again later.",
                variant: 'destructive',
            });
            return;
        }

        const newMember: QueueMember = {
            id: Date.now(),
            ticketNumber: `A-${String(ticketCounter).padStart(3, '0')}`,
            name: MOCK_REGISTERED_USER.name,
            phone: MOCK_REGISTERED_USER.phone,
            checkInTime: new Date(),
            status: 'waiting',
            services: [],
            estimatedServiceTime: new Date(), // Placeholder
        };

        setTicketCounter(prev => prev + 1);
        setQueue(prev => [...prev, newMember]);
        
        toast({
            title: `Welcome back, ${newMember.name}!`,
            description: `Your ticket is ${newMember.ticketNumber}. Please select your services.`
        });

        router.push(`/service?ticketNumber=${newMember.ticketNumber}`);
    }

    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                        <CardHeader className="items-center text-center">
                            <UserCircle className="h-16 w-16 text-primary" />
                            <CardTitle className="text-2xl">{MOCK_REGISTERED_USER.name}</CardTitle>
                            <CardDescription>{MOCK_REGISTERED_USER.email}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleNewCheckin} className="w-full">
                                <Ticket className="mr-2" /> Join Queue
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Visit History</CardTitle>
                            <CardDescription>Review your past services and feedback.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Ticket</TableHead>
                                        <TableHead>Services</TableHead>
                                        <TableHead>Feedback</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userHistory.length > 0 ? userHistory.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{format(new Date(item.checkInTime), 'PP')}</TableCell>
                                            <TableCell><Badge variant="secondary">{item.ticketNumber}</Badge></TableCell>
                                            <TableCell>{item.services.map(s => s.name).join(', ')}</TableCell>
                                            <TableCell>
                                                {item.feedback ? (
                                                    <div className="flex items-center gap-1 capitalize text-green-400">
                                                        <CheckCircle className="h-4 w-4"/> {item.feedback.rating}
                                                    </div>
                                                ) : (
                                                     <span className="text-muted-foreground">Not provided</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                You have no past visits.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    )
}
