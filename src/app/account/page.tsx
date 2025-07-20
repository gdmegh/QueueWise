
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { QueueMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Ticket, CheckCircle, Edit, Feather, HeartPulse, Save, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FeedbackForm } from '@/components/forms/FeedbackForm';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const profileFormSchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    email: z.string().email('Invalid email address.'),
    phone: z.string().regex(/^\d{10,15}$/, 'Please enter a valid phone number.'),
    address: z.string().optional(),
    photo: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const MAX_QUEUE_SIZE = 20;

export default function AccountPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [userHistory, setUserHistory] = useState<QueueMember[]>([]);
    const [queue, setQueue] = useState<QueueMember[]>([]);
    const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedMemberForFeedback, setSelectedMemberForFeedback] = useState<QueueMember | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>('/assets/avatar-placeholder.png');

    const [mockUser, setMockUser] = useState({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '09876543210',
        address: '123 Health St, Wellness City',
        photo: '/assets/avatar-placeholder.png'
    });

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: mockUser,
    });
    
    useEffect(() => {
        profileForm.reset(mockUser);
    }, [mockUser, profileForm]);


    const refreshData = () => {
        const serviced = db.getData<QueueMember[]>('serviced');
        const currentQueue = db.getData<QueueMember[]>('queue');
        setUserHistory(serviced.filter(item => item.phone === mockUser.phone).sort((a,b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()));
        setQueue(currentQueue);
    }
    
    useEffect(() => {
        refreshData();
    }, [mockUser.phone]);

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
            name: mockUser.name,
            phone: mockUser.phone,
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
        
        console.log("Health info submitted:", healthInfo);

        toast({
            title: "Health Profile Updated",
            description: "Thank you for providing your information. We will use this to provide better recommendations.",
        });
    }

    const onProfileSubmit = (data: ProfileFormValues) => {
        setMockUser(prev => ({ ...prev, ...data }));
        setIsEditingProfile(false);
        toast({ title: "Profile Updated", description: "Your information has been saved successfully." });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setProfilePhotoPreview(previewUrl);
            profileForm.setValue('photo', file);
        }
    };

    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-8">
                    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">My Profile</CardTitle>
                                    <CardDescription>Manage your personal information.</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsEditingProfile(!isEditingProfile)}>
                                    {isEditingProfile ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="relative">
                                             <Image
                                                data-ai-hint="person avatar"
                                                src={profilePhotoPreview || '/assets/avatar-placeholder.png'}
                                                alt="Profile Photo"
                                                width={96}
                                                height={96}
                                                className="rounded-full w-24 h-24 object-cover border-2 border-primary"
                                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/96x96.png'}}
                                            />
                                            {isEditingProfile && (
                                                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer hover:bg-primary/90">
                                                    <Upload className="h-4 w-4" />
                                                    <Input id="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange}/>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                    <FormField
                                        control={profileForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled={!isEditingProfile} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={profileForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" disabled={!isEditingProfile} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={profileForm.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="tel" disabled={!isEditingProfile} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={profileForm.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} disabled={!isEditingProfile} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {isEditingProfile && (
                                        <Button type="submit" className="w-full">
                                            <Save className="mr-2" /> Save Changes
                                        </Button>
                                    )}
                                </form>
                            </Form>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleNewCheckin} className="w-full">
                                <Ticket className="mr-2" /> Join Queue
                            </Button>
                        </CardFooter>
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
