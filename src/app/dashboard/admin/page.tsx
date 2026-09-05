'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToStandaloneAdmin() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="p-8 text-center text-sm font-bold text-slate-500">
      Redirecting to Secure Admin Portal (/admin)...
    </div>
  );
}
