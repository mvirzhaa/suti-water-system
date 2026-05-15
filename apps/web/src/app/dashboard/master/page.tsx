'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect /dashboard/master ke halaman pertama master data (pemasok)
export default function MasterIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/master/suppliers');
  }, [router]);

  return null;
}
