
'use client';

import { Suspense } from 'react';
import ServicePageContent from '@/app/service/page-content';

export default function ServicePage() {
    return (
        <Suspense>
            <ServicePageContent />
        </Suspense>
    );
}
