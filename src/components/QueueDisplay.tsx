import type { FC } from 'react';
import { format } from 'date-fns';
import { Bell, Users, List, Banknote, UserPlus, HandCoins, Edit, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { QueueMember } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { services } from '@/lib/services';
import { Button } from './ui/button';
import { FeedbackForm } from './FeedbackForm';


interface QueueDisplayProps {
  queue: QueueMember[];
  onEditService: (memberId: number) => void;
  onSetFeedback: (memberId: number, feedback: any) => void;
}

const serviceDetails: { [key: string]: { icon: React.ReactNode; counter: string } } = services.flatMap(cat => cat.subServices).reduce((acc, service) => {
    const icons: { [key: string]: React.ReactNode } = {
        'General Inquiry': <List className="h-4 w-4" />,
        'Account Services': <UserPlus className="h-4 w-4" />,
        'Card Services': <Banknote className="h-4 w-4" />,
        'Personal Loan': <HandCoins className="h-4 w-4" />,
        'Mortgage Application': <HandCoins className="h-4 w-4" />,
        'Loan Payment': <HandCoins className="h-4 w-4" />,
        'Deposit': <Banknote className="h-4 w-4" />,
        'Withdrawal': <Banknote className="h-4 w-4" />,
        'Wire Transfer': <Banknote className="h-4 w-4" />,
        'Pending': <List className="h-4 w-4" />,
    };

    const addService = (s: any) => {
        if (s && s.name && !acc[s.name]) {
            acc[s.name] = { icon: icons[s.name] || <List className="h-4 w-4" />, counter: s.counter };
        }
        if (s && s.subServices) {
            s.subServices.forEach(addService);
        }
    };

    addService(service);
    return acc;
}, {} as { [key: string]: { icon: React.ReactNode; counter: string } });


const NowServing: FC<{ members: QueueMember[], onSetFeedback: (memberId: number, feedback: any) => void }> = ({ members, onSetFeedback }) => (
    <Card className="mb-6 bg-gradient-to-r from-accent/20 to-primary/20 border-primary/50">
        <CardHeader>
            <CardTitle className="text-3xl text-primary flex items-center justify-center gap-4">
                <Bell className="animate-pulse" /> Now Serving
            </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
            {members.length > 0 ? members.map(member => (
                <div key={member.id} className="mb-4">
                    <p className="text-5xl font-bold tracking-wider text-foreground">{member.ticketNumber}</p>
                    <p className="text-xl text-muted-foreground mt-2">{member.name}</p>
                    <div className="text-2xl font-semibold text-primary mt-4 space-y-1">
                      {member.services?.map((service, index) => (
                        <p key={index}>Please proceed to {service.counter} for {service.name}</p>
                      ))}
                    </div>
                    {member.status === 'serviced' && !member.feedback && <FeedbackForm member={member} onSubmitFeedback={onSetFeedback} />}
                    {member.status === 'serviced' && member.feedback && (
                         <div className="mt-4 flex items-center justify-center gap-2 text-green-500">
                            <CheckCircle className="h-5 w-5"/>
                            <p className="font-semibold">Feedback Received. Thank you!</p>
                        </div>
                    )}
                </div>
            )) : <p>No one is being served right now.</p>}
        </CardContent>
    </Card>
);

export const QueueDisplay: FC<QueueDisplayProps> = ({ queue, onEditService, onSetFeedback }) => {
  const nowServing = queue.filter(m => m.status === 'in-service' || m.status === 'serviced');
  const upNext = queue.filter(m => m.status === 'waiting');

  return (
     <Card className="h-full bg-card/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-primary"><Users /> Live Queue</CardTitle>
            <CardDescription>Current waiting list and estimated service times.</CardDescription>
        </CardHeader>
        <CardContent>
            {nowServing.length > 0 && <NowServing members={nowServing} onSetFeedback={onSetFeedback} />}
            {upNext.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Ticket</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Services</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {upNext.map((member) => (
                                <TableRow key={member.id}>
                                <TableCell className="font-medium">
                                    <Badge variant="secondary">{member.ticketNumber}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 font-medium">
                                        {member.name}
                                    </div>
                                </TableCell>
                                 <TableCell>
                                    <div className="flex flex-col gap-1">
                                      {(member.services || []).map((service, index) => (
                                         <div key={index} className="flex items-center gap-2 text-muted-foreground text-xs">
                                           {serviceDetails[service.name]?.icon}
                                           <span>{service.name}</span>
                                         </div>
                                      ))}
                                      {(!member.services || member.services.length === 0) && (
                                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                            <List className="h-4 w-4" />
                                            <span>Pending Selection...</span>
                                        </div>
                                      )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => onEditService(member.id)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                nowServing.length === 0 && (
                 <div className="flex flex-col items-center justify-center text-center h-64 p-8 border-2 border-dashed rounded-lg bg-background">
                    <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-semibold font-headline">The queue is empty!</p>
                    <p className="text-muted-foreground">New check-ins will appear here.</p>
                </div>
                )
            )}
        </CardContent>
     </Card>
  );
};
