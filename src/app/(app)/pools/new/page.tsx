'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPoolSchema, type CreatePoolFormData } from '@/lib/validators/pool';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import styles from '@/components/pools/Pools.module.css';

export default function NewPoolPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePoolFormData>({
    resolver: zodResolver(createPoolSchema),
  });

  async function onSubmit(data: CreatePoolFormData) {
    try {
      setError(null);
      const res = await fetch('/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        setError(json.error || 'Erro ao criar bolão');
        return;
      }
      
      router.push(`/pools/${json.data.id}`);
      router.refresh();
    } catch {
      setError('Erro de conexão ao tentar criar o bolão');
    }
  }

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backButton}>
        ← Voltar ao Dashboard
      </Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Novo Bolão</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className={styles.poolCard} style={{ cursor: 'default' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            id="name"
            label="Nome do Bolão"
            placeholder="Ex: Galera da Firma"
            error={errors.name?.message}
            {...register('name')}
          />
          
          <Input
            id="description"
            label="Descrição (Opcional)"
            placeholder="Regras, valor da aposta, etc."
            error={errors.description?.message}
            {...register('description')}
          />
          
          {error && (
            <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button type="submit" isLoading={isSubmitting} style={{ flex: 1 }}>
              Criar Bolão
            </Button>
            <Link href="/dashboard" style={{ flex: 1 }}>
              <Button type="button" variant="secondary" style={{ width: '100%' }}>
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
