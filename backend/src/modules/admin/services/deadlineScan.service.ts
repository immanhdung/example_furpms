import { logger } from '../../../configs/logger';
import { Deliverable } from '../../deliverables/models/deliverable.model';
import { Contract } from '../../contracts/models/contract.model';
import { Proposal } from '../../proposals/models/proposal.model';
import { createNotification } from '../../notifications/routes/notification.routes';
import { NOTIFICATION_TYPE } from '../../../constants/status';

let systemClockOffsetDays = 0;

export const getSystemDate = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + systemClockOffsetDays);
  return d;
};

export const setSystemClockOffset = (offsetDays: number): void => {
  systemClockOffsetDays = offsetDays;
  logger.info(`System clock offset set to ${offsetDays} days`);
};

export const getSystemClockOffset = (): number => systemClockOffsetDays;

export const runDeadlineScan = async (): Promise<{ scanned: number; notified: number }> => {
  const now = getSystemDate();
  let notified = 0;

  // Find deliverables approaching due date
  const thresholds = [30, 14, 7, 0]; // days before due

  const deliverables = await Deliverable.find({
    isDeleted: false,
    acceptanceStatus: 'PENDING',
    dueDate: { $gte: now },
  }).populate({ path: 'contractId', populate: { path: 'proposalId', select: 'piId' } });

  for (const deliverable of deliverables) {
    const daysUntilDue = Math.ceil(
      (deliverable.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    for (const threshold of thresholds) {
      if (daysUntilDue === threshold) {
        const contract = deliverable.contractId as unknown as typeof Contract.prototype;
        const proposal = (contract as unknown as { proposalId: { piId: string } }).proposalId;

        if (proposal?.piId) {
          const notifType = threshold === 0 ? NOTIFICATION_TYPE.DELIVERABLE_OVERDUE : NOTIFICATION_TYPE.DELIVERABLE_DUE;
          await createNotification({
            userId: proposal.piId.toString(),
            type: notifType,
            title: threshold === 0 ? 'Deliverable Overdue' : `Deliverable Due in ${threshold} Days`,
            message: `Deliverable "${deliverable.name}" is ${threshold === 0 ? 'overdue' : `due in ${threshold} days`}.`,
            referenceId: deliverable._id.toString(),
            referenceType: 'Deliverable',
          });
          notified++;
        }
        break;
      }
    }
  }

  logger.info(`Deadline scan complete: checked ${deliverables.length} deliverables, sent ${notified} notifications`);
  return { scanned: deliverables.length, notified };
};

export const startDeadlineScanJob = (): void => {
  const INTERVAL_MS = 60 * 60 * 1000; // every hour
  setInterval(() => {
    runDeadlineScan().catch((err) => logger.error('Deadline scan error:', err));
  }, INTERVAL_MS);
  logger.info('Deadline scan job started (runs every hour)');
};
