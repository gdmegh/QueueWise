'use client';

import { usePathname } from 'next/navigation';
import { BarChart, Building, Users, CreditCard, LifeBuoy, Settings, Crown } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarHeader } from '@/components/ui/sidebar';
import Link from 'next/link';


export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const pathname = usePathname();

    const menuItems = [
        { href: '/super-admin', label: 'Dashboard', icon: <BarChart /> },
        { href: '/super-admin/companies', label: 'Company Management', icon: <Building /> },
        { href: '/super-admin/users', label: 'User Management', icon: <Users /> },
        { href: '/super-admin/subscriptions', label: 'Subscriptions & Plans', icon: <CreditCard /> },
        { href: '/super-admin/support', label: 'Support Tickets', icon: <LifeBuoy /> },
        { href: '/super-admin/settings', label: 'System Settings', icon: <Settings /> },
    ];

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Crown className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-semibold">Super Admin</h1>
                </div>
            </SidebarHeader>
            <SidebarMenu>
                {menuItems.map((item) => (
                     <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref>
                           <SidebarMenuButton isActive={pathname === item.href}>
                                {item.icon}
                                {item.label}
                           </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </Sidebar>
        <SidebarInset>
            <main className="flex-grow p-4 sm:p-6 lg:p-8">
              {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
