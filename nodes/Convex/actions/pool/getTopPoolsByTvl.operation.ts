/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatPercentage, formatUsd } from '../../utils';

export const description: INodeProperties[] = [
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 10,
    description: 'Maximum number of pools to return',
    displayOptions: {
      show: {
        resource: ['pool'],
        operation: ['getTopPoolsByTvl'],
      },
    },
  },
  {
    displayName: 'Stablecoins Only',
    name: 'stablecoinsOnly',
    type: 'boolean',
    default: false,
    description: 'Whether to only include stablecoin pools',
    displayOptions: {
      show: {
        resource: ['pool'],
        operation: ['getTopPoolsByTvl'],
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
    const stablecoinsOnly = this.getNodeParameter('stablecoinsOnly', index, false) as boolean;

    let pools = await client.defiLlama.getTopPoolsByTvl(100);

    // Apply filters
    if (stablecoinsOnly) {
      pools = pools.filter((pool) => pool.stablecoin);
    }

    // Apply limit after filtering
    pools = pools.slice(0, limit);

    // Transform to output format with rankings
    const results = pools.map((pool, idx) => ({
      json: {
        rank: idx + 1,
        id: pool.pool,
        symbol: pool.symbol,
        tvlUsd: pool.tvlUsd,
        tvlFormatted: formatUsd(pool.tvlUsd),
        apy: pool.apy,
        apyFormatted: pool.apy ? formatPercentage(pool.apy) : 'N/A',
        apyBase: pool.apyBase,
        apyReward: pool.apyReward,
        chain: pool.chain,
        stablecoin: pool.stablecoin,
        ilRisk: pool.ilRisk,
        volumeUsd1d: pool.volumeUsd1d,
        volumeUsd7d: pool.volumeUsd7d,
        rewardTokens: pool.rewardTokens,
      },
    }));

    return results;
  } catch (error) {
    handleApiError(this, error, 'Get Top Pools By TVL');
  }
}
