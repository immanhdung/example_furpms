import 'dotenv/config';
import mongoose from 'mongoose';
import { logger } from '../../configs/logger';
import { seedUsers } from './users.seeder';
import { seedMasterData } from './masterData.seeder';
import { seedCycles } from './cycles.seeder';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env');

  logger.info('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  logger.info('Connected.');

  await seedMasterData();
  await seedUsers();
  await seedCycles();

  logger.info('All seeders completed successfully.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Seeder failed:', err);
  process.exit(1);
});
