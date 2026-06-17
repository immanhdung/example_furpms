import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../../configs/database';
import { logger } from '../../configs/logger';
import { seedUsers } from './users.seeder';
import { seedMasterData } from './masterData.seeder';
import { seedCycles } from './cycles.seeder';

const runSeed = async (): Promise<void> => {
  logger.info('Starting database seeding...');
  await connectDatabase();

  try {
    await seedUsers();
    await seedMasterData();
    await seedCycles();
    logger.info('Database seeding completed successfully.');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
};

runSeed().catch((err) => {
  logger.error('Seed script failed:', err);
  process.exit(1);
});
