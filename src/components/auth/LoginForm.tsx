'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInFormData } from '@/lib/validators/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Auth.module.css';

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(data: SignInFormData) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError('root', { message: error || 'Erro ao fazer login' });
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('root', { message: 'Erro de conexão com o servidor' });
    }
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Bem-vindo de volta</h2>
      <p className={styles.subtitle}>Faça login para continuar</p>

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

          <Input
            id="password"
            type="password"
            label="Senha"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-1)', position: 'relative', zIndex: 2 }}>
            <Link href="/forgot-password" className={styles.link} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: 'var(--space-1)' }}>
              Esqueci minha senha
            </Link>
          </div>

          {errors.root && (
            <div className={styles.rootError} role="alert">
              {errors.root.message}
            </div>
          )}

          <div className={styles.actions}>
            <Button type="submit" isLoading={isSubmitting} style={{ width: '100%' }}>
              Entrar
            </Button>
            
            <Link href="/signup" className={styles.link}>
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
