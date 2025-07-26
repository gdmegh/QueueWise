
'use client';

import { Suspense } from 'react';
import CheckInPageContent from '@/app/check-in/page-content';

export default function CheckInPage() {
    return (
        <Suspense>
            <CheckInPageContent />
        </Suspense>
    );
}
