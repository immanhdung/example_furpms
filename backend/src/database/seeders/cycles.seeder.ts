import { Cycle } from '../../modules/cycles/models/cycle.model';
import { Track } from '../../modules/tracks/models/track.model';
import { User } from '../../modules/users/models/user.model';
import { logger } from '../../configs/logger';

export const seedCycles = async (): Promise<void> => {
  logger.info('Seeding cycles and tracks...');

  // Find staff user to be owner
  const staff = await User.findOne({ roles: 'Staff', isDeleted: false });

  // Create current cycle
  const cycle2026 = await Cycle.findOneAndUpdate(
    { code: 'CYCLE_2026_1' },
    {
      code: 'CYCLE_2026_1',
      name: 'Đợt xét duyệt đề tài NCKH - Kỳ 1/2026',
      year: 2026,
      status: 'OPEN',
      submissionStartDate: new Date('2026-01-01'),
      submissionDeadline: new Date('2026-06-30'),
      reviewDeadline: new Date('2026-09-30'),
      description: 'Đợt xét duyệt đề tài nghiên cứu khoa học kỳ 1 năm 2026 của Trường Đại học FPT',
      totalBudget: 5000000000,
    },
    { upsert: true, new: true },
  );
  logger.info(`Cycle created: ${cycle2026.name}`);

  // Create tracks
  const tracks = [
    { code: 'AI_ML', name: 'Trí tuệ Nhân tạo & Học máy', description: 'Các đề tài về AI, Machine Learning, Deep Learning' },
    { code: 'SOFTWARE', name: 'Công nghệ Phần mềm', description: 'Các đề tài về phát triển phần mềm, kiến trúc hệ thống' },
    { code: 'NETWORK_SECURITY', name: 'Mạng máy tính & An ninh thông tin', description: 'Các đề tài về mạng, bảo mật, an toàn thông tin' },
    { code: 'DATA_SCIENCE', name: 'Khoa học Dữ liệu & Phân tích', description: 'Các đề tài về big data, phân tích dữ liệu, BI' },
    { code: 'EDUCATION_TECH', name: 'Công nghệ Giáo dục', description: 'Các đề tài về ứng dụng công nghệ trong giáo dục' },
    { code: 'BUSINESS_INNOVATION', name: 'Đổi mới & Khởi nghiệp', description: 'Các đề tài về đổi mới sáng tạo, khởi nghiệp, fintech' },
  ];

  for (const trackData of tracks) {
    await Track.findOneAndUpdate(
      { code: trackData.code },
      { ...trackData, isActive: true, ownerId: staff?._id },
      { upsert: true, new: true },
    );
  }
  logger.info(`Tracks seeded: ${tracks.length} tracks created.`);

  // Create a planning cycle for next year
  await Cycle.findOneAndUpdate(
    { code: 'CYCLE_2026_2' },
    {
      code: 'CYCLE_2026_2',
      name: 'Đợt xét duyệt đề tài NCKH - Kỳ 2/2026',
      year: 2026,
      status: 'PLANNING',
      submissionStartDate: new Date('2026-07-01'),
      submissionDeadline: new Date('2026-12-31'),
      description: 'Đợt xét duyệt đề tài nghiên cứu khoa học kỳ 2 năm 2026 (đang lên kế hoạch)',
      totalBudget: 4000000000,
    },
    { upsert: true, new: true },
  );
  logger.info('Planning cycle created for Q2 2026.');
};
