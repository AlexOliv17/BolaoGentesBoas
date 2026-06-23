'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpFormData } from '@/lib/validators/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Auth.module.css';

export function SignUpForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const [isSuccess, setIsSuccess] = useState(false);

  async function onSubmit(data: SignUpFormData) {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        const { error } = result;
        
        // Mapear erros de unique constraint para os campos
        if (error.toLowerCase().includes('username') || error.toLowerCase().includes('já existe')) {
            setError('username', { message: 'Este nome de usuário já está em uso' });
        } else if (error.toLowerCase().includes('email') || error.toLowerCase().includes('e-mail')) {
            setError('email', { message: 'Este e-mail já está em uso' });
        } else {
            setError('root', { message: error || 'Erro ao criar conta' });
        }
        return;
      }

      if (result.session) {
        // Se a sessão veio, quer dizer que o usuário foi logado automaticamente
        router.push('/dashboard');
        router.refresh();
      } else {
        // Se não veio sessão, quer dizer que a confirmação de e-mail está habilitada no Supabase
        setIsSuccess(true);
      }
    } catch {
      setError('root', { message: 'Erro de conexão com o servidor' });
    }
  }

  if (isSuccess) {
    return (
      <div className={styles.form} style={{ textAlign: 'center' }}>
        <h2 className={styles.title}>Conta criada! 🎉</h2>
        <p className={styles.subtitle} style={{ marginBottom: 'var(--space-4)' }}>
          Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada (e o spam) para ativar sua conta.
        </p>
        <Link href="/login" style={{ width: '100%' }}>
          <Button style={{ width: '100%' }}>Ir para o Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.title}>Crie sua conta</h2>
      <p className={styles.subtitle}>Junte-se ao Bolão dos Gentes Boas</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            id="username"
            label="Nome de usuário (Login)"
            placeholder="ex: joao_silva"
            error={errors.username?.message}
            {...register('username')}
          />

          <Input
            id="nickname"
            label="Como quer ser chamado? (Apelido)"
            placeholder="João"
            error={errors.nickname?.message}
            {...register('nickname')}
          />

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
            placeholder="Mínimo 8 caracteres (1 maiúscula, 1 número)"
            error={errors.password?.message}
            {...register('password')}
          />

          {errors.root && (
            <div className={styles.rootError} role="alert">
              {errors.root.message}
            </div>
          )}

          <div className={styles.actions}>
            <Button type="submit" isLoading={isSubmitting} style={{ width: '100%' }}>
              Cadastrar
            </Button>
            
            <Link href="/login" className={styles.link}>
              Já tem uma conta? Faça login
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
