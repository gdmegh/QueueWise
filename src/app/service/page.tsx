
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { QueueMember } from '@/lib/types';
import { services as serviceCategories, SubService, ServiceCategory } from '@/lib/services';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Trash2, Banknote, List, ArrowLeft, Building, HandCoins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const serviceIcons: { [key: string]: React.ReactNode } = {
  'Personal Banking': <Building className="h-8 w-8" />,
  'Loans & Mortgages': <HandCoins className="h-8 w-8" />,
  'Transactions': <Banknote className="h-8 w-8" />,
  'General Inquiry': <List className="h-8 w-8" />,
};

const subServiceIcons: { [key: string]: React.ReactNode } = {
  'Account Services': <Banknote className="h-4 w-4" />,
  'Card Services': <Banknote className="h-4 w-4" />,
  'General Inquiry': <List className="h-4 w-4" />,
};


export default function ServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', []);
  const [currentMember, setCurrentMember] = useState<QueueMember | null>(null);
  const [selectedServices, setSelectedServices] = useState<SubService[]>([]);
  const ticketNumber = searchParams.get('ticketNumber');

  const [selectionStep, setSelectionStep] = useState<'category' | 'service' | 'subService'>('category');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<SubService | null>(null);
  const [description, setDescription] = useState('');
  
  useEffect(() => {
    if (ticketNumber) {
      const member = queue.find(m => m.ticketNumber === ticketNumber);
      if (member) {
        setCurrentMember(member);
        setSelectedServices(member.services || []);
      } else {
        toast({ title: "Invalid Ticket", description: "Could not find a user with that ticket number.", variant: 'destructive' });
        router.push('/');
      }
    } else {
        toast({ title: "Ticket Number Required", description: "No ticket number provided in the URL.", variant: 'destructive' });
        router.push('/');
    }
  }, [ticketNumber, queue, router, toast]);

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setSelectionStep('service');
  };

  const handleServiceSelect = (service: SubService) => {
    if (service.subServices && service.subServices.length > 0) {
      setSelectedService(service);
      setSelectionStep('subService');
    } else {
      addService(service);
    }
  };

  const handleSubServiceSelect = (subService: SubService) => {
    addService(subService);
  };
  
  const handleBack = () => {
    if (selectionStep === 'subService') {
        setSelectionStep('service');
    } else if (selectionStep === 'service') {
        setSelectedService(null);
        setSelectionStep('category');
    }
  };

  const addService = (service: SubService) => {
    const serviceToAdd = {
        ...service,
        description: service.needsDescription ? description : undefined,
    };
    setSelectedServices(prev => [...prev, serviceToAdd]);
    resetSelection();
    toast({
        title: "Service Added",
        description: `"${service.name}" has been added to your list.`,
    });
  };

  const resetSelection = () => {
    setSelectionStep('category');
    setSelectedCategory(null);
    setSelectedService(null);
    setDescription('');
  }

  const onRemoveService = (serviceIndex: number) => {
    setSelectedServices(prev => prev.filter((_, index) => index !== serviceIndex));
  };
  
  const onConfirmServices = () => {
      if (!currentMember || selectedServices.length === 0) {
        toast({ title: "No Services Selected", description: "Please add at least one service.", variant: "destructive" });
        return;
      }
      
      const totalAvgTime = selectedServices.reduce((acc, s) => acc + s.avgTime, 0);

      setQueue(prevQueue => {
        const userIndex = prevQueue.findIndex(m => m.id === currentMember.id);
        
        const lastPersonInQueue = prevQueue[prevQueue.length - 1];
        const estimatedServiceTime = new Date(
            (lastPersonInQueue ? new Date(lastPersonInQueue.estimatedServiceTime).getTime() : Date.now()) +
            totalAvgTime * 60000
        );
          
        const updatedMember = {
            ...currentMember,
            services: selectedServices,
            estimatedServiceTime,
        };

        if(userIndex > -1) {
            const newQueue = [...prevQueue];
            newQueue[userIndex] = updatedMember;
            return newQueue;
        } else {
            return [...prevQueue, updatedMember];
        }
      });

      toast({
        title: "Services Confirmed!",
        description: `You are now in the queue.`,
      });

      router.push('/live-queue');
  }

  const renderSelectionUI = () => {
    if (selectionStep === 'category') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceCategories.map(cat => (
            <Card key={cat.name} className="cursor-pointer hover:bg-accent/50 hover:border-primary transition-all group" onClick={() => handleCategorySelect(cat)}>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {serviceIcons[cat.name] || <List className="h-8 w-8" />}
                </div>
                <p className="text-lg font-semibold">{cat.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (selectionStep === 'service' && selectedCategory) {
      return (
         <div className="space-y-4">
            <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2"/> Back to Categories</Button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedCategory.subServices.map(service => (
                     <Card key={service.name} className="cursor-pointer hover:bg-accent/50 hover:border-primary transition-all group" onClick={() => handleServiceSelect(service)}>
                        <CardContent className="p-4 flex items-center gap-4">
                           <div className="p-2 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                             {subServiceIcons[service.name] || <List className="h-6 w-6" />}
                           </div>
                           <p className="font-semibold flex-grow">{service.name}</p>
                           {service.subServices && <ArrowRight className="text-muted-foreground"/>}
                        </CardContent>
                     </Card>
                ))}
            </div>
         </div>
      );
    }

    if (selectionStep === 'subService' && selectedService && selectedService.subServices) {
        return (
            <div className="space-y-4">
                <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2"/> Back to Services</Button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedService.subServices.map(sub => (
                         <Card key={sub.name} className="cursor-pointer hover:bg-accent/50 hover:border-primary transition-all group" onClick={() => handleSubServiceSelect(sub)}>
                            <CardContent className="p-4 flex items-center gap-4">
                               <p className="font-semibold flex-grow">{sub.name}</p>
                            </CardContent>
                         </Card>
                    ))}
                </div>
            </div>
        );
    }
    
    return null;
  };

  if (!currentMember) {
    return (
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">
                      {selectedCategory ? `Select a ${selectionStep}` : "Select a Service Category"}
                    </CardTitle>
                    <CardDescription>
                      {selectionStep === 'category' && "What can we help you with today?"}
                      {selectionStep === 'service' && `You've selected: ${selectedCategory?.name}`}
                      {selectionStep === 'subService' && `You've selected: ${selectedService?.name}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderSelectionUI()}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm sticky top-24">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary">
                    Your Visit Summary
                    </CardTitle>
                    <div className="text-center text-muted-foreground">Hello, {currentMember.name}!</div>
                    <div className="text-center text-muted-foreground">Ticket: <span className="font-bold text-lg text-primary">{currentMember.ticketNumber}</span></div>
                </CardHeader>
                <CardContent>
                    {selectedServices.length > 0 ? (
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-foreground">Selected Services:</h3>
                            <ul className="space-y-2">
                                {selectedServices.map((service, index) => (
                                    <li key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                                        <div className="flex items-center gap-2">
                                            {subServiceIcons[service.name] || <List className="h-4 w-4" />}
                                            <span>{service.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => onRemoveService(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                            <p>Your selected services will appear here.</p>
                        </div>
                    )}
                </CardContent>
                {selectedServices.length > 0 && (
                    <CardFooter>
                        <Button onClick={onConfirmServices} className="w-full">
                            Confirm & Join Queue <ArrowRight className="ml-2"/>
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
      </div>
    </main>
  );
}

