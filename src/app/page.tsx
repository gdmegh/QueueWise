import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Smartphone, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40 flex items-center justify-center text-center bg-gradient-to-br from-background via-black to-background">
           <div className="absolute inset-0 bg-black/60 z-10" />
           <Image 
              src="https://placehold.co/1920x1080.png" 
              alt="People waiting in a stylish lobby"
              layout="fill"
              objectFit="cover"
              className="opacity-20"
              data-ai-hint="stylish lobby"
            />
          <div className="container px-4 md:px-6 z-20 relative">
            <div className="max-w-3xl mx-auto space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-primary bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-primary to-yellow-600">
                Revolutionize Your Waiting Line
              </h1>
              <p className="text-lg md:text-xl text-foreground/80">
                QueueWise offers an intelligent, AI-powered solution to manage queues efficiently, reduce wait times, and enhance customer satisfaction.
              </p>
              <div>
                <Link href="/token">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    Get Your Token Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-muted-foreground">Key Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">Why Choose QueueWise?</h2>
              <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform is packed with features designed to create a seamless waiting experience for your customers and a powerful management tool for your staff.
              </p>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
              <FeatureCard
                icon={<Clock className="h-8 w-8 text-primary" />}
                title="AI-Powered Wait Times"
                description="Our smart algorithm analyzes queue data to provide highly accurate, real-time wait estimates."
              />
              <FeatureCard
                icon={<Smartphone className="h-8 w-8 text-primary" />}
                title="SMS Notifications"
                description="Keep customers informed with automated alerts when their turn is approaching, allowing them to wait freely."
              />
               <FeatureCard
                icon={<Users className="h-8 w-8 text-primary" />}
                title="Simple Check-In"
                description="A quick and easy check-in process using just a phone number gets customers in the queue in seconds."
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-primary">
                Ready to Eliminate Waiting Lines?
              </h2>
              <p className="mx-auto max-w-[600px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Get your token and experience a smarter way to wait.
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
        <p className="text-xs text-muted-foreground">&copy; 2024 QueueWise. All rights reserved.</p>
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
