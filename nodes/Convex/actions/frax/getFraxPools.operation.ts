/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatPercentage } from '../../utils';

export const description: INodeProperties[] = [
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 20,
    description: 'Maximum number of Frax pools to return',
    displayOptions: {
      show: {
        resource: ['frax'],
        operation: ['getFraxPools'],
      },
    },
  },
  {
    displayName: 'Min TVL',
    name: 'minTvl',
    type: 'number',
    default: 0,
    description: 'Minimum TVL filter in USD',
    displayOptions: {
      show: {
        resource: ['frax'],
        operation: ['getFraxPools'],
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
    const limit = this.getNodeParameter('limit', index, 20) as number;
    const minTvl = this.getNodeParameter('minTvl', index, 0) as number;

    // Get all pools and filter for Frax-related
    const allPools = await client.defiLlama.getAllPools();
    
    // Filter for Frax pools on Convex
    let fraxPools = allPools.filter((pool) => 
      pool.project === 'convex-finance' && 
      (pool.symbol?.toLowerCase().includes('frax') || 
       pool.symbol?.toLowerCase().includes('fxs') ||
       pool.poolMeta?.toLowerCase().includes('frax'))
    );

    // Apply TVL filter
    if (minTvl > 0) {
      fraxPools = fraxPools.filter((pool) => pool.tvlUsd >= minTvl);
    }

    // Sort by TVL descending
    fraxPools.sort((a, b) => b.tvlUsd - a.tvlUsd);

    // Apply limit
    fraxPools = fraxPools.slice(0, limit);

    const results = fraxPools.map((pool) => ({
      json: {
        id: pool.pool,
        symbol: pool.symbol,
        chain: pool.chain,
        tvlUsd: pool.tvlUsd,
        tvlFormatted: formatUsd(pool.tvlUsd),
        apy: pool.apy,
        apyFormatted: formatPercentage(pool.apy),
        apyBase: pool.apyBase,
        apyReward: pool.apyReward,
        rewardTokens: pool.rewardTokens || [],
        stablecoin: pool.stablecoin,
        underlyingTokens: pool.underlyingTokens || [],
        poolMeta: pool.poolMeta,
        isFraxPool: true,
      },
    }));

    return results;
  } catch (error) {
    handleApiError(this, error, 'Get Frax Pools');
  }
}
