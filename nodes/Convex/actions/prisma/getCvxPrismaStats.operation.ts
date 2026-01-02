/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatNumber } from '../../utils';
import { ETHEREUM_CONTRACTS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get protocol data for TVL breakdown
    const protocolData = await client.defiLlama.getProtocolData();
    
    // Get token prices
    const prices = await client.defiLlama.getTokenPricesByCoingecko(['prisma-governance-token', 'convex-finance']);
    const prismaPrice = prices['prisma-governance-token'] || 0;
    const cvxPrice = prices['convex-finance'] || 0;

    // Get Prisma pools to estimate staked amounts
    const allPools = await client.defiLlama.getAllPools();
    const prismaPools = allPools.filter((pool) => 
      pool.project === 'convex-finance' && 
      (pool.symbol?.toLowerCase().includes('prisma') ||
       pool.symbol?.toLowerCase().includes('mkusd'))
    );

    // Calculate total Prisma TVL on Convex
    const totalPrismaTvl = prismaPools.reduce((sum, pool) => sum + (pool.tvlUsd || 0), 0);

    // Estimate cvxPRISMA stats
    const estimatedCvxPrismaSupply = prismaPrice > 0 
      ? totalPrismaTvl / prismaPrice * 0.25 
      : 0;

    return [
      {
        json: {
          network: 'ethereum',
          cvxPrismaToken: ETHEREUM_CONTRACTS.cvxPrisma || 'N/A',
          prismaPrice,
          prismaPriceFormatted: formatUsd(prismaPrice),
          cvxPrice,
          cvxPriceFormatted: formatUsd(cvxPrice),
          estimatedTotalSupply: estimatedCvxPrismaSupply,
          estimatedTotalSupplyFormatted: formatNumber(estimatedCvxPrismaSupply),
          totalPrismaTvlOnConvex: totalPrismaTvl,
          totalPrismaTvlFormatted: formatUsd(totalPrismaTvl),
          prismaPoolCount: prismaPools.length,
          description: 'cvxPRISMA is the Convex-wrapped version of PRISMA token',
          benefits: [
            'Earn boosted PRISMA rewards without locking',
            'Liquid wrapper for vePRISMA voting power',
            'Auto-compound PRISMA emissions',
            'Participate in Prisma governance via Convex',
          ],
          prismaProtocol: {
            description: 'Prisma Finance is a decentralized borrowing protocol',
            stablecoin: 'mkUSD',
            website: 'https://prismafinance.com',
          },
          convexTotalTvl: protocolData?.tvl || 0,
          prismaTvlPercentage: protocolData?.tvl 
            ? (totalPrismaTvl / protocolData.tvl * 100).toFixed(2) + '%'
            : 'N/A',
          note: 'Some values are estimates. Use on-chain data for exact figures.',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get cvxPRISMA Stats');
  }
}
