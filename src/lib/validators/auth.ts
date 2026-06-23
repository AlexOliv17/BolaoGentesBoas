import { z } from 'zod';

export const signUpSchema = z.object({
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e _ (underline)'),
  nickname: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(30, 'Máximo 30 caracteres'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Precisa de ao menos um número'),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória'),
});

export type SignInFormData = z.infer<typeof signInSchema>;
