'use client';

import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function LogoutButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <Button onClick={handleLogout} variant="secondary" size={size}>
      Sair
    </Button>
  );
}
