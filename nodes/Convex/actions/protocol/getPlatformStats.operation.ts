/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatNumber, formatPercentage } from '../../utils';
import { MAX_CVX_SUPPLY, TOTAL_PLATFORM_FEE, PROTOCOLS, ETHEREUM_CONTRACTS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get comprehensive protocol data
    const [protocolData, tvl, pools, cvxPrice, crvPrice] = await Promise.all([
      client.defiLlama.getProtocolData(),
      client.defiLlama.getTvl(),
      client.defiLlama.getConvexPools(),
      client.defiLlama.getCvxPrice(),
      client.defiLlama.getCrvPrice(),
    ]);

    // Calculate pool statistics
    const activePools = pools.filter((p) => (p.apy ?? 0) > 0);
    const avgApy = activePools.length > 0
      ? activePools.reduce((sum, p) => sum + (p.apy ?? 0), 0) / activePools.length
      : 0;
    const maxApy = activePools.length > 0
      ? Math.max(...activePools.map((p) => p.apy ?? 0))
      : 0;

    // Estimated metrics
    const estimatedCvxCirculating = 85_000_000;
    const estimatedVlCvx = 50_000_000;
    const estimatedCvxCrvStaked = 200_000_000;

    return [
      {
        json: {
          protocol: 'Convex Finance',
          overview: {
            description: 'Leading yield optimization protocol for Curve, Frax, and Prisma',
            launchDate: 'May 2021',
            category: 'Yield Aggregator',
            supportedChains: ['Ethereum', 'Arbitrum', 'Fraxtal'],
          },
          tvl: {
            total: tvl,
            totalFormatted: formatUsd(tvl),
            rank: protocolData?.slug || 'Top 20',
          },
          pools: {
            total: pools.length,
            active: activePools.length,
            averageApy: avgApy,
            averageApyFormatted: formatPercentage(avgApy),
            maxApy,
            maxApyFormatted: formatPercentage(maxApy),
          },
          tokens: {
            cvx: {
              price: cvxPrice,
              priceFormatted: formatUsd(cvxPrice),
              maxSupply: MAX_CVX_SUPPLY,
              maxSupplyFormatted: formatNumber(MAX_CVX_SUPPLY),
              circulatingEstimate: estimatedCvxCirculating,
              circulatingFormatted: formatNumber(estimatedCvxCirculating),
              marketCapEstimate: cvxPrice * estimatedCvxCirculating,
              marketCapFormatted: formatUsd(cvxPrice * estimatedCvxCirculating),
              contract: ETHEREUM_CONTRACTS.cvx,
            },
            crv: {
              price: crvPrice,
              priceFormatted: formatUsd(crvPrice),
            },
          },
          staking: {
            vlCvx: {
              estimatedLocked: estimatedVlCvx,
              estimatedLockedFormatted: formatNumber(estimatedVlCvx),
              lockedValueEstimate: estimatedVlCvx * cvxPrice,
              lockedValueFormatted: formatUsd(estimatedVlCvx * cvxPrice),
              percentOfCirculating: (estimatedVlCvx / estimatedCvxCirculating) * 100,
              percentFormatted: formatPercentage((estimatedVlCvx / estimatedCvxCirculating) * 100),
            },
            cvxCrv: {
              estimatedStaked: estimatedCvxCrvStaked,
              estimatedStakedFormatted: formatNumber(estimatedCvxCrvStaked),
            },
          },
          fees: {
            platformFee: TOTAL_PLATFORM_FEE,
            platformFeeFormatted: formatPercentage(TOTAL_PLATFORM_FEE),
            userRetention: 100 - TOTAL_PLATFORM_FEE,
            userRetentionFormatted: formatPercentage(100 - TOTAL_PLATFORM_FEE),
          },
          integrations: {
            protocols: Object.keys(PROTOCOLS).length,
            primaryProtocol: 'Curve Finance',
          },
          contracts: {
            booster: ETHEREUM_CONTRACTS.booster,
            cvx: ETHEREUM_CONTRACTS.cvx,
            cvxCrv: ETHEREUM_CONTRACTS.cvxCrv,
            vlCvx: ETHEREUM_CONTRACTS.vlCvx,
          },
          timestamp: new Date().toISOString(),
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Platform Stats');
  }
}
