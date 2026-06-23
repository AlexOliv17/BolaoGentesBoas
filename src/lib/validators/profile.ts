import { z } from 'zod';

export const updateProfileSchema = z.object({
  nickname: z.string().min(2, 'O apelido deve ter no mínimo 2 caracteres').max(30, 'O apelido deve ter no máximo 30 caracteres').optional(),
  avatar_url: z.string().url('URL de imagem inválida').optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
