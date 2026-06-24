'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  const handleAction = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch('/api/invitations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action }),
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
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 'var(--space-2)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
          borderRadius: '50%',
          transition: 'background-color var(--duration-fast)',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {invitations.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: 'var(--color-danger)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
          }}>
            {invitations.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 'var(--space-2)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            width: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 999,
          }}>
            <div style={{
              padding: 'var(--space-3)',
              borderBottom: '1px solid var(--color-border)',
              fontWeight: 'bold',
              color: 'var(--color-text-primary)'
            }}>
              Notificações
            </div>
            
            {invitations.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Nenhuma notificação no momento.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {invitations.map(inv => (
                  <li key={inv.id} style={{
                    padding: 'var(--space-3)',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                      <strong>{inv.inviter?.nickname || 'Alguém'}</strong> convidou você para o bolão <strong>{inv.pool?.name}</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button 
                        onClick={() => handleAction(inv.id, 'accept')}
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-2)',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Aceitar
                      </button>
                      <button 
                        onClick={() => handleAction(inv.id, 'reject')}
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--color-surface-hover)',
                          color: 'var(--color-text-primary)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-2)',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
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
