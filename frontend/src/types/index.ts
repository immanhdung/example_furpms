export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  errors: null | string[]
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface User {
  _id: string
  fullName: string
  email: string
  roles: string[]
  department?: string
  academicDegree?: string
  phone?: string
  avatarUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ResearchType {
  _id: string
  name: string
  code: 'APPLIED' | 'PAPER' | string
  description?: string
  isActive: boolean
  createdAt: string
}

export interface AppliedTopic {
  _id: string
  cycleId: string
  title: string
  topicType?: string
  description?: string
  orderingOrganization?: string
  maxSelections: number
  currentSelections: number
  status: 'OPEN' | 'CLOSED'
  createdAt: string
}

export interface Cycle {
  _id: string
  name: string
  code: string
  academicYear: string
  researchTypeId?: string | ResearchType
  submissionStart?: string
  submissionEnd?: string
  reviewStart?: string
  reviewEnd?: string
  progressReportDeadline?: string
  finalReportDeadline?: string
  status: 'DRAFT' | 'PLANNING' | 'OPEN' | 'CLOSED' | 'COMPLETED'
  description?: string
  totalBudget?: number
  createdAt: string
}

export interface Track {
  _id: string
  cycleId?: string
  name: string
  code: string
  description?: string
  maxBudget?: number
  isActive: boolean
}

export interface Proposal {
  _id: string
  titleVI: string
  titleEN: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED' | 'CONTRACTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TERMINATED'
  cycleId?: string | Cycle
  trackId?: string | Track
  piId: string | User
  researchTypeId?: string | ResearchType
  appliedTopicId?: string | AppliedTopic
  registrationFileUrl?: string
  aiParsedData?: Record<string, unknown>
  fundingMethod: 'LUMP_SUM' | 'PARTIAL'
  totalAmount: number
  durationMonths: number
  objectives?: string
  methodology?: string
  expectedOutput?: string
  submittedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Council {
  _id: string
  proposalId: string | Proposal
  roundId?: string
  councilType: string
  councilStage: 'PROPOSAL' | 'FINAL_REPORT'
  meetLink?: string
  status: 'FORMING' | 'ACTIVE' | 'COMPLETED' | 'DISSOLVED'
  isResultConfirmed: boolean
  resultConfirmedAt?: string
  resultConfirmedBy?: string | User
  establishmentDecisionNo?: string
  establishedAt?: string
  meetingDeadline?: string
  createdAt: string
}

export interface CouncilMember {
  _id: string
  councilId: string
  userId: string | User
  memberRole: 'CHAIRMAN' | 'SECRETARY' | 'MEMBER' | 'ORDERING_PARTY_REP'
  isExternal: boolean
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

export interface Contract {
  _id: string
  proposalId: string | Proposal
  contractNumber: string
  status: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'TERMINATED'
  startDate: string
  endDate: string
  totalAmount: number
  fundingMethod: string
  signedAt?: string
  createdAt: string
}

export interface Disbursement {
  _id: string
  contractId: string
  installmentNumber: number
  plannedAmount: number
  actualAmount?: number
  plannedDate: string
  actualDate?: string
  status: 'PENDING' | 'RELEASED' | 'CANCELLED'
}

export interface Deliverable {
  _id: string
  contractId: string
  title: string
  description?: string
  sequence: number
  dueDate: string
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  submittedAt?: string
  fileUrl?: string
}

export interface Notification {
  _id: string
  userId: string
  title: string
  body: string
  type: string
  isRead: boolean
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface ReviewRound {
  _id: string
  proposalId: string
  cycleId: string
  roundNumber: number
  roundType: 'SCREENING' | 'REVIEW' | 'ACCEPTANCE'
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED'
  deadline?: string
}

export interface Amendment {
  _id: string
  contractId: string
  changeDescription: string
  justification: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requiresRectorApproval: boolean
  createdAt: string
}

export interface Settlement {
  _id: string
  contractId: string
  totalDisbursed: number
  totalExpense: number
  surplus: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED'
  notes?: string
  createdAt: string
}

export interface AuthUser {
  sub: string
  email: string
  fullName: string
  roles: string[]
  avatarUrl?: string
}

export type Role = 'Admin' | 'Staff' | 'Faculty' | 'ReviewCommittee'
