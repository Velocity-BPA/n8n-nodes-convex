/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * CVX token emission schedule and parameters
 */

/**
 * Maximum CVX supply (100 million)
 */
export const MAX_CVX_SUPPLY = 100_000_000;

/**
 * CVX emission cliff thresholds (CRV earned thresholds)
 * CVX minting rate decreases as more CRV is earned
 */
export interface EmissionCliff {
  crvThreshold: number;
  cvxPerCrv: number;
  reductionPerCliff: number;
}

/**
 * CVX emission parameters
 * Initial rate: 1 CVX per CRV
 * Reduction: Decreases over 1000 cliffs
 */
export const CVX_EMISSION_PARAMS = {
  totalCliffs: 1000,
  reductionPerCliff: MAX_CVX_SUPPLY / 1000, // 100,000 CVX per cliff
  initialRate: 1, // 1 CVX per CRV initially
  cliffSize: 100_000, // CRV earned per cliff
};

/**
 * vlCVX lock parameters
 */
export const VLCVX_PARAMS = {
  lockDuration: 16, // weeks
  epochDuration: 1, // week
  gracePeriod: 1, // day after lock expires
  minLock: 1, // minimum CVX to lock
};

/**
 * Calculate CVX emission rate based on total CRV earned
 */
export function calculateCvxEmissionRate(totalCrvEarned: number): number {
  const { totalCliffs, cliffSize, reductionPerCliff } = CVX_EMISSION_PARAMS;
  const currentCliff = Math.floor(totalCrvEarned / cliffSize);

  if (currentCliff >= totalCliffs) {
    return 0; // All CVX has been minted
  }

  // Calculate remaining CVX that can be minted
  const remainingCliffs = totalCliffs - currentCliff;
  const cvxRemaining = remainingCliffs * reductionPerCliff;

  if (cvxRemaining > MAX_CVX_SUPPLY) {
    return 1; // Initial rate
  }

  // Calculate current emission rate
  return remainingCliffs / totalCliffs;
}

/**
 * Calculate estimated CVX for CRV earned
 */
export function estimateCvxFromCrv(crvAmount: number, totalCrvEarned: number): number {
  const rate = calculateCvxEmissionRate(totalCrvEarned);
  return crvAmount * rate;
}

/**
 * Emission schedule milestones
 */
export const EMISSION_MILESTONES = [
  { milestone: '10M CRV earned', cvxMinted: '~10M CVX', rate: '1.0 CVX/CRV' },
  { milestone: '25M CRV earned', cvxMinted: '~22M CVX', rate: '0.75 CVX/CRV' },
  { milestone: '50M CRV earned', cvxMinted: '~40M CVX', rate: '0.50 CVX/CRV' },
  { milestone: '75M CRV earned', cvxMinted: '~55M CVX', rate: '0.25 CVX/CRV' },
  { milestone: '100M CRV earned', cvxMinted: '~65M CVX', rate: '0.10 CVX/CRV' },
];

/**
 * Gauge voting cycle parameters
 */
export const GAUGE_VOTE_PARAMS = {
  cycleDuration: 14, // days (bi-weekly)
  voteDay: 4, // Thursday
  snapshotDay: 3, // Wednesday
};

/**
 * Gauge vote cycle duration in days (bi-weekly)
 */
export const GAUGE_VOTE_CYCLE_DAYS = 14;

/**
 * vlCVX lock duration in days (16 weeks + 1 day)
 */
export const VL_CVX_LOCK_DURATION_DAYS = 16 * 7 + 1; // 113 days
