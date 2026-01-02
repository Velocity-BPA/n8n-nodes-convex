/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, getNextGaugeVoteDate } from '../../utils';
import { SNAPSHOT_SPACE, GAUGE_VOTE_CYCLE_DAYS, VL_CVX_LOCK_DURATION_DAYS } from '../../constants';

export const description: INodeProperties[] = [
  {
    displayName: 'Include Future Dates',
    name: 'futureDates',
    type: 'number',
    default: 6,
    description: 'Number of future gauge vote dates to include',
    displayOptions: {
      show: {
        resource: ['snapshot'],
        operation: ['getVotingSchedule'],
      },
    },
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);
    const futureDates = this.getNodeParameter('futureDates', index, 6) as number;

    // Get current active proposals
    const activeProposals = (await client.subgraph.getActiveProposals()).slice(0, 5);

    // Calculate upcoming gauge vote dates
    const now = new Date();
    const upcomingVotes: Array<{
      date: string;
      formatted: string;
      daysUntil: number;
      isNext: boolean;
    }> = [];

    let nextVote = getNextGaugeVoteDate();
    
    for (let i = 0; i < Math.min(futureDates, 12); i++) {
      const voteDate = new Date(nextVote);
      voteDate.setDate(voteDate.getDate() + (i * GAUGE_VOTE_CYCLE_DAYS));
      
      const daysUntil = Math.floor((voteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      upcomingVotes.push({
        date: voteDate.toISOString(),
        formatted: voteDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        daysUntil,
        isNext: i === 0,
      });
    }

    // Check for currently active votes
    const activeGaugeVotes = activeProposals.filter((p: { title: string }) => 
      p.title?.toLowerCase().includes('gauge') || 
      p.title?.toLowerCase().includes('weight')
    );

    // Calculate lock timing info
    const lockInfo = {
      lockDuration: VL_CVX_LOCK_DURATION_DAYS,
      lockDurationFormatted: `${Math.floor(VL_CVX_LOCK_DURATION_DAYS / 7)} weeks + 1 day`,
      description: 'vlCVX locks are for 16 weeks + 1 day to align with gauge vote epochs',
    };

    return [
      {
        json: {
          currentTime: now.toISOString(),
          gaugeVoteCycle: {
            intervalDays: GAUGE_VOTE_CYCLE_DAYS,
            intervalFormatted: `Every ${GAUGE_VOTE_CYCLE_DAYS} days (bi-weekly)`,
            voteDay: 'Thursday',
            description: 'Gauge weight votes occur every two weeks on Thursday',
          },
          nextGaugeVote: upcomingVotes[0],
          upcomingVotes,
          activeVotes: {
            count: activeGaugeVotes.length,
            proposals: activeGaugeVotes.map((p: {
              id: string;
              title: string;
              end: number;
            }) => ({
              id: p.id,
              title: p.title,
              endTime: new Date(p.end * 1000).toISOString(),
              proposalUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}/proposal/${p.id}`,
            })),
          },
          allActiveProposals: {
            count: activeProposals.length,
            proposals: activeProposals.map((p: {
              id: string;
              title: string;
              end: number;
            }) => ({
              id: p.id,
              title: p.title,
              endTime: new Date(p.end * 1000).toISOString(),
            })),
          },
          vlCvxLockInfo: lockInfo,
          snapshotSpace: SNAPSHOT_SPACE,
          snapshotUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}`,
          votiumUrl: 'https://votium.app',
          hiddenHandUrl: 'https://hiddenhand.finance/convex',
          howToParticipate: [
            '1. Acquire CVX tokens',
            '2. Lock CVX as vlCVX on Convex (16 weeks + 1 day)',
            '3. Wait for the next gauge weight vote to open',
            '4. Vote on Snapshot for your preferred gauges',
            '5. Optionally, delegate to Votium or Hidden Hand for bribes',
          ],
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Voting Schedule');
  }
}
