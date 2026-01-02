/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError } from '../../utils';

export const description: INodeProperties[] = [
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Maximum number of pools to return',
    displayOptions: {
      show: {
        resource: ['pool'],
        operation: ['getAllPools'],
      },
    },
  },
  {
    displayName: 'Include Inactive',
    name: 'includeInactive',
    type: 'boolean',
    default: false,
    description: 'Whether to include shutdown pools',
    displayOptions: {
      show: {
        resource: ['pool'],
        operation: ['getAllPools'],
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
    const limit = this.getNodeParameter('limit', index, 50) as number;
    const includeInactive = this.getNodeParameter('includeInactive', index, false) as boolean;

    let pools = await client.defiLlama.getConvexPools();

    // Filter by active status if needed
    if (!includeInactive) {
      pools = pools.filter((pool) => pool.tvlUsd > 0);
    }

    // Apply limit
    pools = pools.slice(0, limit);

    // Transform to output format
    const results = pools.map((pool) => ({
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
    }));

    return results;
  } catch (error) {
    handleApiError(this, error, 'Get All Pools');
  }
}
