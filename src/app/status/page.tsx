
'use client';

import { Suspense } from 'react';
import StatusPageContent from '@/app/status/page-content';

export default function StatusPage() {
    return (
        <Suspense>
            <StatusPageContent />
        </Suspense>
    );
}
