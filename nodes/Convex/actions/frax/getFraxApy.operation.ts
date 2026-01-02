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
    displayName: 'Pool ID',
    name: 'poolId',
    type: 'string',
    default: '',
    description: 'Specific Frax pool ID (leave empty for all Frax pools)',
    displayOptions: {
      show: {
        resource: ['frax'],
        operation: ['getFraxApy'],
      },
    },
  },
  {
    displayName: 'Sort By',
    name: 'sortBy',
    type: 'options',
    default: 'apy',
    options: [
      { name: 'APY (Highest First)', value: 'apy' },
      { name: 'TVL (Largest First)', value: 'tvl' },
      { name: 'Base APY', value: 'apyBase' },
      { name: 'Reward APY', value: 'apyReward' },
    ],
    description: 'How to sort the results',
    displayOptions: {
      show: {
        resource: ['frax'],
        operation: ['getFraxApy'],
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
    const poolId = this.getNodeParameter('poolId', index, '') as string;
    const sortBy = this.getNodeParameter('sortBy', index, 'apy') as string;

    // Get all pools and filter for Frax-related
    const allPools = await client.defiLlama.getAllPools();
    
    let fraxPools = allPools.filter((pool) => 
      pool.project === 'convex-finance' && 
      (pool.symbol?.toLowerCase().includes('frax') || 
       pool.symbol?.toLowerCase().includes('fxs') ||
       pool.poolMeta?.toLowerCase().includes('frax'))
    );

    // If specific pool requested
    if (poolId) {
      fraxPools = fraxPools.filter((pool) => pool.pool === poolId);
      
      if (fraxPools.length === 0) {
        return [
          {
            json: {
              error: 'Pool not found',
              poolId,
              message: 'The specified pool ID was not found among Frax pools on Convex',
            },
          },
        ];
      }
    }

    // Sort based on preference
    switch (sortBy) {
      case 'tvl':
        fraxPools.sort((a, b) => b.tvlUsd - a.tvlUsd);
        break;
      case 'apyBase':
        fraxPools.sort((a, b) => (b.apyBase || 0) - (a.apyBase || 0));
        break;
      case 'apyReward':
        fraxPools.sort((a, b) => (b.apyReward || 0) - (a.apyReward || 0));
        break;
      case 'apy':
      default:
        fraxPools.sort((a, b) => (b.apy || 0) - (a.apy || 0));
        break;
    }

    const results = fraxPools.map((pool) => ({
      json: {
        poolId: pool.pool,
        symbol: pool.symbol,
        chain: pool.chain,
        tvlUsd: pool.tvlUsd,
        tvlFormatted: formatUsd(pool.tvlUsd),
        apy: {
          total: pool.apy,
          totalFormatted: formatPercentage(pool.apy),
          base: pool.apyBase,
          baseFormatted: formatPercentage(pool.apyBase),
          reward: pool.apyReward,
          rewardFormatted: formatPercentage(pool.apyReward),
        },
        apyChanges: {
          change1d: pool.apyPct1D,
          change1dFormatted: formatPercentage(pool.apyPct1D),
          change7d: pool.apyPct7D,
          change7dFormatted: formatPercentage(pool.apyPct7D),
          change30d: pool.apyPct30D,
          change30dFormatted: formatPercentage(pool.apyPct30D),
        },
        rewardTokens: pool.rewardTokens || [],
        underlyingTokens: pool.underlyingTokens || [],
        stablecoin: pool.stablecoin,
        poolMeta: pool.poolMeta,
      },
    }));

    return results;
  } catch (error) {
    handleApiError(this, error, 'Get Frax APY');
  }
}
