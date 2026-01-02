/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { handleApiError, getNextGaugeVoteDate } from '../../utils';
import { VLCVX_PARAMS, GAUGE_VOTE_PARAMS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    // Client initialization deferred for static data

    const now = new Date();
    const nextGaugeVote = getNextGaugeVoteDate();

    // Calculate epoch boundaries
    const currentEpochStart = new Date(now);
    currentEpochStart.setDate(now.getDate() - (now.getDay() + 3) % 7); // Last Thursday
    currentEpochStart.setHours(0, 0, 0, 0);

    const currentEpochEnd = new Date(currentEpochStart);
    currentEpochEnd.setDate(currentEpochStart.getDate() + 7);

    // Calculate lock unlock date for new locks
    const newLockUnlock = new Date(now);
    newLockUnlock.setDate(now.getDate() + VLCVX_PARAMS.lockDuration * 7 + VLCVX_PARAMS.gracePeriod);

    return [
      {
        json: {
          lockParameters: {
            durationWeeks: VLCVX_PARAMS.lockDuration,
            durationDays: VLCVX_PARAMS.lockDuration * 7 + VLCVX_PARAMS.gracePeriod,
            epochDuration: `${VLCVX_PARAMS.epochDuration} week`,
            gracePeriod: `${VLCVX_PARAMS.gracePeriod} day after unlock`,
          },
          currentEpoch: {
            start: currentEpochStart.toISOString(),
            end: currentEpochEnd.toISOString(),
          },
          gaugeVoting: {
            frequency: `Every ${GAUGE_VOTE_PARAMS.cycleDuration} days`,
            nextVote: nextGaugeVote.toISOString(),
            voteDay: 'Thursday',
            snapshotDay: 'Wednesday',
          },
          newLockInfo: {
            lockingNow: now.toISOString(),
            unlockDate: newLockUnlock.toISOString(),
            description: 'If you lock CVX now, it will unlock on this date',
          },
          relockOptions: {
            autoRelock: 'Can enable automatic relocking',
            manualRelock: 'Can relock before expiry for rewards',
            penalty: 'No early unlock penalty (locked until expiry)',
          },
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Lock Schedule');
  }
}
