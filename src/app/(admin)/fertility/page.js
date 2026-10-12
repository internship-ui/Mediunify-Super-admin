'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FertilityRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/surgeries');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Redirecting to Surgery Care...
        </p>
      </div>
    </div>
  );
}
