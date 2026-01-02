/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatPercentage } from '../../utils';
import { TOTAL_PLATFORM_FEE, getFeeStructureArray } from '../../constants';

export const description: INodeProperties[] = [
  {
    displayName: 'Time Period',
    name: 'timePeriod',
    type: 'options',
    options: [
      { name: '24 Hours', value: '24h' },
      { name: '7 Days', value: '7d' },
      { name: '30 Days', value: '30d' },
      { name: 'All Time', value: 'all' },
    ],
    default: '30d',
    description: 'Time period for revenue calculation',
    displayOptions: {
      show: {
        resource: ['protocol'],
        operation: ['getProtocolRevenue'],
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
    const timePeriod = this.getNodeParameter('timePeriod', index, '30d') as string;

    // Get TVL for revenue calculation
    const totalTvl = await client.defiLlama.getTvl();

    // Estimate revenue based on TVL and APY
    // Average yield across pools ~5-15%
    const averageYield = 0.10; // 10% average
    const platformFeeRate = TOTAL_PLATFORM_FEE / 100;

    // Time period multipliers
    const periodMultipliers: Record<string, number> = {
      '24h': 1 / 365,
      '7d': 7 / 365,
      '30d': 30 / 365,
      all: 3, // Estimated years of operation
    };

    const multiplier = periodMultipliers[timePeriod] || 30 / 365;

    // Calculate estimated revenue
    const estimatedGrossYield = totalTvl * averageYield * multiplier;
    const estimatedPlatformRevenue = estimatedGrossYield * platformFeeRate;

    // Fee distribution
    const feeStructure = getFeeStructureArray();
    const revenueDistribution = feeStructure.map((fee) => ({
      recipient: fee.recipient,
      percentage: fee.percentage,
      percentageFormatted: formatPercentage(fee.percentage),
      estimatedAmount: estimatedPlatformRevenue * (fee.percentage / TOTAL_PLATFORM_FEE),
      estimatedAmountFormatted: formatUsd(estimatedPlatformRevenue * (fee.percentage / TOTAL_PLATFORM_FEE)),
    }));

    return [
      {
        json: {
          protocol: 'Convex Finance',
          timePeriod,
          revenue: {
            estimatedGrossYield,
            estimatedGrossYieldFormatted: formatUsd(estimatedGrossYield),
            platformFeeRate: platformFeeRate * 100,
            platformFeeRateFormatted: formatPercentage(platformFeeRate * 100),
            estimatedPlatformRevenue,
            estimatedPlatformRevenueFormatted: formatUsd(estimatedPlatformRevenue),
          },
          distribution: revenueDistribution,
          inputs: {
            tvl: totalTvl,
            tvlFormatted: formatUsd(totalTvl),
            assumedAverageYield: averageYield * 100,
            assumedAverageYieldFormatted: formatPercentage(averageYield * 100),
          },
          note: 'Revenue estimates based on TVL and assumed average yield. Actual revenue depends on pool performance.',
          timestamp: new Date().toISOString(),
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Protocol Revenue');
  }
}
