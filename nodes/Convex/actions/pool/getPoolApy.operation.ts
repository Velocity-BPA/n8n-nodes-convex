/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, validateRequiredParam, formatPercentage } from '../../utils';

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
        operation: ['getPoolApy'],
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

    return [
      {
        json: {
          poolId: pool.pool,
          symbol: pool.symbol,
          totalApy: pool.apy,
          totalApyFormatted: pool.apy ? formatPercentage(pool.apy) : 'N/A',
          baseApy: pool.apyBase,
          baseApyFormatted: pool.apyBase ? formatPercentage(pool.apyBase) : 'N/A',
          rewardApy: pool.apyReward,
          rewardApyFormatted: pool.apyReward ? formatPercentage(pool.apyReward) : 'N/A',
          rewardTokens: pool.rewardTokens,
          apyChange1d: pool.apyPct1D,
          apyChange7d: pool.apyPct7D,
          apyChange30d: pool.apyPct30D,
          apyMean30d: pool.apyMean30d,
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Pool APY');
  }
}
