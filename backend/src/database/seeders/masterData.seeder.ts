import { BudgetExpenseCategory } from '../../modules/master-data/models/budgetExpenseCategory.model';
import { FinancialConfig } from '../../modules/master-data/models/financialConfig.model';
import { PersonnelRoleType } from '../../modules/master-data/models/personnelRoleType.model';
import { ProductCategory } from '../../modules/master-data/models/productCategory.model';
import { OrganizationalUnit } from '../../modules/master-data/models/organizationalUnit.model';
import { RubricCriteria } from '../../modules/master-data/models/rubricCriteria.model';
import { logger } from '../../configs/logger';

// 12 budget categories per Mẫu 3 - FPT University regulations
const budgetCategories = [
  { code: 'LABOR', name: 'Công lao động trực tiếp', sequence: 1 },
  { code: 'EQUIPMENT_PURCHASE', name: 'Mua sắm trang thiết bị nghiên cứu', sequence: 2 },
  { code: 'EQUIPMENT_REPAIR', name: 'Sửa chữa, bảo dưỡng thiết bị', sequence: 3 },
  { code: 'MATERIALS', name: 'Nguyên vật liệu, nhiên liệu, năng lượng', sequence: 4 },
  { code: 'SURVEY', name: 'Chi phí khảo sát, thực địa, thu thập số liệu', sequence: 5 },
  { code: 'WORKSHOP', name: 'Chi phí hội thảo, hội nghị khoa học', sequence: 6 },
  { code: 'EXPERT', name: 'Chi phí thuê chuyên gia trong và ngoài nước', sequence: 7 },
  { code: 'PUBLISH', name: 'Chi phí công bố, phổ biến kết quả', sequence: 8 },
  { code: 'MANAGEMENT', name: 'Chi phí quản lý', sequence: 9 },
  { code: 'TRAINING', name: 'Chi phí đào tạo', sequence: 10 },
  { code: 'MISC', name: 'Chi phí khác trực tiếp', sequence: 11 },
  { code: 'OVERHEAD', name: 'Chi phí gián tiếp (overhead)', sequence: 12 },
];

const financialConfigs = [
  { key: 'BASE_DAILY_SALARY', value: 1490000, unit: 'VND', description: 'Mức lương tối thiểu vùng / ngày (Mức lương cơ sở 1.800.000 đ × 20 ngày công) — theo QĐ 543 FPT' },
  { key: 'MAX_LABOR_PERCENTAGE', value: 70, unit: '%', description: 'Tỷ lệ tối đa chi công lao động / tổng kinh phí' },
  { key: 'MANAGEMENT_PERCENTAGE', value: 5, unit: '%', description: 'Tỷ lệ chi phí quản lý / tổng kinh phí' },
  { key: 'MAX_PROJECT_BUDGET_APPLIED', value: 1000000000, unit: 'VND', description: 'Ngưỡng kinh phí tối đa cho đề tài ứng dụng' },
  { key: 'MAX_PROJECT_BUDGET_BASIC', value: 500000000, unit: 'VND', description: 'Ngưỡng kinh phí tối đa cho đề tài cơ bản' },
];

const personnelRoleTypes = [
  { code: 'CNNV', name: 'Chủ nhiệm nhiệm vụ', description: 'Chủ nhiệm đề tài' },
  { code: 'TKKH', name: 'Thư ký khoa học', description: 'Thư ký khoa học của đề tài' },
  { code: 'TVC', name: 'Thành viên chính', description: 'Thành viên nghiên cứu chính' },
  { code: 'TV', name: 'Thành viên', description: 'Thành viên nghiên cứu' },
  { code: 'KTV', name: 'Kỹ thuật viên', description: 'Kỹ thuật viên hỗ trợ nghiên cứu' },
];

const productCategories = [
  { code: 'JOURNAL_INT', name: 'Bài báo tạp chí quốc tế (ISI/Scopus)', description: 'Bài báo đăng trên tạp chí quốc tế có chỉ số ISI/Scopus' },
  { code: 'JOURNAL_DOM', name: 'Bài báo tạp chí trong nước', description: 'Bài báo đăng trên tạp chí khoa học trong nước' },
  { code: 'CONFERENCE_INT', name: 'Báo cáo hội nghị quốc tế', description: 'Bài báo trình bày tại hội nghị quốc tế' },
  { code: 'CONFERENCE_DOM', name: 'Báo cáo hội nghị trong nước', description: 'Bài báo trình bày tại hội nghị trong nước' },
  { code: 'PATENT', name: 'Bằng sáng chế / Giải pháp hữu ích', description: 'Bằng sáng chế hoặc giải pháp hữu ích được cấp' },
  { code: 'SOFTWARE', name: 'Phần mềm / Ứng dụng', description: 'Sản phẩm phần mềm, ứng dụng có thực tế' },
  { code: 'PROTOTYPE', name: 'Mẫu thử nghiệm / Thiết bị', description: 'Mô hình, mẫu thử nghiệm hoặc thiết bị' },
  { code: 'TRAINING_MATERIAL', name: 'Tài liệu đào tạo', description: 'Giáo trình, tài liệu phục vụ đào tạo' },
  { code: 'REPORT', name: 'Báo cáo tổng hợp / Đề xuất chính sách', description: 'Báo cáo phân tích, đề xuất chính sách' },
  { code: 'OTHER', name: 'Sản phẩm khác', description: 'Các sản phẩm khác theo đặc thù đề tài' },
];

const organizationalUnits = [
  { code: 'FPT_UNIV', name: 'Trường Đại học FPT', shortName: 'FPT' },
  { code: 'SE', name: 'Khoa Kỹ thuật Phần mềm', shortName: 'SE' },
  { code: 'IS', name: 'Khoa Hệ thống Thông tin', shortName: 'IS' },
  { code: 'CS', name: 'Khoa Khoa học Máy tính', shortName: 'CS' },
  { code: 'AI', name: 'Khoa Trí tuệ Nhân tạo', shortName: 'AI' },
  { code: 'BA', name: 'Khoa Kinh doanh', shortName: 'BA' },
  { code: 'GE', name: 'Khoa Cơ sở - Đại cương', shortName: 'GE' },
  { code: 'RMO', name: 'Phòng Quản lý Khoa học & Công nghệ', shortName: 'RMO' },
  { code: 'ADMIN', name: 'Ban Giám hiệu', shortName: 'BGH' },
];

const rubricCriteriaScreening = [
  { code: 'SCR_RELEVANCE', name: 'Tính phù hợp với định hướng nghiên cứu', roundType: 'SCREENING', maxScore: 10, weight: 1, sequence: 1 },
  { code: 'SCR_INNOVATION', name: 'Tính mới và sáng tạo', roundType: 'SCREENING', maxScore: 10, weight: 1, sequence: 2 },
  { code: 'SCR_FEASIBILITY', name: 'Tính khả thi', roundType: 'SCREENING', maxScore: 10, weight: 1, sequence: 3 },
  { code: 'SCR_TEAM', name: 'Năng lực nhóm nghiên cứu', roundType: 'SCREENING', maxScore: 10, weight: 1, sequence: 4 },
];

const rubricCriteriaReview = [
  { code: 'REV_SCIENTIFIC', name: 'Giá trị khoa học', roundType: 'REVIEW', maxScore: 25, weight: 2.5, sequence: 1 },
  { code: 'REV_INNOVATION', name: 'Tính sáng tạo', roundType: 'REVIEW', maxScore: 20, weight: 2, sequence: 2 },
  { code: 'REV_PRACTICAL', name: 'Ý nghĩa thực tiễn', roundType: 'REVIEW', maxScore: 20, weight: 2, sequence: 3 },
  { code: 'REV_METHODOLOGY', name: 'Phương pháp nghiên cứu', roundType: 'REVIEW', maxScore: 15, weight: 1.5, sequence: 4 },
  { code: 'REV_OUTPUT', name: 'Kết quả dự kiến', roundType: 'REVIEW', maxScore: 10, weight: 1, sequence: 5 },
  { code: 'REV_BUDGET', name: 'Tính hợp lý của kinh phí', roundType: 'REVIEW', maxScore: 10, weight: 1, sequence: 6 },
];

const rubricCriteriaAcceptance = [
  { code: 'ACC_COMPLETION', name: 'Mức độ hoàn thành mục tiêu', roundType: 'ACCEPTANCE', maxScore: 30, weight: 3, sequence: 1 },
  { code: 'ACC_QUALITY', name: 'Chất lượng sản phẩm', roundType: 'ACCEPTANCE', maxScore: 30, weight: 3, sequence: 2 },
  { code: 'ACC_IMPACT', name: 'Tác động và ứng dụng', roundType: 'ACCEPTANCE', maxScore: 20, weight: 2, sequence: 3 },
  { code: 'ACC_REPORT', name: 'Chất lượng báo cáo tổng kết', roundType: 'ACCEPTANCE', maxScore: 20, weight: 2, sequence: 4 },
];

export const seedMasterData = async (): Promise<void> => {
  logger.info('Seeding master data...');

  // Budget categories
  for (const cat of budgetCategories) {
    await BudgetExpenseCategory.findOneAndUpdate({ code: cat.code }, cat, { upsert: true, new: true });
  }
  logger.info(`Budget categories: ${budgetCategories.length} seeded.`);

  // Financial configs
  for (const config of financialConfigs) {
    await FinancialConfig.findOneAndUpdate({ key: config.key }, config, { upsert: true, new: true });
  }
  logger.info(`Financial configs: ${financialConfigs.length} seeded.`);

  // Personnel role types
  for (const role of personnelRoleTypes) {
    await PersonnelRoleType.findOneAndUpdate({ code: role.code }, role, { upsert: true, new: true });
  }
  logger.info(`Personnel role types: ${personnelRoleTypes.length} seeded.`);

  // Product categories
  for (const cat of productCategories) {
    await ProductCategory.findOneAndUpdate({ code: cat.code }, cat, { upsert: true, new: true });
  }
  logger.info(`Product categories: ${productCategories.length} seeded.`);

  // Organizational units
  for (const unit of organizationalUnits) {
    await OrganizationalUnit.findOneAndUpdate({ code: unit.code }, unit, { upsert: true, new: true });
  }
  logger.info(`Organizational units: ${organizationalUnits.length} seeded.`);

  // Rubric criteria
  const allRubrics = [...rubricCriteriaScreening, ...rubricCriteriaReview, ...rubricCriteriaAcceptance];
  for (const rubric of allRubrics) {
    await RubricCriteria.findOneAndUpdate({ code: rubric.code }, rubric, { upsert: true, new: true });
  }
  logger.info(`Rubric criteria: ${allRubrics.length} seeded.`);
};
