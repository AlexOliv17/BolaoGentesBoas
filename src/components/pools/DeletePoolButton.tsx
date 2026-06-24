'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function DeletePoolButton({ poolId, poolName }: { poolId: string, poolName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pools/${poolId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        alert('Erro ao deletar o bolão.');
        setIsDeleting(false);
      }
    } catch {
      alert('Erro de conexão.');
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Button 
        variant="secondary" 
        size="sm" 
        style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
        onClick={() => setIsOpen(true)}
      >
        Excluir
      </Button>

      {isOpen && (
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
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-error)' }}>
              Atenção!
            </h3>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
              Você tem certeza que deseja excluir o bolão <strong>{poolName}</strong>? Esta ação não pode ser desfeita e removerá todos os membros e palpites.
            </p>
            
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <Button 
                variant="secondary" 
                style={{ flex: 1 }} 
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                style={{ flex: 1, backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)', color: 'white' }} 
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Sim, excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
