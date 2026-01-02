/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatPercentage } from '../../utils';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get protocol TVL
    const protocolTvl = await client.defiLlama.getTvl();
    const protocolData = await client.defiLlama.getProtocolData();

    // Get pools to estimate cvxCRV staking TVL
    const pools = await client.defiLlama.getConvexPools();
    const cvxCrvPools = pools.filter((p) => 
      p.symbol.toLowerCase().includes('cvxcrv') || 
      p.pool.toLowerCase().includes('cvxcrv')
    );

    const cvxCrvTvl = cvxCrvPools.reduce((sum, pool) => sum + pool.tvlUsd, 0);
    const tvlPercentage = protocolTvl > 0 ? (cvxCrvTvl / protocolTvl) * 100 : 0;

    return [
      {
        json: {
          cvxCrvStakingTvl: cvxCrvTvl,
          cvxCrvStakingTvlFormatted: formatUsd(cvxCrvTvl),
          protocolTotalTvl: protocolTvl,
          protocolTotalTvlFormatted: formatUsd(protocolTvl),
          tvlPercentage,
          tvlPercentageFormatted: formatPercentage(tvlPercentage),
          chainBreakdown: protocolData.currentChainTvls || {},
          cvxCrvPools: cvxCrvPools.length,
          tvlChange1d: protocolData.change_1d,
          tvlChange7d: protocolData.change_7d,
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Staking TVL');
  }
}
