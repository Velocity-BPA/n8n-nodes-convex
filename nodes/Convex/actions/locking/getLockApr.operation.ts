/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatPercentage } from '../../utils';
import { CONVEX_FEES } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get token prices
    const cvxPrice = await client.defiLlama.getCvxPrice();
    
    // Estimate vlCVX APR (typically 15-40% depending on bribe revenue)
    // vlCVX holders receive:
    // 1. 5% of CRV rewards as platform fee
    // 2. Bribe revenue from protocols seeking gauge votes
    const platformFeeApr = 5; // Base fee share
    const estimatedBribeApr = 15; // Estimated bribe revenue APR
    const totalApr = platformFeeApr + estimatedBribeApr;

    return [
      {
        json: {
          totalApr,
          totalAprFormatted: formatPercentage(totalApr),
          breakdown: {
            platformFees: {
              apr: platformFeeApr,
              aprFormatted: formatPercentage(platformFeeApr),
              percentage: CONVEX_FEES.vlCvxHolders.percentage,
              description: 'Share of platform CRV rewards',
            },
            bribes: {
              estimatedApr: estimatedBribeApr,
              estimatedAprFormatted: formatPercentage(estimatedBribeApr),
              description: 'Revenue from gauge vote incentives',
              note: 'Varies based on gauge vote participation',
            },
          },
          cvxPrice,
          rewardTokens: ['cvxCRV', 'Various bribe tokens'],
          claimFrequency: 'Weekly (after gauge vote)',
          requirements: {
            minLock: '1 CVX',
            lockDuration: '16 weeks + 1 day',
            voting: 'Must vote to receive bribes',
          },
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Lock APR');
  }
}
