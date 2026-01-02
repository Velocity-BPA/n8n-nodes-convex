/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatNumber } from '../../utils';
import { SNAPSHOT_SPACE } from '../../constants';
import { SnapshotProposal } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 10,
    description: 'Maximum number of proposals to return',
    displayOptions: {
      show: {
        resource: ['snapshot'],
        operation: ['getActiveProposals'],
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
    const limit = this.getNodeParameter('limit', index, 10) as number;

    // Get active proposals from Snapshot
    const proposals = await client.subgraph.getActiveProposals();
    const limitedProposals = proposals.slice(0, limit);

    if (!limitedProposals || limitedProposals.length === 0) {
      return [
        {
          json: {
            message: 'No active proposals found',
            snapshotSpace: SNAPSHOT_SPACE,
            snapshotUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}`,
            note: 'Check Snapshot directly for the latest governance activity',
          },
        },
      ];
    }

    const results = limitedProposals.map((proposal: SnapshotProposal) => {
      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = proposal.end - now;
      const daysRemaining = Math.floor(timeRemaining / 86400);
      const hoursRemaining = Math.floor((timeRemaining % 86400) / 3600);

      return {
        json: {
          id: proposal.id,
          title: proposal.title,
          body: proposal.body?.substring(0, 500) + (proposal.body?.length > 500 ? '...' : ''),
          choices: proposal.choices,
          startTime: new Date(proposal.start * 1000).toISOString(),
          endTime: new Date(proposal.end * 1000).toISOString(),
          timeRemaining: {
            days: daysRemaining,
            hours: hoursRemaining,
            formatted: `${daysRemaining}d ${hoursRemaining}h`,
          },
          state: proposal.state,
          author: proposal.author,
          scores: proposal.scores,
          scoresTotal: proposal.scores_total,
          scoresTotalFormatted: formatNumber(proposal.scores_total),
          votes: proposal.votes,
          votesFormatted: formatNumber(proposal.votes),
          quorum: proposal.quorum || 0,
          snapshot: proposal.snapshot,
          snapshotSpace: proposal.space?.id || SNAPSHOT_SPACE,
          proposalUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}/proposal/${proposal.id}`,
        },
      };
    });

    return results;
  } catch (error) {
    handleApiError(this, error, 'Get Active Proposals');
  }
}
