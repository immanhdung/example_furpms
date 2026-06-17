import mongoose, { Document, Schema } from 'mongoose';
import { PROPOSAL_STATUS, FUNDING_METHOD, MEMBER_ROLE_CODE } from '../../../constants/status';

export interface IProposalMember {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  department: string;
  role: string;
  memberRoleCode: keyof typeof MEMBER_ROLE_CODE;
  workMonths: number;
  salaryCoefficient?: number;
  isPi: boolean;
  isSecretary: boolean;
}

export interface IProposalBudgetItem {
  _id?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  categoryCode: string;
  categoryName: string;
  amount: number;
  sourceKhoan: number;
  sourceNgoaiKhoan: number;
  sourceNsnn: number;
  sourceOther: number;
  sequence: number;
  note?: string;
}

export interface ILaborDetail {
  _id?: mongoose.Types.ObjectId;
  teamMemberId: mongoose.Types.ObjectId;
  workDays: number;
  coefficient: number;
  dailyRate: number;
  totalAmount: number;
}

export interface IResearchContent {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  sequence: number;
  activities: IActivity[];
}

export interface IActivity {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  startMonth: number;
  endMonth: number;
  responsibleMember?: string;
  sequence: number;
}

export interface IExpectedProduct {
  _id?: mongoose.Types.ObjectId;
  name: string;
  productCategoryId?: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
  quality: string;
  completionMonth: number;
  note?: string;
}

export interface IProposal extends Document {
  _id: mongoose.Types.ObjectId;
  trackId: mongoose.Types.ObjectId;
  piId: mongoose.Types.ObjectId;
  titleVI: string;
  titleEN: string;
  researchType: number;
  fundingMethod: keyof typeof FUNDING_METHOD;
  durationMonths: number;
  objectives: string;
  methodology: string;
  expectedOutput: string;
  status: keyof typeof PROPOSAL_STATUS;
  totalAmount: number;
  members: IProposalMember[];
  budgetItems: IProposalBudgetItem[];
  laborDetails: ILaborDetail[];
  researchContents: IResearchContent[];
  expectedProducts: IExpectedProduct[];
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  withdrawnAt?: Date;
  aiSummary?: string;
  aiSummaryEditedText?: string;
  aiSummaryGeneratedAt?: Date;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const ActivitySchema = new Schema<IActivity>({
  name: { type: String, required: true },
  description: String,
  startMonth: { type: Number, required: true },
  endMonth: { type: Number, required: true },
  responsibleMember: String,
  sequence: { type: Number, default: 0 },
});

const ResearchContentSchema = new Schema<IResearchContent>({
  title: { type: String, required: true },
  description: String,
  sequence: { type: Number, default: 0 },
  activities: [ActivitySchema],
});

const ExpectedProductSchema = new Schema<IExpectedProduct>({
  name: { type: String, required: true },
  productCategoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory' },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true },
  quality: { type: String, required: true },
  completionMonth: { type: Number, required: true },
  note: String,
});

const MemberSchema = new Schema<IProposalMember>({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
  memberRoleCode: { type: String, enum: Object.values(MEMBER_ROLE_CODE), default: 'TV' },
  workMonths: { type: Number, required: true },
  salaryCoefficient: Number,
  isPi: { type: Boolean, default: false },
  isSecretary: { type: Boolean, default: false },
});

const BudgetItemSchema = new Schema<IProposalBudgetItem>({
  categoryId: { type: Schema.Types.ObjectId, ref: 'BudgetExpenseCategory' },
  categoryCode: { type: String, default: '' },
  categoryName: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  sourceKhoan: { type: Number, default: 0 },
  sourceNgoaiKhoan: { type: Number, default: 0 },
  sourceNsnn: { type: Number, default: 0 },
  sourceOther: { type: Number, default: 0 },
  sequence: { type: Number, default: 0 },
  note: String,
});

const LaborDetailSchema = new Schema<ILaborDetail>({
  teamMemberId: { type: Schema.Types.ObjectId, required: true },
  workDays: { type: Number, required: true },
  coefficient: { type: Number, required: true },
  dailyRate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
});

const ProposalSchema = new Schema<IProposal>(
  {
    trackId: { type: Schema.Types.ObjectId, ref: 'Track', required: true },
    piId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    titleVI: { type: String, required: true, trim: true },
    titleEN: { type: String, required: true, trim: true },
    researchType: { type: Number, required: true, enum: [1, 2] },
    fundingMethod: {
      type: String,
      enum: Object.values(FUNDING_METHOD),
      default: FUNDING_METHOD.PARTIAL,
    },
    durationMonths: { type: Number, required: true, min: 1 },
    objectives: { type: String, required: true },
    methodology: { type: String, required: true },
    expectedOutput: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(PROPOSAL_STATUS),
      default: PROPOSAL_STATUS.DRAFT,
    },
    totalAmount: { type: Number, default: 0 },
    members: [MemberSchema],
    budgetItems: [BudgetItemSchema],
    laborDetails: [LaborDetailSchema],
    researchContents: [ResearchContentSchema],
    expectedProducts: [ExpectedProductSchema],
    submittedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    withdrawnAt: Date,
    aiSummary: String,
    aiSummaryEditedText: String,
    aiSummaryGeneratedAt: Date,
    embedding: [{ type: Number }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const record = ret as Record<string, unknown>;
        record.id = record._id;
        delete record._id;
        delete record.__v;
        delete record.embedding;
        return record;
      },
    },
  },
);

ProposalSchema.index({ piId: 1, isDeleted: 1 });
ProposalSchema.index({ trackId: 1, status: 1 });
ProposalSchema.index({ status: 1, isDeleted: 1 });

export const Proposal = mongoose.model<IProposal>('Proposal', ProposalSchema);
