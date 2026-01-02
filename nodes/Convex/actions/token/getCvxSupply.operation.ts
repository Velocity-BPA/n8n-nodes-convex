/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatNumber, formatUsd, formatPercentage } from '../../utils';
import { MAX_CVX_SUPPLY, ETHEREUM_CONTRACTS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get CVX price
    const cvxPrice = await client.defiLlama.getCvxPrice();

    // Estimated supply metrics (actual values would require on-chain data)
    const estimatedCirculating = 85_000_000;
    const estimatedTotalSupply = 90_000_000;
    const estimatedLocked = 50_000_000; // vlCVX

    const circulatingPercentage = (estimatedCirculating / MAX_CVX_SUPPLY) * 100;
    const lockedPercentage = (estimatedLocked / estimatedCirculating) * 100;

    return [
      {
        json: {
          maxSupply: MAX_CVX_SUPPLY,
          maxSupplyFormatted: formatNumber(MAX_CVX_SUPPLY),
          estimatedCirculating,
          estimatedCirculatingFormatted: formatNumber(estimatedCirculating),
          estimatedTotalSupply,
          estimatedTotalSupplyFormatted: formatNumber(estimatedTotalSupply),
          estimatedLocked,
          estimatedLockedFormatted: formatNumber(estimatedLocked),
          percentages: {
            circulating: circulatingPercentage,
            circulatingFormatted: formatPercentage(circulatingPercentage),
            locked: lockedPercentage,
            lockedFormatted: formatPercentage(lockedPercentage),
          },
          marketCap: {
            estimated: estimatedCirculating * cvxPrice,
            estimatedFormatted: formatUsd(estimatedCirculating * cvxPrice),
            fullyDiluted: MAX_CVX_SUPPLY * cvxPrice,
            fullyDilutedFormatted: formatUsd(MAX_CVX_SUPPLY * cvxPrice),
          },
          cvxPrice,
          contract: ETHEREUM_CONTRACTS.cvx,
          note: 'Supply figures are estimates. Actual values require on-chain queries.',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get CVX Supply');
  }
}
