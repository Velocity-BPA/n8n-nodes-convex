/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatPercentage } from '../../utils';
import { FEE_PERCENTAGES } from '../../constants';

export const description: INodeProperties[] = [
  {
    displayName: 'Pool ID',
    name: 'poolId',
    type: 'string',
    default: '',
    required: false,
    description: 'Specific Frax pool ID (leave empty for aggregate)',
    displayOptions: {
      show: {
        resource: ['frax'],
        operation: ['getFxsRewards'],
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

    // Get all pools and filter for Frax-related
    const allPools = await client.defiLlama.getAllPools();
    
    const fraxPools = allPools.filter((pool) => 
      pool.project === 'convex-finance' && 
      (pool.symbol?.toLowerCase().includes('frax') || 
       pool.symbol?.toLowerCase().includes('fxs') ||
       pool.poolMeta?.toLowerCase().includes('frax'))
    );

    // Get token prices
    const prices = await client.defiLlama.getTokenPricesByCoingecko(['frax-share', 'convex-finance']);
    const fxsPrice = prices['frax-share'] || 0;
    const cvxPrice = prices['convex-finance'] || 0;

    if (poolId) {
      // Specific pool rewards
      const pool = fraxPools.find((p) => p.pool === poolId);
      
      if (!pool) {
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

      // Estimate rewards based on APY and TVL
      const annualRewardsUsd = (pool.tvlUsd * (pool.apyReward || 0)) / 100;
      const dailyRewardsUsd = annualRewardsUsd / 365;
      const weeklyRewardsUsd = annualRewardsUsd / 52;

      return [
        {
          json: {
            poolId: pool.pool,
            symbol: pool.symbol,
            tvlUsd: pool.tvlUsd,
            tvlFormatted: formatUsd(pool.tvlUsd),
            rewardTokens: pool.rewardTokens || [],
            rewardApy: pool.apyReward,
            rewardApyFormatted: formatPercentage(pool.apyReward),
            estimatedRewards: {
              annualUsd: annualRewardsUsd,
              annualFormatted: formatUsd(annualRewardsUsd),
              weeklyUsd: weeklyRewardsUsd,
              weeklyFormatted: formatUsd(weeklyRewardsUsd),
              dailyUsd: dailyRewardsUsd,
              dailyFormatted: formatUsd(dailyRewardsUsd),
            },
            tokenPrices: {
              fxs: fxsPrice,
              fxsFormatted: formatUsd(fxsPrice),
              cvx: cvxPrice,
              cvxFormatted: formatUsd(cvxPrice),
            },
            platformFee: {
              percentage: FEE_PERCENTAGES.TOTAL_FEE_PERCENT,
              note: 'Platform fee is deducted from earned rewards',
            },
          },
        },
      ];
    }

    // Aggregate rewards across all Frax pools
    const totalTvl = fraxPools.reduce((sum, p) => sum + (p.tvlUsd || 0), 0);
    const totalAnnualRewardsUsd = fraxPools.reduce((sum, p) => {
      const annualReward = (p.tvlUsd * (p.apyReward || 0)) / 100;
      return sum + annualReward;
    }, 0);

    // Calculate weighted average APY
    const weightedAvgApy = totalTvl > 0 ? fraxPools.reduce((sum, p) => {
      return sum + ((p.apy || 0) * (p.tvlUsd / totalTvl));
    }, 0) : 0;

    const poolBreakdown = fraxPools.slice(0, 10).map((pool) => ({
      poolId: pool.pool,
      symbol: pool.symbol,
      tvlUsd: pool.tvlUsd,
      rewardApy: pool.apyReward,
      estimatedAnnualRewardsUsd: (pool.tvlUsd * (pool.apyReward || 0)) / 100,
    }));

    return [
      {
        json: {
          summary: {
            totalFraxPoolCount: fraxPools.length,
            totalTvlUsd: totalTvl,
            totalTvlFormatted: formatUsd(totalTvl),
            weightedAverageApy: weightedAvgApy,
            weightedAverageApyFormatted: formatPercentage(weightedAvgApy),
            totalEstimatedAnnualRewardsUsd: totalAnnualRewardsUsd,
            totalAnnualRewardsFormatted: formatUsd(totalAnnualRewardsUsd),
            estimatedDailyRewardsUsd: totalAnnualRewardsUsd / 365,
            dailyRewardsFormatted: formatUsd(totalAnnualRewardsUsd / 365),
          },
          tokenPrices: {
            fxs: fxsPrice,
            fxsFormatted: formatUsd(fxsPrice),
            cvx: cvxPrice,
            cvxFormatted: formatUsd(cvxPrice),
          },
          topPools: poolBreakdown,
          platformFee: {
            totalPercent: FEE_PERCENTAGES.TOTAL_FEE_PERCENT,
            breakdown: {
              cvxCrvStakers: FEE_PERCENTAGES.CVX_CRV_STAKERS_PERCENT,
              vlCvx: FEE_PERCENTAGES.VL_CVX_PERCENT,
              harvest: FEE_PERCENTAGES.HARVEST_CALLER_PERCENT,
              platform: FEE_PERCENTAGES.PLATFORM_PERCENT,
            },
          },
          note: 'Reward estimates are based on current APY and TVL. Actual rewards vary.',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get FXS Rewards');
  }
}
