import { z } from 'zod';

const MemberSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  department: z.string().min(1),
  role: z.string().min(1),
  memberRoleCode: z.enum(['CNNV', 'TKKH', 'TVC', 'TV', 'KTV']).optional().default('TV'),
  workMonths: z.number().int().min(1),
  salaryCoefficient: z.number().optional(),
  isPi: z.boolean().optional().default(false),
  isSecretary: z.boolean().optional().default(false),
});

const BudgetItemSchema = z.object({
  categoryId: z.string().optional(),
  category: z.string().optional(),
  categoryName: z.string().optional(),
  amount: z.number().nonnegative(),
  sourceKhoan: z.number().nonnegative().optional().default(0),
  sourceNgoaiKhoan: z.number().nonnegative().optional().default(0),
  sourceNsnn: z.number().nonnegative().optional().default(0),
  sourceOther: z.number().nonnegative().optional().default(0),
  sequence: z.number().int().optional().default(0),
  note: z.string().optional(),
});

export const CreateProposalSchema = z.object({
  trackId: z.string().min(1, 'Track ID is required'),
  titleVI: z.string().min(5, 'Vietnamese title is required'),
  titleEN: z.string().min(5, 'English title is required'),
  researchType: z.number().int().min(1).max(2),
  fundingMethod: z.enum(['PARTIAL', 'WHOLE']).optional().default('PARTIAL'),
  durationMonths: z.number().int().min(1).max(60),
  objectives: z.string().min(10),
  methodology: z.string().min(10),
  expectedOutput: z.string().optional().default(''),
  members: z.array(MemberSchema).optional().default([]),
  budgetItems: z.array(BudgetItemSchema).optional().default([]),
});

export const UpdateProposalSchema = CreateProposalSchema.partial();

const ActivitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startMonth: z.number().int().min(1),
  endMonth: z.number().int().min(1),
  responsibleMember: z.string().optional(),
  sequence: z.number().int().optional().default(0),
});

export const CreateResearchContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sequence: z.number().int().optional().default(0),
});

export const UpdateResearchContentSchema = CreateResearchContentSchema.partial();

export const CreateActivitySchema = ActivitySchema;
export const UpdateActivitySchema = ActivitySchema.partial();

export const CreateExpectedProductSchema = z.object({
  name: z.string().min(1),
  productCategoryId: z.string().optional(),
  quantity: z.number().int().min(1),
  unit: z.string().min(1),
  quality: z.string().min(1),
  completionMonth: z.number().int().min(1),
  note: z.string().optional(),
});

export const UpdateExpectedProductSchema = CreateExpectedProductSchema.partial();

export const AddMemberSchema = MemberSchema;

export const UpdateBudgetSchema = z.object({
  totalAmount: z.number().nonnegative(),
  items: z.array(
    BudgetItemSchema.extend({
      id: z.string().optional(),
      categoryCode: z.string().optional(),
    }),
  ),
});

export const UpdateLaborDetailSchema = z.object({
  workDays: z.number().int().min(0),
  coefficient: z.number().min(0),
  dailyRate: z.number().min(0),
  totalAmount: z.number().min(0),
});

export type CreateProposalDto = z.infer<typeof CreateProposalSchema>;
export type UpdateProposalDto = z.infer<typeof UpdateProposalSchema>;
export type CreateResearchContentDto = z.infer<typeof CreateResearchContentSchema>;
export type CreateActivityDto = z.infer<typeof CreateActivitySchema>;
export type CreateExpectedProductDto = z.infer<typeof CreateExpectedProductSchema>;
export type AddMemberDto = z.infer<typeof AddMemberSchema>;
export type UpdateBudgetDto = z.infer<typeof UpdateBudgetSchema>;
export type UpdateLaborDetailDto = z.infer<typeof UpdateLaborDetailSchema>;
