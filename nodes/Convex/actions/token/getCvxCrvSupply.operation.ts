/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatNumber, formatUsd } from '../../utils';
import { ETHEREUM_CONTRACTS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get token prices
    const prices = await client.defiLlama.getMultipleTokenPrices([
      { chain: 'ethereum', address: ETHEREUM_CONTRACTS.cvxCrv },
      { chain: 'ethereum', address: ETHEREUM_CONTRACTS.crv },
    ]);

    const cvxCrvKey = `ethereum:${ETHEREUM_CONTRACTS.cvxCrv}`;
    const crvKey = `ethereum:${ETHEREUM_CONTRACTS.crv}`;

    const cvxCrvPrice = prices[cvxCrvKey] || 0;
    const crvPrice = prices[crvKey] || 0;

    // Estimate cvxCRV supply (cvxCRV = CRV locked in Convex)
    const estimatedCvxCrvSupply = 300_000_000; // Estimated total cvxCRV
    const estimatedStaked = 250_000_000; // Estimated staked cvxCRV

    return [
      {
        json: {
          cvxCrv: {
            contract: ETHEREUM_CONTRACTS.cvxCrv,
            stakingContract: ETHEREUM_CONTRACTS.cvxCrvStaking,
            symbol: 'cvxCRV',
          },
          supply: {
            estimated: estimatedCvxCrvSupply,
            estimatedFormatted: formatNumber(estimatedCvxCrvSupply),
            estimatedStaked,
            estimatedStakedFormatted: formatNumber(estimatedStaked),
            stakedPercentage: ((estimatedStaked / estimatedCvxCrvSupply) * 100).toFixed(2) + '%',
          },
          pricing: {
            cvxCrvPrice,
            cvxCrvPriceFormatted: formatUsd(cvxCrvPrice),
            crvPrice,
            crvPriceFormatted: formatUsd(crvPrice),
            pegRatio: crvPrice > 0 ? (cvxCrvPrice / crvPrice).toFixed(4) : 'N/A',
          },
          marketCap: {
            estimated: estimatedCvxCrvSupply * cvxCrvPrice,
            estimatedFormatted: formatUsd(estimatedCvxCrvSupply * cvxCrvPrice),
          },
          description: 'cvxCRV represents CRV permanently locked in Convex',
          characteristics: {
            redeemable: false,
            tradeable: true,
            yields: 'Staking rewards from platform fees + CVX',
          },
          note: 'Supply figures are estimates. Actual values require on-chain queries.',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get cvxCRV Supply');
  }
}
