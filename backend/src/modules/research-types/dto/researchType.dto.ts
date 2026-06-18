import { z } from 'zod';

export const CreateResearchTypeSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
});

export const UpdateResearchTypeSchema = CreateResearchTypeSchema.partial();

export type CreateResearchTypeDto = z.infer<typeof CreateResearchTypeSchema>;
export type UpdateResearchTypeDto = z.infer<typeof UpdateResearchTypeSchema>;
