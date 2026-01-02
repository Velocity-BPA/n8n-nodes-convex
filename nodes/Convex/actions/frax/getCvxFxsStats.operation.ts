/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatNumber } from '../../utils';
import { ETHEREUM_CONTRACTS } from '../../constants';

export const description: INodeProperties[] = [
  {
    displayName: 'Network',
    name: 'network',
    type: 'options',
    default: 'ethereum',
    options: [
      { name: 'Ethereum', value: 'ethereum' },
      { name: 'Fraxtal', value: 'fraxtal' },
    ],
    description: 'Network to query cvxFXS stats from',
    displayOptions: {
      show: {
        resource: ['frax'],
        operation: ['getCvxFxsStats'],
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
    const network = this.getNodeParameter('network', index, 'ethereum') as string;

    // Get protocol data for TVL breakdown
    await client.defiLlama.getProtocolData();
    
    // Get token prices using coingecko IDs
    const prices = await client.defiLlama.getTokenPricesByCoingecko(['frax-share', 'convex-fxs']);
    const fxsPrice = prices['frax-share'] || 0;
    const cvxFxsPrice = prices['convex-fxs'] || fxsPrice; // May not have separate price

    // Get Frax pools to estimate staked amounts
    const allPools = await client.defiLlama.getAllPools();
    const fraxPools = allPools.filter((pool) => 
      pool.project === 'convex-finance' && 
      (pool.symbol?.toLowerCase().includes('fxs') ||
       pool.symbol?.toLowerCase().includes('frax'))
    );

    // Calculate total Frax TVL on Convex
    const totalFraxTvl = fraxPools.reduce((sum, pool) => sum + (pool.tvlUsd || 0), 0);

    // Estimate cvxFXS stats (actual on-chain data would require RPC calls)
    const estimatedCvxFxsSupply = totalFraxTvl / fxsPrice * 0.3; // Rough estimate

    return [
      {
        json: {
          network,
          cvxFxsToken: ETHEREUM_CONTRACTS.cvxFxs || 'N/A',
          fxsPrice,
          fxsPriceFormatted: formatUsd(fxsPrice),
          cvxFxsPrice,
          cvxFxsPriceFormatted: formatUsd(cvxFxsPrice),
          cvxFxsRatio: cvxFxsPrice > 0 && fxsPrice > 0 ? cvxFxsPrice / fxsPrice : 1,
          estimatedTotalSupply: estimatedCvxFxsSupply,
          estimatedTotalSupplyFormatted: formatNumber(estimatedCvxFxsSupply),
          totalFraxTvlOnConvex: totalFraxTvl,
          totalFraxTvlFormatted: formatUsd(totalFraxTvl),
          fraxPoolCount: fraxPools.length,
          description: 'cvxFXS is the Convex-wrapped version of FXS (Frax Share) token',
          benefits: [
            'Earn boosted FXS rewards without locking',
            'Liquid wrapper for veFXS voting power',
            'Auto-compound FXS emissions',
            'Participate in Frax governance via Convex',
          ],
          stakingContract: 'See Convex FXS staking contracts',
          note: 'Some values are estimates. Use on-chain data for exact figures.',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get cvxFXS Stats');
  }
}
