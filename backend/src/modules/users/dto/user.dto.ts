import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2).max(100),
  phoneNumber: z.string().optional(),
  department: z.string().optional(),
  academicDegree: z.number().int().min(1).max(5).optional(),
  roles: z.array(z.number().int().min(1).max(4)).min(1),
  temporaryPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const UpdateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phoneNumber: z.string().optional(),
  department: z.string().optional(),
  academicDegree: z.number().int().min(1).max(5).optional(),
  roles: z.array(z.number().int().min(1).max(4)).min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const UpdateAcademicProfileSchema = z.object({
  researchAreas: z.array(z.string()).optional(),
  publications: z.array(z.string()).optional(),
  awards: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
  bio: z.string().optional(),
  orcidId: z.string().optional(),
  googleScholarUrl: z.string().url().optional().or(z.literal('')),
  researchGateUrl: z.string().url().optional().or(z.literal('')),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UpdateAcademicProfileDto = z.infer<typeof UpdateAcademicProfileSchema>;
