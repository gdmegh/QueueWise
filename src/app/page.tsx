import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Smartphone, Users, Stethoscope, Syringe, HeartPulse, Bone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40 flex items-center justify-center text-center bg-gradient-to-br from-background via-black to-background">
           <div className="absolute inset-0 bg-black/60 z-10" />
           <Image 
              src="https://placehold.co/1920x1080.png" 
              alt="A modern and clean medical clinic lobby"
              layout="fill"
              objectFit="cover"
              className="opacity-20"
              data-ai-hint="modern clinic interior"
            />
          <div className="container px-4 md:px-6 z-20 relative">
            <div className="max-w-3xl mx-auto space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-primary bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-primary to-yellow-600">
                Your Health, Our Priority
              </h1>
              <p className="text-lg md:text-xl text-foreground/80">
                Experience compassionate care combined with efficient service. Our walk-in clinic uses an intelligent queue system to minimize your wait time.
              </p>
              <div>
                <Link href="/token">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    Get in Line to See a Doctor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-muted-foreground">Why Choose Us?</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">A Better Clinic Experience</h2>
              <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We've redesigned our process with your well-being and time in mind, offering a seamless and stress-free visit.
              </p>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
              <FeatureCard
                icon={<Clock className="h-8 w-8 text-primary" />}
                title="Intelligent Wait Times"
                description="Our AI-powered system gives you accurate wait time estimates, so you're not left guessing."
              />
              <FeatureCard
                icon={<Smartphone className="h-8 w-8 text-primary" />}
                title="Real-Time Notifications"
                description="Receive SMS alerts when it's nearly your turn, freeing you to wait where you feel most comfortable."
              />
               <FeatureCard
                icon={<Users className="h-8 w-8 text-primary" />}
                title="Effortless Check-In"
                description="A quick, confidential check-in with just your phone number gets you in the queue without hassle."
              />
            </div>
          </div>
        </section>
        
        <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-black">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-muted-foreground">Our Services</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">Comprehensive Medical Care</h2>
                <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    We offer a wide range of walk-in services to address your urgent health needs.
                </p>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-4">
                <FeatureCard icon={<Stethoscope className="h-8 w-8 text-primary" />} title="General Check-ups" description="Comprehensive physical examinations and health assessments." />
                <FeatureCard icon={<Syringe className="h-8 w-8 text-primary" />} title="Vaccinations" description="Stay protected with routine immunizations and flu shots." />
                <FeatureCard icon={<HeartPulse className="h-8 w-8 text-primary" />} title="Minor Injuries" description="Treatment for cuts, sprains, and other non-critical injuries." />
                <FeatureCard icon={<Bone className="h-8 w-8 text-primary" />} title="Prescriptions" description="Consultations for new prescriptions and refills." />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                  <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-muted-foreground">Our Team</div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">Meet Our Dedicated Professionals</h2>
                  <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Our experienced medical staff is here to provide you with expert care.
                  </p>
              </div>
              <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-1 md:gap-12 lg:max-w-5xl lg:grid-cols-2">
                  <TeamMemberCard
                      imageSrc="https://placehold.co/400x400.png"
                      name="Dr. Evelyn Reed"
                      title="MD, General Medicine"
                      description="Dr. Reed has over 15 years of experience in family practice and urgent care, with a focus on preventative medicine."
                      aiHint="doctor portrait"
                  />
                  <TeamMemberCard
                      imageSrc="https://placehold.co/400x400.png"
                      name="Dr. Marcus Thorne"
                      title="MD, Internal Medicine"
                      description="Dr. Thorne specializes in diagnosing and treating complex adult illnesses and is dedicated to patient-centered care."
                      aiHint="doctor portrait friendly"
                  />
              </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary">
                Ready to Be Seen?
              </h2>
              <p className="mx-auto max-w-[600px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Click below to get your token and secure your spot in line. Your health journey starts here.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
               <Link href="/token">
                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    Get Token
                  </Button>
                </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-white/10">
        <p className="text-xs text-muted-foreground">&copy; 2024 QueueWise Clinic. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card/50 border border-primary/20 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:shadow-primary/20">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function TeamMemberCard({ imageSrc, name, title, description, aiHint }: { imageSrc: string, name: string, title: string, description: string, aiHint: string }) {
  return (
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-lg bg-card/50 border border-primary/20 shadow-lg backdrop-blur-sm">
          <Avatar className="h-32 w-32 border-4 border-primary/50">
              <AvatarImage src={imageSrc} alt={name} data-ai-hint={aiHint} />
              <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
              <h3 className="text-2xl font-bold text-foreground">{name}</h3>
              <p className="text-primary font-semibold mb-2">{title}</p>
              <p className="text-muted-foreground">{description}</p>
          </div>
      </div>
  );
}
