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
}

const serviceDetails: { [key: string]: { icon: React.ReactNode, counter: string } } = services.reduce((acc, service) => {
  const icons: { [key: string]: React.ReactNode } = {
    'General Inquiry': <List className="h-4 w-4" />,
    'New Account': <UserPlus className="h-4 w-4" />,
    'Deposit/Withdrawal': <Banknote className="h-4 w-4" />,
    'Loan Application': <HandCoins className="h-4 w-4" />,
    'Pending': <List className="h-4 w-4" />
  };
  acc[service.name] = { icon: icons[service.name] || <List className="h-4 w-4" />, counter: service.counter };
  return acc;
}, {} as { [key: string]: { icon: React.ReactNode, counter: string } });

const NowServing: FC<{ member: QueueMember }> = ({ member }) => (
    <Card className="mb-6 bg-gradient-to-r from-accent/20 to-primary/20 border-primary/50">
        <CardHeader>
            <CardTitle className="text-3xl text-primary flex items-center justify-center gap-4">
                <Bell className="animate-pulse" /> Now Serving
            </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-5xl font-bold tracking-wider text-foreground">{member.ticketNumber}</p>
            <p className="text-xl text-muted-foreground mt-2">{member.name}</p>
            <p className="text-2xl font-semibold text-primary mt-4">Please proceed to {serviceDetails[member.service]?.counter || 'Counter'}</p>
            {member.status === 'serviced' && !member.feedback && <FeedbackForm member={member} />}
            {member.status === 'serviced' && member.feedback && (
                 <div className="mt-4 flex items-center justify-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5"/>
                    <p className="font-semibold">Feedback Received. Thank you!</p>
                </div>
            )}
        </CardContent>
    </Card>
);

export const QueueDisplay: FC<QueueDisplayProps> = ({ queue, onEditService }) => {
  const nowServing = queue.length > 0 ? queue[0] : null;
  const upNext = queue.length > 1 ? queue.slice(1) : [];

  return (
     <Card className="h-full bg-card/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-primary"><Users /> Live Queue</CardTitle>
            <CardDescription>Current waiting list and estimated service times.</CardDescription>
        </CardHeader>
        <CardContent>
            {nowServing && <NowServing member={nowServing} />}
            {upNext.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Ticket</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Service</TableHead>
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
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      {serviceDetails[member.service || '']?.icon}
                                      {member.service}
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
                !nowServing && (
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
