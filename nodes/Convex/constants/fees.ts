/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Convex Finance fee structure
 * Total platform fee: 17% of CRV rewards
 */

export interface FeeBreakdown {
  percentage: number;
  recipient: string;
  description: string;
}

/**
 * Convex platform fee breakdown (17% total)
 */
export const CONVEX_FEES: Record<string, FeeBreakdown> = {
  cvxCrvStakers: {
    percentage: 10,
    recipient: 'cvxCRV stakers',
    description: 'Distributed to cvxCRV stakers as 3CRV',
  },
  vlCvxHolders: {
    percentage: 5,
    recipient: 'vlCVX holders',
    description: 'Voting rewards for vote-locked CVX holders',
  },
  harvestCaller: {
    percentage: 1,
    recipient: 'Harvest caller',
    description: 'Incentive for calling harvest function',
  },
  platform: {
    percentage: 1,
    recipient: 'Convex treasury',
    description: 'Platform operational fee',
  },
};

/**
 * Total platform fee percentage
 */
export const TOTAL_PLATFORM_FEE = 17;

/**
 * Individual fee percentages for easy access
 */
export const FEE_PERCENTAGES = {
  TOTAL_FEE_PERCENT: 17,
  CVX_CRV_STAKERS_PERCENT: 10,
  VL_CVX_PERCENT: 5,
  HARVEST_CALLER_PERCENT: 1,
  PLATFORM_PERCENT: 1,
} as const;

/**
 * Alias for backward compatibility
 */
export const PLATFORM_FEE = TOTAL_PLATFORM_FEE;
export const PLATFORM_FEES = CONVEX_FEES;

/**
 * Fee denominators for calculations
 */
export const FEE_DENOMINATOR = 10000;

/**
 * Calculate net APY after platform fees
 */
export function calculateNetApy(grossApy: number): number {
  return grossApy * ((100 - TOTAL_PLATFORM_FEE) / 100);
}

/**
 * Calculate fee amounts from reward
 */
export function calculateFeeAmounts(totalReward: number): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, fee] of Object.entries(CONVEX_FEES)) {
    result[key] = totalReward * (fee.percentage / 100);
  }
  return result;
}

/**
 * Get fee structure as array for display
 */
export function getFeeStructureArray(): Array<{
  name: string;
  percentage: number;
  recipient: string;
  description: string;
}> {
  return Object.entries(CONVEX_FEES).map(([name, fee]) => ({
    name,
    ...fee,
  }));
}
