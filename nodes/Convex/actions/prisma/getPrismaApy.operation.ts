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
    description: 'Specific Prisma pool ID (leave empty for all Prisma pools)',
    displayOptions: {
      show: {
        resource: ['prisma'],
        operation: ['getPrismaApy'],
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
        resource: ['prisma'],
        operation: ['getPrismaApy'],
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

    // Get all pools and filter for Prisma-related
    const allPools = await client.defiLlama.getAllPools();
    
    let prismaPools = allPools.filter((pool) => 
      pool.project === 'convex-finance' && 
      (pool.symbol?.toLowerCase().includes('prisma') || 
       pool.symbol?.toLowerCase().includes('mkusd') ||
       pool.poolMeta?.toLowerCase().includes('prisma'))
    );

    // If specific pool requested
    if (poolId) {
      prismaPools = prismaPools.filter((pool) => pool.pool === poolId);
      
      if (prismaPools.length === 0) {
        return [
          {
            json: {
              error: 'Pool not found',
              poolId,
              message: 'The specified pool ID was not found among Prisma pools on Convex',
            },
          },
        ];
      }
    }

    // Sort based on preference
    switch (sortBy) {
      case 'tvl':
        prismaPools.sort((a, b) => b.tvlUsd - a.tvlUsd);
        break;
      case 'apyBase':
        prismaPools.sort((a, b) => (b.apyBase || 0) - (a.apyBase || 0));
        break;
      case 'apyReward':
        prismaPools.sort((a, b) => (b.apyReward || 0) - (a.apyReward || 0));
        break;
      case 'apy':
      default:
        prismaPools.sort((a, b) => (b.apy || 0) - (a.apy || 0));
        break;
    }

    // If no pools found
    if (prismaPools.length === 0) {
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

    const results = prismaPools.map((pool) => ({
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
    handleApiError(this, error, 'Get Prisma APY');
  }
}
