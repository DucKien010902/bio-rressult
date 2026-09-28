'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function SettingsRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'doctors') {
      router.replace('/settings/doctors');
    } else if (tab === 'sources') {
      router.replace('/settings/sources');
    } else {
      router.replace('/settings/deadline');
    }
  }, [router, searchParams]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f1f5f9]">
      <Loader2 className="w-8 h-8 text-[#0070f3] animate-spin" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#f1f5f9]">
          <Loader2 className="w-8 h-8 text-[#0070f3] animate-spin" />
        </div>
      }
    >
      <SettingsRedirectContent />
    </Suspense>
  );
}
