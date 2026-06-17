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

/**
 * @swagger
 * tags:
 *   name: Master Data
 *   description: System configuration and lookup data
 */

/**
 * @swagger
 * /api/budget-expense-categories:
 *   get:
 *     summary: List all budget expense categories
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Budget expense categories retrieved
 *   post:
 *     summary: Create a budget expense category (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string, example: LAB }
 *               name: { type: string, example: Lao động }
 *               description: { type: string }
 *               sequence: { type: integer }
 *     responses:
 *       201:
 *         description: Category created
 */
router.get('/budget-expense-categories', authenticate, asyncHandler(async (_req, res) => {
  const items = await BudgetExpenseCategory.find({ isDeleted: false }).sort({ sequence: 1 }).lean();
  sendSuccess(res, items, 'Budget expense categories retrieved.');
}));

/**
 * @swagger
 * /api/budget-expense-categories/{id}:
 *   get:
 *     summary: Get budget expense category by ID
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category retrieved
 *   put:
 *     summary: Update budget expense category (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Category updated
 */
router.get('/budget-expense-categories/:id', authenticate, asyncHandler(async (req, res) => {
  const item = await BudgetExpenseCategory.findOne({ _id: req.params.id, isDeleted: false }).lean();
  if (!item) return sendSuccess(res, null, 'Not found.' );
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

/**
 * @swagger
 * /api/financial-configs:
 *   get:
 *     summary: List all financial configurations
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Financial configs retrieved
 */
router.get('/financial-configs', authenticate, asyncHandler(async (_req, res) => {
  const items = await FinancialConfig.find({ isDeleted: false, isActive: true }).lean();
  sendSuccess(res, items, 'Financial configs retrieved.');
}));

/**
 * @swagger
 * /api/financial-configs/{key}:
 *   put:
 *     summary: Update a financial config value (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         example: BASE_DAILY_SALARY
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value: { type: number }
 *               unit: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Financial config updated
 */
router.put('/financial-configs/:key', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { value, unit, description } = req.body;
  const item = await FinancialConfig.findOneAndUpdate(
    { key: req.params.key },
    { value, unit, description, updatedBy: req.user?.sub },
    { new: true, upsert: true },
  );
  sendSuccess(res, item, 'Financial config updated.');
}));

/**
 * @swagger
 * /api/personnel-role-types:
 *   get:
 *     summary: List personnel role types
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Personnel role types retrieved
 *   post:
 *     summary: Create personnel role type (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               dailyRateMultiplier: { type: number }
 *     responses:
 *       201:
 *         description: Personnel role type created
 */
router.get('/personnel-role-types', authenticate, asyncHandler(async (_req, res) => {
  const items = await PersonnelRoleType.find({ isDeleted: false }).sort({ code: 1 }).lean();
  sendSuccess(res, items, 'Personnel role types retrieved.');
}));

router.post('/personnel-role-types', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await new PersonnelRoleType(req.body).save();
  sendCreated(res, item, 'Personnel role type created.');
}));

/**
 * @swagger
 * /api/personnel-role-types/{id}:
 *   put:
 *     summary: Update personnel role type (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/personnel-role-types/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await PersonnelRoleType.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, item, 'Personnel role type updated.');
}));

/**
 * @swagger
 * /api/product-categories:
 *   get:
 *     summary: List product categories
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Product categories retrieved
 *   post:
 *     summary: Create product category (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Product category created
 */
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

/**
 * @swagger
 * /api/product-categories/{id}:
 *   put:
 *     summary: Update product category (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/product-categories/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await ProductCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, item, 'Product category updated.');
}));

/**
 * @swagger
 * /api/organizational-units:
 *   get:
 *     summary: List organizational units
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Organizational units retrieved
 *   post:
 *     summary: Create organizational unit (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               type: { type: string, enum: [DEPARTMENT, FACULTY, CENTER] }
 *     responses:
 *       201:
 *         description: Organizational unit created
 */
router.get('/organizational-units', authenticate, asyncHandler(async (_req, res) => {
  const items = await OrganizationalUnit.find({ isDeleted: false }).lean();
  sendSuccess(res, items, 'Organizational units retrieved.');
}));

router.post('/organizational-units', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await new OrganizationalUnit(req.body).save();
  sendCreated(res, item, 'Organizational unit created.');
}));

/**
 * @swagger
 * /api/organizational-units/{id}:
 *   put:
 *     summary: Update organizational unit (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/organizational-units/:id', authenticate, authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const item = await OrganizationalUnit.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, item, 'Organizational unit updated.');
}));

/**
 * @swagger
 * /api/rubric-criteria:
 *   get:
 *     summary: List rubric criteria
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: roundType
 *         schema: { type: string, enum: [SCREENING, REVIEW, ACCEPTANCE] }
 *     responses:
 *       200:
 *         description: Rubric criteria retrieved
 *   post:
 *     summary: Create rubric criterion (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, maxScore]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               maxScore: { type: number }
 *               roundType: { type: string }
 *               sequence: { type: integer }
 *     responses:
 *       201:
 *         description: Rubric criterion created
 */
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

/**
 * @swagger
 * /api/rubric-criteria/{id}:
 *   put:
 *     summary: Update rubric criterion (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete rubric criterion (Admin only)
 *     tags: [Master Data]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
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
