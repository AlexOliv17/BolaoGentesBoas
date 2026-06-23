'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import styles from './Auth.module.css';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError('root', { message: error || 'Erro ao enviar e-mail' });
        return;
      }

      setSuccess(true);
    } catch {
      setError('root', { message: 'Erro de conexão com o servidor' });
    }
  }

  if (success) {
    return (
      <div className={styles.form} style={{ textAlign: 'center' }}>
        <h2 className={styles.title}>E-mail enviado!</h2>
        <p className={styles.subtitle} style={{ marginBottom: 'var(--space-6)' }}>
          Verifique sua caixa de entrada e clique no link para redefinir sua senha.
        </p>
        <Link href="/login" className={styles.link} style={{ display: 'inline-block' }}>
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Recuperar senha</h2>
      <p className={styles.subtitle}>Digite seu e-mail para receber um link de recuperação</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            id="email"
            type="email"
            label="E-mail"
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register('email')}
          />

          {errors.root && (
            <div className={styles.rootError} role="alert">
              {errors.root.message}
            </div>
          )}

          <div className={styles.actions}>
            <Button type="submit" isLoading={isSubmitting} style={{ width: '100%' }}>
              Enviar e-mail
            </Button>
            
            <Link href="/login" className={styles.link}>
              Voltar para o login
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
