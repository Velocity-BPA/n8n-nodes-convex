/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatPercentage } from '../../utils';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get CVX price
    const cvxPrice = await client.defiLlama.getCvxPrice();

    // Estimate bribe revenue (typically $1-5M per voting round)
    const estimatedWeeklyBribes = 2_500_000;
    const estimatedLockedCvx = 50_000_000;
    const estimatedAnnualBribes = estimatedWeeklyBribes * 26; // Bi-weekly votes

    // Calculate per CVX metrics
    const bribePerCvxWeekly = estimatedWeeklyBribes / estimatedLockedCvx;
    const bribePerCvxAnnual = estimatedAnnualBribes / estimatedLockedCvx;
    const bribeApr = (bribePerCvxAnnual / cvxPrice) * 100;

    return [
      {
        json: {
          bribeMarkets: [
            {
              name: 'Votium',
              url: 'https://votium.app',
              description: 'Primary bribe market for vlCVX holders',
            },
            {
              name: 'Hidden Hand',
              url: 'https://hiddenhand.finance',
              description: 'Alternative bribe marketplace',
            },
          ],
          estimates: {
            weeklyBribeRevenue: estimatedWeeklyBribes,
            weeklyBribeRevenueFormatted: formatUsd(estimatedWeeklyBribes),
            annualBribeRevenue: estimatedAnnualBribes,
            annualBribeRevenueFormatted: formatUsd(estimatedAnnualBribes),
            bribePerCvxWeekly,
            bribePerCvxAnnual,
            estimatedBribeApr: bribeApr,
            estimatedBribeAprFormatted: formatPercentage(bribeApr),
          },
          requirements: {
            mustVote: true,
            votingPlatform: 'Snapshot (cvx.eth)',
            claimProcess: 'Claim on respective bribe platform',
          },
          commonBribeTokens: [
            'CVX',
            'CRV',
            'FXS',
            'SPELL',
            'Various protocol tokens',
          ],
          disclaimer: 'Bribe amounts vary significantly each voting round based on protocol demand',
          cvxPrice,
          estimatedLockedCvx,
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Bribe Revenue');
  }
}
