/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, validateRequiredParam, formatPercentage } from '../../utils';
import { TOTAL_PLATFORM_FEE } from '../../constants';

export const description: INodeProperties[] = [
  {
    displayName: 'Pool ID',
    name: 'poolId',
    type: 'string',
    default: '',
    required: true,
    placeholder: '0x...',
    description: 'The pool address or identifier',
    displayOptions: {
      show: {
        resource: ['pool'],
        operation: ['getPoolRewards'],
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
    const poolId = this.getNodeParameter('poolId', index) as string;

    validateRequiredParam(poolId, 'poolId');

    const pool = await client.defiLlama.getPoolById(poolId);

    if (!pool) {
      return [
        {
          json: {
            error: 'Pool not found',
            poolId,
          },
        },
      ];
    }

    // Calculate reward breakdown
    const rewardApy = pool.apyReward || 0;
    const baseApy = pool.apyBase || 0;

    // Estimate CRV and CVX portions (CVX is typically ~40% of CRV rewards value)
    const crvApyEstimate = rewardApy * 0.6;
    const cvxApyEstimate = rewardApy * 0.4;

    // Extra rewards if any
    const hasExtraRewards = pool.rewardTokens && pool.rewardTokens.length > 2;

    return [
      {
        json: {
          poolId: pool.pool,
          symbol: pool.symbol,
          totalRewardApy: rewardApy,
          totalRewardApyFormatted: formatPercentage(rewardApy),
          rewardBreakdown: {
            crv: {
              estimatedApy: crvApyEstimate,
              formattedApy: formatPercentage(crvApyEstimate),
            },
            cvx: {
              estimatedApy: cvxApyEstimate,
              formattedApy: formatPercentage(cvxApyEstimate),
            },
            baseApy: {
              value: baseApy,
              formattedApy: formatPercentage(baseApy),
              description: 'Trading fees APY',
            },
          },
          rewardTokens: pool.rewardTokens || ['CRV', 'CVX'],
          hasExtraRewards,
          platformFee: `${TOTAL_PLATFORM_FEE}%`,
          netApy: pool.apy ? pool.apy * ((100 - TOTAL_PLATFORM_FEE) / 100) : 0,
          netApyFormatted: pool.apy
            ? formatPercentage(pool.apy * ((100 - TOTAL_PLATFORM_FEE) / 100))
            : 'N/A',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Pool Rewards');
  }
}
