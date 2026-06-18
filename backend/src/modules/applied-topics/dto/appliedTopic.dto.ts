import { z } from 'zod';

export const AppliedTopicRowSchema = z.object({
  title: z.string().min(1),
  orderingUnit: z.string().optional(),
  area: z.string().optional(),
  objectives: z.string().optional(),
  requirements: z.string().optional(),
  expectedOutput: z.string().optional(),
  applyingUnit: z.string().optional(),
  notes: z.string().optional(),
});

export type AppliedTopicRowDto = z.infer<typeof AppliedTopicRowSchema>;
