
'use client';

import { useState, useEffect } from 'react';
import { QueueMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Ticket, CheckCircle, Edit, Feather, HeartPulse } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FeedbackForm } from '@/components/forms/FeedbackForm';
import { Textarea } from '@/components/ui/textarea';

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
    const [userHistory, setUserHistory] = useState<QueueMember[]>([]);
    const [queue, setQueue] = useState<QueueMember[]>([]);
    const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedMemberForFeedback, setSelectedMemberForFeedback] = useState<QueueMember | null>(null);

    const refreshData = () => {
        const serviced = db.getData<QueueMember[]>('serviced');
        const currentQueue = db.getData<QueueMember[]>('queue');
        setUserHistory(serviced.filter(item => item.phone === MOCK_REGISTERED_USER.phone).sort((a,b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()));
        setQueue(currentQueue);
    }
    
    useEffect(() => {
        refreshData();
    }, []);

    const handleNewCheckin = () => {
        const waitingQueue = queue.filter(q => q.status === 'waiting').length;
        if (waitingQueue >= MAX_QUEUE_SIZE) {
            toast({
                title: "Queue is full",
                description: "We're sorry, the queue is currently full. Please try again later.",
                variant: 'destructive',
            });
            return;
        }

        const ticketCounter = db.getData<number>('ticketCounter');
        
        const newMember: QueueMember = {
            id: Date.now(),
            ticketNumber: `A-${String(ticketCounter).padStart(3, '0')}`,
            name: MOCK_REGISTERED_USER.name,
            phone: MOCK_REGISTERED_USER.phone,
            checkInTime: new Date(),
            status: 'waiting',
            services: [],
        };
        
        db.setData('ticketCounter', ticketCounter + 1);
        const newQueue = [...queue, newMember];
        db.setData('queue', newQueue);
        setQueue(newQueue);
        
        toast({
            title: `Welcome back, ${newMember.name}!`,
            description: `Your ticket is ${newMember.ticketNumber}. Please select your services.`
        });

        router.push(`/service?ticketNumber=${newMember.ticketNumber}`);
    }

    const handleOpenFeedback = (member: QueueMember) => {
        setSelectedMemberForFeedback(member);
        setFeedbackModalOpen(true);
    };

    const handleFeedbackSubmit = (memberId: number, feedback: any) => {
        db.updateMemberFeedback(memberId, feedback);
        refreshData();
        setFeedbackModalOpen(false);
        toast({ title: "Thank you!", description: "Your feedback has been submitted successfully." });
    };

    const handleHealthInfoSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const healthInfo = formData.get('healthInfo');
        
        // In a real app, you would save this to the user's profile in the database.
        console.log("Health info submitted:", healthInfo);

        toast({
            title: "Health Profile Updated",
            description: "Thank you for providing your information. We will use this to provide better recommendations.",
        });
    }

    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-8">
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
                    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><HeartPulse/> My Health Profile</CardTitle>
                            <CardDescription>Provide information for better service recommendations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleHealthInfoSubmit} className="space-y-4">
                                <Textarea 
                                    name="healthInfo"
                                    placeholder="e.g., I have a history of high blood pressure, I am allergic to penicillin, I visit for regular check-ups..." 
                                    rows={5}
                                />
                                <Button type="submit" className="w-full">Save Information</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Visit History</CardTitle>
                            <CardDescription>Review your past services and provide feedback.</CardDescription>
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
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenFeedback(item)}>
                                                        <Feather className="mr-2 h-3 w-3" /> Provide
                                                    </Button>
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

            <Dialog open={isFeedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Provide Feedback for ticket {selectedMemberForFeedback?.ticketNumber}</DialogTitle>
                    </DialogHeader>
                    {selectedMemberForFeedback && (
                        <FeedbackForm member={selectedMemberForFeedback} onSubmitFeedback={handleFeedbackSubmit} />
                    )}
                </DialogContent>
            </Dialog>
        </main>
    )
}
