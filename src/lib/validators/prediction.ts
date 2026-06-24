import { z } from 'zod';

export const predictionSchema = z.object({
  poolId: z.string().uuid('ID do bolão inválido'),
  matchId: z.number().int().positive('ID do jogo inválido'),
  homeGuess: z.number().int().min(0, 'Placar não pode ser negativo').max(20, 'Placar fora do intervalo'),
  awayGuess: z.number().int().min(0, 'Placar não pode ser negativo').max(20, 'Placar fora do intervalo'),
  penaltyWinnerGuess: z.enum(['home', 'away']).nullable().optional(),
});

export type PredictionInput = z.infer<typeof predictionSchema>;
