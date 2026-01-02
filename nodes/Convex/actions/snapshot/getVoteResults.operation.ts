/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties, IDataObject } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatNumber } from '../../utils';
import { SNAPSHOT_SPACE } from '../../constants';
import type { SnapshotProposal } from '../../transport/subgraph';

export const description: INodeProperties[] = [
  {
    displayName: 'Proposal ID',
    name: 'proposalId',
    type: 'string',
    default: '',
    required: false,
    description: 'Specific proposal ID (leave empty for recent closed proposals)',
    displayOptions: {
      show: {
        resource: ['snapshot'],
        operation: ['getVoteResults'],
      },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 10,
    description: 'Number of recent closed proposals to return (if no ID specified)',
    displayOptions: {
      show: {
        resource: ['snapshot'],
        operation: ['getVoteResults'],
      },
    },
  },
  {
    displayName: 'Include Vote Details',
    name: 'includeVotes',
    type: 'boolean',
    default: false,
    description: 'Whether to include individual vote details',
    displayOptions: {
      show: {
        resource: ['snapshot'],
        operation: ['getVoteResults'],
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
    const proposalId = this.getNodeParameter('proposalId', index, '') as string;
    const limit = this.getNodeParameter('limit', index, 10) as number;
    const includeVotes = this.getNodeParameter('includeVotes', index, false) as boolean;

    if (proposalId) {
      // Get specific proposal
      const proposal = await client.subgraph.getProposalById(proposalId);
      
      if (!proposal) {
        return [
          {
            json: {
              error: 'Proposal not found',
              proposalId,
              snapshotUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}`,
            },
          },
        ];
      }

      // Calculate vote distribution
      const totalScore = proposal.scores_total || 1;
      const voteDistribution = proposal.choices.map((choice: string, i: number) => ({
        choice,
        score: proposal.scores?.[i] || 0,
        percentage: ((proposal.scores?.[i] || 0) / totalScore * 100).toFixed(2) + '%',
      }));
      voteDistribution.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

      // Determine winner
      const winner = voteDistribution[0];

      const result: Record<string, unknown> = {
        id: proposal.id,
        title: proposal.title,
        state: proposal.state,
        startTime: new Date(proposal.start * 1000).toISOString(),
        endTime: new Date(proposal.end * 1000).toISOString(),
        author: proposal.author,
        totalVotes: proposal.votes,
        totalVotesFormatted: formatNumber(proposal.votes),
        totalVotingPower: proposal.scores_total,
        totalVotingPowerFormatted: formatNumber(proposal.scores_total),
        quorum: proposal.quorum,
        quorumReached: proposal.scores_total >= (proposal.quorum || 0),
        winner: {
          choice: winner.choice,
          score: winner.score,
          percentage: winner.percentage,
        },
        voteDistribution,
        proposalUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}/proposal/${proposal.id}`,
      };

      // Optionally include individual votes
      if (includeVotes) {
        const votes = await client.subgraph.getProposalVotes(proposalId, 100);
        result.votes = votes.map((vote: {
          voter: string;
          choice: number | number[];
          vp: number;
          created: number;
        }) => ({
          voter: vote.voter,
          choice: Array.isArray(vote.choice) 
            ? vote.choice.map((c: number) => proposal.choices[c - 1])
            : proposal.choices[(vote.choice as number) - 1],
          votingPower: vote.vp,
          votingPowerFormatted: formatNumber(vote.vp),
          timestamp: new Date(vote.created * 1000).toISOString(),
        }));
      }

      return [{ json: result as IDataObject }];
    }

    // Get recent closed proposals
    const proposals = await client.subgraph.getAllProposals(limit);
    const now = Math.floor(Date.now() / 1000);
    const closedProposals = proposals.filter((p: { end: number }) => p.end < now);

    if (closedProposals.length === 0) {
      return [
        {
          json: {
            message: 'No closed proposals found',
            snapshotSpace: SNAPSHOT_SPACE,
            snapshotUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}`,
          },
        },
      ];
    }

    const results = closedProposals.map((proposal: SnapshotProposal) => {
      const totalScore = proposal.scores_total || 1;
      const voteDistribution = proposal.choices.map((choice: string, i: number) => ({
        choice,
        score: proposal.scores?.[i] || 0,
        percentage: ((proposal.scores?.[i] || 0) / totalScore * 100).toFixed(2) + '%',
      }));
      voteDistribution.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

      const winner = voteDistribution[0];

      return {
        json: {
          id: proposal.id,
          title: proposal.title,
          state: proposal.state,
          endTime: new Date(proposal.end * 1000).toISOString(),
          totalVotes: proposal.votes,
          totalVotingPower: proposal.scores_total,
          quorumReached: proposal.scores_total >= (proposal.quorum || 0),
          winner: {
            choice: winner.choice,
            percentage: winner.percentage,
          },
          topChoices: voteDistribution.slice(0, 5),
          proposalUrl: `https://snapshot.org/#/${SNAPSHOT_SPACE}/proposal/${proposal.id}`,
        },
      };
    });

    return results;
  } catch (error) {
    handleApiError(this, error, 'Get Vote Results');
  }
}
