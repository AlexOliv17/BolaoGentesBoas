'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Auth.module.css';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Precisa de ao menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.password }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError('root', { message: error || 'Erro ao redefinir a senha' });
        return;
      }

      setSuccess(true);
      // Opcional: redirecionar para o dashboard após alguns segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      
    } catch {
      setError('root', { message: 'Erro de conexão com o servidor' });
    }
  }

  if (success) {
    return (
      <div className={styles.form} style={{ textAlign: 'center' }}>
        <h2 className={styles.title}>Senha redefinida!</h2>
        <p className={styles.subtitle} style={{ marginBottom: 'var(--space-6)' }}>
          Sua senha foi alterada com sucesso. Redirecionando...
        </p>
        <Link href="/dashboard" className={styles.link} style={{ display: 'inline-block' }}>
          Ir para o início
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Nova senha</h2>
      <p className={styles.subtitle}>Digite sua nova senha abaixo</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            id="password"
            type="password"
            label="Nova Senha"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirme a nova senha"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {errors.root && (
            <div className={styles.rootError} role="alert">
              {errors.root.message}
            </div>
          )}

          <div className={styles.actions}>
            <Button type="submit" isLoading={isSubmitting} style={{ width: '100%' }}>
              Redefinir Senha
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
