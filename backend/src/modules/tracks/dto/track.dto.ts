import { z } from 'zod';

export const CreateTrackSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().optional(),
  description: z.string().optional(),
  maxBudget: z.number().positive().optional(),
  cycleId: z.string().optional(),
});

export const UpdateTrackSchema = CreateTrackSchema.partial();

export const AssignOwnerSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
});

export type CreateTrackDto = z.infer<typeof CreateTrackSchema>;
export type UpdateTrackDto = z.infer<typeof UpdateTrackSchema>;
export type AssignOwnerDto = z.infer<typeof AssignOwnerSchema>;
