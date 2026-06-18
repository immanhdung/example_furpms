import { z } from 'zod';

export const AppliedTopicRowSchema = z.object({
  title: z.string().min(1),
  topicType: z.string().optional(),
  description: z.string().optional(),
  orderingOrganization: z.string().optional(),
  maxSelections: z.coerce.number().positive().default(1),
});

export const ImportAppliedTopicsSchema = z.object({
  topics: z.array(AppliedTopicRowSchema).min(1),
});

export type AppliedTopicRowDto = z.infer<typeof AppliedTopicRowSchema>;
export type ImportAppliedTopicsDto = z.infer<typeof ImportAppliedTopicsSchema>;
