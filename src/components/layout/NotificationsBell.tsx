'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import styles from './NotificationsBell.module.css';

export function NotificationsBell() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadInvitations() {
      try {
        const res = await fetch('/api/invitations');
        if (res.ok) {
          const data = await res.json();
          setInvitations(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load invitations', err);
      }
    }
    
    // Carrega na montagem
    loadInvitations();
    
    // Polling a cada 30 segundos
    const interval = setInterval(loadInvitations, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (invitationId: string, action: 'accept' | 'reject', type: 'pool' | 'friend' = 'pool') => {
    try {
      const res = await fetch('/api/invitations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action, type }),
      });

      if (res.ok) {
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        if (action === 'accept') {
          router.refresh(); // Atualiza a página para mostrar o novo bolão
        }
      }
    } catch (err) {
      console.error('Failed to process invitation', err);
    }
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificações"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {invitations.length > 0 && (
          <span className={styles.badge}>
            {invitations.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              Notificações
            </div>
            
            {invitations.length === 0 ? (
              <div className={styles.emptyState}>
                Nenhuma notificação no momento.
              </div>
            ) : (
              <ul className={styles.list}>
                {invitations.map(inv => (
                  <li key={inv.id} className={styles.listItem}>
                    <p className={styles.message}>
                      {inv.type === 'friend' ? (
                        <><strong>{inv.inviter?.nickname || 'Alguém'}</strong> enviou um pedido de amizade.</>
                      ) : (
                        <><strong>{inv.inviter?.nickname || 'Alguém'}</strong> convidou você para o bolão <strong>{inv.pool?.name}</strong>.</>
                      )}
                    </p>
                    <div className={styles.actions}>
                      <button 
                        className={styles.btnAccept}
                        onClick={() => handleAction(inv.id, 'accept', inv.type)}
                      >
                        Aceitar
                      </button>
                      <button 
                        className={styles.btnReject}
                        onClick={() => handleAction(inv.id, 'reject', inv.type)}
                      >
                        Recusar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
