import { z } from 'zod';

export const AdminCreateCycleSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(50).optional(),
});

const optionalDate = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.coerce.date().optional(),
);

export const StaffConfigureCycleSchema = z.object({
  academicYear: z.string().optional(),
  researchTypeId: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.string().optional()),
  submissionStart: optionalDate,
  submissionEnd: optionalDate,
  reviewStart: optionalDate,
  reviewEnd: optionalDate,
  progressReportDeadline: optionalDate,
  finalReportDeadline: optionalDate,
  description: z.string().optional(),
});

export const UpdateCycleSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  code: z.string().optional(),
  academicYear: z.string().optional(),
  researchTypeId: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.string().optional()),
  submissionStart: optionalDate,
  submissionEnd: optionalDate,
  reviewStart: optionalDate,
  reviewEnd: optionalDate,
  progressReportDeadline: optionalDate,
  finalReportDeadline: optionalDate,
  description: z.string().optional(),
});

// Keep for backward compat
export const CreateCycleSchema = AdminCreateCycleSchema;

export type AdminCreateCycleDto = z.infer<typeof AdminCreateCycleSchema>;
export type StaffConfigureCycleDto = z.infer<typeof StaffConfigureCycleSchema>;
export type UpdateCycleDto = z.infer<typeof UpdateCycleSchema>;
export type CreateCycleDto = z.infer<typeof CreateCycleSchema>;
