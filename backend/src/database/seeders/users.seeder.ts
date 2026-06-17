import bcrypt from 'bcryptjs';
import { User } from '../../modules/users/models/user.model';
import { logger } from '../../configs/logger';

const SALT_ROUNDS = 12;

const users = [
  {
    email: 'admin@furpms.edu.vn',
    fullName: 'System Administrator',
    password: 'Admin@123456',
    roles: ['Admin'],
    department: 'IT Department',
    status: 'ACTIVE',
  },
  {
    email: 'staff@furpms.edu.vn',
    fullName: 'Research Staff',
    password: 'Staff@123456',
    roles: ['Staff'],
    department: 'Research Management Office',
    status: 'ACTIVE',
  },
  {
    email: 'faculty@furpms.edu.vn',
    fullName: 'Associate Professor Dr. Nguyen Van An',
    password: 'Faculty@123456',
    roles: ['Faculty'],
    department: 'Software Engineering',
    academicDegree: 3,
    status: 'ACTIVE',
  },
  {
    email: 'faculty2@furpms.edu.vn',
    fullName: 'Dr. Tran Thi Bich',
    password: 'Faculty@123456',
    roles: ['Faculty'],
    department: 'Information Systems',
    academicDegree: 2,
    status: 'ACTIVE',
  },
  {
    email: 'reviewer@furpms.edu.vn',
    fullName: 'Professor Dr. Le Van Cuong',
    password: 'Reviewer@123456',
    roles: ['ReviewCommittee'],
    department: 'Computer Science',
    academicDegree: 4,
    status: 'ACTIVE',
  },
  {
    email: 'reviewer2@furpms.edu.vn',
    fullName: 'Dr. Pham Thi Dung',
    password: 'Reviewer@123456',
    roles: ['ReviewCommittee'],
    department: 'Applied Mathematics',
    academicDegree: 2,
    status: 'ACTIVE',
  },
  {
    email: 'admin.staff@furpms.edu.vn',
    fullName: 'Senior Administrator',
    password: 'Admin@123456',
    roles: ['Admin', 'Staff'],
    department: 'Administration',
    status: 'ACTIVE',
  },
];

export const seedUsers = async (): Promise<void> => {
  logger.info('Seeding users...');

  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      logger.info(`User ${userData.email} already exists, skipping.`);
      continue;
    }

    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
    await User.create({
      email: userData.email,
      passwordHash,
      fullName: userData.fullName,
      roles: userData.roles,
      department: userData.department,
      academicDegree: userData.academicDegree,
      status: userData.status,
    });
    logger.info(`Created user: ${userData.email} (${userData.roles.join(', ')})`);
  }

  logger.info(`Users seeded: ${users.length} users processed.`);
};
