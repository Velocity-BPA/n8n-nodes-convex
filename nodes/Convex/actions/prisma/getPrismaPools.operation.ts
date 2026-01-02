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
    description: 'Maximum number of Prisma pools to return',
    displayOptions: {
      show: {
        resource: ['prisma'],
        operation: ['getPrismaPools'],
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
        resource: ['prisma'],
        operation: ['getPrismaPools'],
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

    // Get all pools and filter for Prisma-related
    const allPools = await client.defiLlama.getAllPools();
    
    // Filter for Prisma pools on Convex
    let prismaPools = allPools.filter((pool) => 
      pool.project === 'convex-finance' && 
      (pool.symbol?.toLowerCase().includes('prisma') || 
       pool.symbol?.toLowerCase().includes('mkusd') ||
       pool.poolMeta?.toLowerCase().includes('prisma'))
    );

    // Apply TVL filter
    if (minTvl > 0) {
      prismaPools = prismaPools.filter((pool) => pool.tvlUsd >= minTvl);
    }

    // Sort by TVL descending
    prismaPools.sort((a, b) => b.tvlUsd - a.tvlUsd);

    // Apply limit
    prismaPools = prismaPools.slice(0, limit);

    const results = prismaPools.map((pool) => ({
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
        isPrismaPool: true,
      },
    }));

    // If no pools found, return info message
    if (results.length === 0) {
      return [
        {
          json: {
            message: 'No Prisma pools found on Convex',
            note: 'Prisma integration may have limited pool availability',
            suggestion: 'Check Convex website for current Prisma pool offerings',
          },
        },
      ];
    }

    return results;
  } catch (error) {
    handleApiError(this, error, 'Get Prisma Pools');
  }
}
