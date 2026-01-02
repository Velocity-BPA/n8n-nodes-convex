/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, validateRequiredParam } from '../../utils';

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
        operation: ['getPoolById'],
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
          id: pool.pool,
          symbol: pool.symbol,
          chain: pool.chain,
          project: pool.project,
          tvlUsd: pool.tvlUsd,
          apy: pool.apy,
          apyBase: pool.apyBase,
          apyReward: pool.apyReward,
          rewardTokens: pool.rewardTokens,
          stablecoin: pool.stablecoin,
          ilRisk: pool.ilRisk,
          exposure: pool.exposure,
          poolMeta: pool.poolMeta,
          underlyingTokens: pool.underlyingTokens,
          volumeUsd1d: pool.volumeUsd1d,
          volumeUsd7d: pool.volumeUsd7d,
          apyPct1D: pool.apyPct1D,
          apyPct7D: pool.apyPct7D,
          apyPct30D: pool.apyPct30D,
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Pool By ID');
  }
}
