import { z } from 'zod';

export const createPoolSchema = z.object({
  name: z.string().min(3, 'O nome do bolão deve ter pelo menos 3 caracteres').max(50, 'O nome do bolão deve ter no máximo 50 caracteres'),
  description: z.string().max(200, 'A descrição deve ter no máximo 200 caracteres').optional(),
});

export type CreatePoolFormData = z.infer<typeof createPoolSchema>;
