'use client';

import { Button } from '@/components/ui/Button';

interface MemberSelectModalProps {
  members: any[];
  currentUserId: string;
  onSelect: (userId: string) => void;
  onClose: () => void;
}

export function MemberSelectModal({ members, currentUserId, onSelect, onClose }: MemberSelectModalProps) {
  // Ordenar para que o usuário atual fique no topo, e os outros em ordem alfabética de nickname
  const sortedMembers = [...members].sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    return (a.profile?.nickname || '').localeCompare(b.profile?.nickname || '');
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-4)'
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        maxWidth: '400px',
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, color: 'var(--color-brand-gold)' }}>Ver palpites de:</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
              fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 
            }}
          >
            &times;
          </button>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingRight: 'var(--space-2)' }}>
          {sortedMembers.map(m => {
            const isMe = m.user_id === currentUserId;
            
            return (
              <div 
                key={m.user_id}
                onClick={() => {
                  onSelect(m.user_id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: isMe ? '1px solid var(--color-brand-green)' : '1px solid transparent',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div style={{ 
                  width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--color-bg)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {m.profile?.avatar_url ? (
                    <img src={m.profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontWeight: 'bold' }}>{m.profile?.nickname?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>
                    {m.profile?.nickname} {isMe && <span style={{ color: 'var(--color-brand-green)', fontSize: 'var(--text-xs)', fontWeight: 'normal' }}>(Você)</span>}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    @{m.profile?.username}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Button variant="secondary" style={{ width: '100%' }} onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
