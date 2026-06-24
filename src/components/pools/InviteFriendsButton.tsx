'use client';

import { useState } from 'react';
import { InviteFriendsModal } from './InviteFriendsModal';
import { Button } from '@/components/ui/Button';

export function InviteFriendsButton({ poolId }: { poolId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        size="sm"
        onClick={() => setIsModalOpen(true)}
      >
        Convidar
      </Button>

      {isModalOpen && (
        <InviteFriendsModal 
          poolId={poolId} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}
