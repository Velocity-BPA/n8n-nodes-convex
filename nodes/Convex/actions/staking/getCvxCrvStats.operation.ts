/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatPercentage } from '../../utils';
import { ETHEREUM_CONTRACTS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get protocol data for cvxCRV stats
    const protocolData = await client.defiLlama.getProtocolData();
    const crvPrice = await client.defiLlama.getCrvPrice();
    const cvxPrice = await client.defiLlama.getCvxPrice();

    // Get pools to estimate cvxCRV staking stats
    const pools = await client.defiLlama.getConvexPools();
    const cvxCrvPools = pools.filter((p) => 
      p.symbol.toLowerCase().includes('cvxcrv') || 
      p.pool.toLowerCase().includes('cvxcrv')
    );

    // Calculate total cvxCRV TVL from pools
    const cvxCrvTvl = cvxCrvPools.reduce((sum, pool) => sum + pool.tvlUsd, 0);
    
    // Estimate staking APR (typically 10-20% from protocol fees)
    const stakingApr = cvxCrvPools.length > 0 
      ? cvxCrvPools[0].apy || 15 
      : 15;

    return [
      {
        json: {
          cvxCrvContract: ETHEREUM_CONTRACTS.cvxCrv,
          stakingContract: ETHEREUM_CONTRACTS.cvxCrvStaking,
          totalStakedUsd: cvxCrvTvl,
          totalStakedFormatted: formatUsd(cvxCrvTvl),
          stakingApr,
          stakingAprFormatted: formatPercentage(stakingApr),
          crvPrice,
          cvxPrice,
          cvxCrvPools: cvxCrvPools.length,
          protocolTvl: protocolData.tvl,
          rewardTokens: ['3CRV', 'CVX'],
          description: 'cvxCRV is a tokenized representation of CRV permanently locked in Convex',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get cvxCRV Stats');
  }
}
