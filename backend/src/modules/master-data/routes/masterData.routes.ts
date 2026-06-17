import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { BudgetExpenseCategory } from '../models/budgetExpenseCategory.model';
import { FinancialConfig } from '../models/financialConfig.model';
import { PersonnelRoleType } from '../models/personnelRoleType.model';
import { ProductCategory } from '../models/productCategory.model';
import { OrganizationalUnit } from '../models/organizationalUnit.model';
import { RubricCriteria } from '../models/rubricCriteria.model';

const router = Router();

// ─── Budget Expense Categories ───────────────────────────────────────────────
router.get('/budget-expense-categories', authenticate, asyncHandler(async (_req, res) => {
  const items = await BudgetExpenseCategory.find({ isDeleted: false }).sort({ sequence: 1 }).lean();
  sendSuccess(res, items, 'Budget expense categories retrieved.');
}));

router.get('/budget-expense-categories/:id', authenticate, asyncHandler(async (req, res) => {
  const item = await BudgetExpenseCategory.findOne({ _id: req.params.id, isDeleted: false }).lean();
  if (!item) return sendSuccess(res, null, 'Not found.', );
  sendSuccess(res, item, 'Category retrieved.');
}));

router.post('/budget-expense-categories', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const schema = z.object({ code: z.string(), name: z.string(), description: z.string().optional(), sequence: z.number().optional() });
  const data = schema.parse(req.body);
  const item = await new BudgetExpenseCategory({ ...data, createdBy: req.user?.sub }).save();
  sendCreated(res, item, 'Category created.');
}));

router.put('/budget-expense-categories/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await BudgetExpenseCategory.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user?.sub }, { new: true });
  sendSuccess(res, item, 'Category updated.');
}));

// ─── Financial Configs ────────────────────────────────────────────────────────
router.get('/financial-configs', authenticate, asyncHandler(async (_req, res) => {
  const items = await FinancialConfig.find({ isDeleted: false, isActive: true }).lean();
  sendSuccess(res, items, 'Financial configs retrieved.');
}));

router.put('/financial-configs/:key', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { value, unit, description } = req.body;
  const item = await FinancialConfig.findOneAndUpdate(
    { key: req.params.key },
    { value, unit, description, updatedBy: req.user?.sub },
    { new: true, upsert: true },
  );
  sendSuccess(res, item, 'Financial config updated.');
}));

// ─── Personnel Role Types ────────────────────────────────────────────────────
router.get('/personnel-role-types', authenticate, asyncHandler(async (_req, res) => {
  const items = await PersonnelRoleType.find({ isDeleted: false }).sort({ code: 1 }).lean();
  sendSuccess(res, items, 'Personnel role types retrieved.');
}));

router.post('/personnel-role-types', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await new PersonnelRoleType(req.body).save();
  sendCreated(res, item, 'Personnel role type created.');
}));

router.put('/personnel-role-types/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await PersonnelRoleType.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, item, 'Personnel role type updated.');
}));

// ─── Product Categories ───────────────────────────────────────────────────────
router.get('/product-categories', authenticate, asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (req.query.activeOnly === 'true') filter.isActive = true;
  const items = await ProductCategory.find(filter).sort({ name: 1 }).lean();
  sendSuccess(res, items, 'Product categories retrieved.');
}));

router.post('/product-categories', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await new ProductCategory(req.body).save();
  sendCreated(res, item, 'Product category created.');
}));

router.put('/product-categories/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await ProductCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, item, 'Product category updated.');
}));

// ─── Organizational Units ─────────────────────────────────────────────────────
router.get('/organizational-units', authenticate, asyncHandler(async (_req, res) => {
  const items = await OrganizationalUnit.find({ isDeleted: false }).lean();
  sendSuccess(res, items, 'Organizational units retrieved.');
}));

router.post('/organizational-units', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await new OrganizationalUnit(req.body).save();
  sendCreated(res, item, 'Organizational unit created.');
}));

router.put('/organizational-units/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await OrganizationalUnit.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, item, 'Organizational unit updated.');
}));

// ─── Rubric Criteria ──────────────────────────────────────────────────────────
router.get('/rubric-criteria', authenticate, asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { isDeleted: false, isActive: true };
  if (req.query.roundType) filter.roundType = req.query.roundType;
  const items = await RubricCriteria.find(filter).sort({ sequence: 1 }).lean();
  sendSuccess(res, items, 'Rubric criteria retrieved.');
}));

router.post('/rubric-criteria', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await new RubricCriteria({ ...req.body, createdBy: req.user?.sub }).save();
  sendCreated(res, item, 'Rubric criterion created.');
}));

router.put('/rubric-criteria/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await RubricCriteria.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user?.sub },
    { new: true },
  );
  sendSuccess(res, item, 'Rubric criterion updated.');
}));

router.delete('/rubric-criteria/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  await RubricCriteria.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
  sendSuccess(res, null, 'Rubric criterion deleted.');
}));

export default router;
