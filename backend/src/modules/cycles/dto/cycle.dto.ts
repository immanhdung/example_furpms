import { z } from 'zod';

export const AdminCreateCycleSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(50).optional(),
});

export const StaffConfigureCycleSchema = z.object({
  academicYear: z.string().optional(),
  researchTypeId: z.string().optional(),
  submissionStart: z.coerce.date().optional(),
  submissionEnd: z.coerce.date().optional(),
  reviewStart: z.coerce.date().optional(),
  reviewEnd: z.coerce.date().optional(),
  progressReportDeadline: z.coerce.date().optional(),
  finalReportDeadline: z.coerce.date().optional(),
  description: z.string().optional(),
  totalBudget: z.number().positive().optional(),
});

export const UpdateCycleSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  code: z.string().optional(),
  academicYear: z.string().optional(),
  researchTypeId: z.string().optional(),
  submissionStart: z.coerce.date().optional(),
  submissionEnd: z.coerce.date().optional(),
  reviewStart: z.coerce.date().optional(),
  reviewEnd: z.coerce.date().optional(),
  progressReportDeadline: z.coerce.date().optional(),
  finalReportDeadline: z.coerce.date().optional(),
  description: z.string().optional(),
  totalBudget: z.number().positive().optional(),
});

// Keep for backward compat
export const CreateCycleSchema = AdminCreateCycleSchema;

export type AdminCreateCycleDto = z.infer<typeof AdminCreateCycleSchema>;
export type StaffConfigureCycleDto = z.infer<typeof StaffConfigureCycleSchema>;
export type UpdateCycleDto = z.infer<typeof UpdateCycleSchema>;
export type CreateCycleDto = z.infer<typeof CreateCycleSchema>;
