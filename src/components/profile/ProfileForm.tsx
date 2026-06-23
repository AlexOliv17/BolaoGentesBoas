'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validators/profile';
import styles from './Profile.module.css';

interface ProfileFormProps {
  initialNickname: string;
}

export function ProfileForm({ initialNickname }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nickname: initialNickname,
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar perfil');
      }

      setSuccess(true);
      reset({ nickname: data.nickname }); // Atualiza state clean do formulário
      router.refresh();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.formSection}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nickname" className={styles.label}>Apelido</label>
          <input
            id="nickname"
            type="text"
            className={styles.input}
            placeholder="Seu apelido no bolão"
            disabled={isSubmitting}
            {...register('nickname')}
          />
          {errors.nickname && <span className={styles.errorText}>{errors.nickname.message}</span>}
        </div>

        {error && <div className={styles.errorText}>{error}</div>}
        {success && <div className={styles.successMessage}>Perfil atualizado com sucesso!</div>}

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}
