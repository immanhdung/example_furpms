import { z } from 'zod';

export const CreateCycleSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().optional(),
  year: z.number().int().min(2000).max(2100),
  submissionStartDate: z.coerce.date().optional(),
  submissionDeadline: z.coerce.date().optional(),
  reviewDeadline: z.coerce.date().optional(),
  description: z.string().optional(),
  totalBudget: z.number().positive().optional(),
});

export const UpdateCycleSchema = CreateCycleSchema.partial();

export type CreateCycleDto = z.infer<typeof CreateCycleSchema>;
export type UpdateCycleDto = z.infer<typeof UpdateCycleSchema>;
