/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, getNextGaugeVoteDate } from '../../utils';
import { GAUGE_VOTE_PARAMS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get gauge weight vote proposals from Snapshot
    const gaugeVotes = await client.subgraph.getGaugeWeightVotes(10);
    const nextVoteDate = getNextGaugeVoteDate();

    // Transform proposals to gauge vote format
    const formattedVotes = gaugeVotes.map((vote) => ({
      id: vote.id,
      title: vote.title,
      state: vote.state,
      start: new Date(vote.start * 1000).toISOString(),
      end: new Date(vote.end * 1000).toISOString(),
      choices: vote.choices,
      scores: vote.scores,
      scoresTotal: vote.scores_total,
      totalVotes: vote.votes,
    }));

    return [
      {
        json: {
          gaugeVoting: {
            description: 'Bi-weekly vote directing CRV emissions to Curve gauges',
            frequency: `Every ${GAUGE_VOTE_PARAMS.cycleDuration} days`,
            nextVote: nextVoteDate.toISOString(),
            platform: 'Snapshot',
            space: 'cvx.eth',
          },
          recentVotes: formattedVotes,
          votingPower: {
            source: 'vlCVX',
            multiplier: 'Time-weighted based on lock duration',
          },
          impact: {
            description: 'Gauge votes determine CRV emission allocation',
            beneficiaries: 'Pools receiving more votes get higher CRV rewards',
            bribeIncentive: 'Protocols offer bribes to attract votes to their gauges',
          },
          howToParticipate: [
            'Lock CVX to receive vlCVX',
            'Wait for gauge vote round to start',
            'Vote on Snapshot for preferred gauges',
            'Claim bribes from Votium or Hidden Hand',
          ],
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Gauge Votes');
  }
}
