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
        operation: ['getTopPoolsByApy'],
      },
    },
  },
  {
    displayName: 'Minimum TVL',
    name: 'minTvl',
    type: 'number',
    default: 100000,
    description: 'Minimum TVL (USD) to filter pools',
    displayOptions: {
      show: {
        resource: ['pool'],
        operation: ['getTopPoolsByApy'],
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
        operation: ['getTopPoolsByApy'],
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
    const minTvl = this.getNodeParameter('minTvl', index, 100000) as number;
    const stablecoinsOnly = this.getNodeParameter('stablecoinsOnly', index, false) as boolean;

    let pools = await client.defiLlama.getTopPoolsByApy(100);

    // Apply filters
    pools = pools.filter((pool) => pool.tvlUsd >= minTvl);

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
        apy: pool.apy,
        apyFormatted: pool.apy ? formatPercentage(pool.apy) : 'N/A',
        apyBase: pool.apyBase,
        apyReward: pool.apyReward,
        tvlUsd: pool.tvlUsd,
        tvlFormatted: formatUsd(pool.tvlUsd),
        chain: pool.chain,
        stablecoin: pool.stablecoin,
        ilRisk: pool.ilRisk,
        rewardTokens: pool.rewardTokens,
        apyChange7d: pool.apyPct7D,
        apyChange30d: pool.apyPct30D,
      },
    }));

    return results;
  } catch (error) {
    handleApiError(this, error, 'Get Top Pools By APY');
  }
}
