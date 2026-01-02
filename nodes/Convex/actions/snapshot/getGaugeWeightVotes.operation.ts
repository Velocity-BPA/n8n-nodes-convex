/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatNumber, getNextGaugeVoteDate } from '../../utils';
import { SNAPSHOT_SPACE } from '../../constants';

export const description: INodeProperties[] = [
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 10,
    description: 'Maximum number of gauge vote proposals to return',
    displayOptions: {
      show: {
        resource: ['snapshot'],
        operation: ['getGaugeWeightVotes'],
      },
    },
  },
  {
    displayName: 'Include Past Votes',
    name: 'includePast',
    type: 'boolean',
    default: true,
    description: 'Whether to include historical gauge weight votes',
    displayOptions: {
      show: {
        resource: ['snapshot'],
        operation: ['getGaugeWeightVotes'],
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
    const includePast = this.getNodeParameter('includePast', index, true) as boolean;

    // Get gauge weight votes from Snapshot
    const proposals = await client.subgraph.getGaugeWeightVotes(limit);

    // Get next gauge vote date
    const nextVoteDate = getNextGaugeVoteDate();

    // Filter based on preference
    let filteredProposals = proposals;
    if (!includePast) {
      const now = Math.floor(Date.now() / 1000);
      filteredProposals = proposals.filter((p: { end: number }) => p.end > now);
    }

    if (!filteredProposals || filteredProposals.length === 0) {
      return [
        {
          json: {
            message: 'No gauge weight vote proposals found',
            snapshotSpace: SNAPSHOT_SPACE,
            snapshotUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}`,
            nextGaugeVote: {
              date: nextVoteDate.toISOString(),
              formatted: nextVoteDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            },
            note: 'Gauge weight votes occur bi-weekly on Thursdays',
          },
        },
      ];
    }

    const results: INodeExecutionData[] = filteredProposals.map((proposal: {
      id: string;
      title: string;
      body: string;
      choices: string[];
      start: number;
      end: number;
      state: string;
      author: string;
      scores: number[];
      scores_total: number;
      votes: number;
    }) => {
      const now = Math.floor(Date.now() / 1000);
      const isActive = proposal.end > now && proposal.start <= now;
      
      // Calculate vote distribution
      const totalScore = proposal.scores_total || 1;
      const voteDistribution = proposal.choices.map((choice: string, i: number) => ({
        choice,
        score: proposal.scores?.[i] || 0,
        percentage: ((proposal.scores?.[i] || 0) / totalScore * 100).toFixed(2) + '%',
      }));

      // Sort by score descending
      voteDistribution.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

      return {
        json: {
          id: proposal.id,
          title: proposal.title,
          isGaugeWeightVote: true,
          isActive,
          state: proposal.state,
          startTime: new Date(proposal.start * 1000).toISOString(),
          endTime: new Date(proposal.end * 1000).toISOString(),
          author: proposal.author,
          totalVotes: proposal.votes,
          totalVotesFormatted: formatNumber(proposal.votes),
          totalVotingPower: proposal.scores_total,
          totalVotingPowerFormatted: formatNumber(proposal.scores_total),
          topChoices: voteDistribution.slice(0, 10),
          allChoicesCount: proposal.choices.length,
          proposalUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}/proposal/${proposal.id}`,
          description: 'Gauge weight votes determine CRV emissions allocation across Curve pools',
        },
      };
    });

    // Add next vote info to first result
    if (results.length > 0) {
      (results[0].json as Record<string, unknown>).nextGaugeVote = {
        date: nextVoteDate.toISOString(),
        formatted: nextVoteDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };
    }

    return results;
  } catch (error) {
    handleApiError(this, error, 'Get Gauge Weight Votes');
  }
}
