/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, ILoadOptionsFunctions, NodeApiError } from 'n8n-workflow';
import { ConvexDataClient, createConvexClient, ConvexClientOptions } from '../transport';

/**
 * Get Convex API credentials and create client
 */
export async function getConvexClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<ConvexDataClient> {
  const credentials = await context.getCredentials('convexApi');

  const options: ConvexClientOptions = {
    dataSource: (credentials.dataSource as ConvexClientOptions['dataSource']) || 'DefiLlama',
    network: (credentials.network as string) || 'Ethereum',
    subgraphUrl: credentials.subgraphUrl as string | undefined,
    rpcUrl: credentials.rpcUrl as string | undefined,
    apiKey: credentials.apiKey as string | undefined,
  };

  return createConvexClient(options);
}

/**
 * Format number with appropriate decimals
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) {
    return '0.00%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format USD value
 */
export function formatUsd(value: number, decimals: number = 2): string {
  return `$${formatNumber(value, decimals)}`;
}

/**
 * Parse pool APY from various formats
 */
export function parseApy(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(numValue) ? 0 : numValue;
}

/**
 * Calculate boost multiplier
 */
export function calculateBoost(
  userBalance: number,
  totalSupply: number,
  userVeCrv: number,
  totalVeCrv: number,
): number {
  if (totalSupply === 0 || totalVeCrv === 0) {
    return 1;
  }

  const baseBalance = userBalance * 0.4;
  const boostedBalance =
    (totalSupply * userVeCrv) / totalVeCrv + (userBalance * (1 - 0.4) * userVeCrv) / totalVeCrv;

  const effectiveBalance = Math.min(userBalance, baseBalance + boostedBalance);
  const boost = effectiveBalance / baseBalance;

  return Math.min(boost, 2.5); // Max boost is 2.5x
}

/**
 * Calculate vlCVX unlock date
 */
export function calculateUnlockDate(lockTimestamp: number, lockWeeks: number = 16): Date {
  const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  // Lock duration: 16 weeks + 1 day
  const unlockTime = lockTimestamp + lockWeeks * millisecondsPerWeek + millisecondsPerDay;
  return new Date(unlockTime);
}

/**
 * Get next gauge vote date (bi-weekly on Thursday)
 */
export function getNextGaugeVoteDate(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;

  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(0, 0, 0, 0);

  // Check if we need to go to next cycle (bi-weekly)
  // This is a simplified calculation
  return nextThursday;
}

/**
 * Handle API errors consistently
 */
export function handleApiError(
  context: IExecuteFunctions,
  error: unknown,
  operation: string,
): never {
  if (error instanceof Error) {
    throw new NodeApiError(context.getNode(), {
      message: `${operation} failed: ${error.message}`,
      description: error.stack || 'No stack trace available',
    });
  }
  throw new NodeApiError(context.getNode(), {
    message: `${operation} failed with unknown error`,
  });
}

/**
 * Validate required parameters
 */
export function validateRequiredParam<T>(
  value: T | undefined | null,
  paramName: string,
): asserts value is T {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Required parameter "${paramName}" is missing or empty`);
  }
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(value: string, defaultValue: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
