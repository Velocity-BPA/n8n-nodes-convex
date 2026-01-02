/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatPercentage } from '../../utils';
import { CONVEX_FEES, TOTAL_PLATFORM_FEE } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get token prices
    const crvPrice = await client.defiLlama.getCrvPrice();
    const cvxPrice = await client.defiLlama.getCvxPrice();

    // Get pools to estimate reward rates
    const pools = await client.defiLlama.getConvexPools();
    const cvxCrvPools = pools.filter((p) => 
      p.symbol.toLowerCase().includes('cvxcrv') || 
      p.pool.toLowerCase().includes('cvxcrv')
    );

    const estimatedApr = cvxCrvPools.length > 0 
      ? cvxCrvPools[0].apy || 15 
      : 15;

    // cvxCRV stakers receive:
    // 1. 10% of CRV farmed by Convex (as 3CRV)
    // 2. CVX emissions
    const threeCrvApr = estimatedApr * (CONVEX_FEES.cvxCrvStakers.percentage / 100);
    const cvxApr = estimatedApr * 0.3; // Estimated CVX portion

    return [
      {
        json: {
          totalApr: estimatedApr,
          totalAprFormatted: formatPercentage(estimatedApr),
          rewardBreakdown: {
            threeCrv: {
              name: '3CRV',
              description: 'Platform fee distribution',
              estimatedApr: threeCrvApr,
              aprFormatted: formatPercentage(threeCrvApr),
              sourcePercentage: `${CONVEX_FEES.cvxCrvStakers.percentage}% of CRV rewards`,
            },
            cvx: {
              name: 'CVX',
              description: 'CVX token emissions',
              estimatedApr: cvxApr,
              aprFormatted: formatPercentage(cvxApr),
              priceUsd: cvxPrice,
            },
          },
          platformFeeTotal: TOTAL_PLATFORM_FEE,
          cvxCrvStakerFee: CONVEX_FEES.cvxCrvStakers.percentage,
          crvPriceUsd: crvPrice,
          cvxPriceUsd: cvxPrice,
          claimable: ['3CRV', 'CVX'],
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get cvxCRV Rewards');
  }
}
