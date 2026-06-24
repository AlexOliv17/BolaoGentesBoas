'use client';

import { useState } from 'react';
import { InviteFriendsModal } from './InviteFriendsModal';
import { Button } from '@/components/ui/Button';

export function InviteFriendsButton({ poolId }: { poolId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
      >
        Convidar Amigos
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
