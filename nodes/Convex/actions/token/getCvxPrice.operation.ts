/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd } from '../../utils';
import { ETHEREUM_CONTRACTS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get CVX and related token prices
    const prices = await client.defiLlama.getMultipleTokenPrices([
      { chain: 'ethereum', address: ETHEREUM_CONTRACTS.cvx },
      { chain: 'ethereum', address: ETHEREUM_CONTRACTS.crv },
      { chain: 'ethereum', address: ETHEREUM_CONTRACTS.cvxCrv },
    ]);

    const cvxKey = `ethereum:${ETHEREUM_CONTRACTS.cvx}`;
    const crvKey = `ethereum:${ETHEREUM_CONTRACTS.crv}`;
    const cvxCrvKey = `ethereum:${ETHEREUM_CONTRACTS.cvxCrv}`;

    const cvxPrice = prices[cvxKey] || 0;
    const crvPrice = prices[crvKey] || 0;
    const cvxCrvPrice = prices[cvxCrvKey] || crvPrice;

    // Calculate ratios
    const cvxToCrvRatio = crvPrice > 0 ? cvxPrice / crvPrice : 0;

    return [
      {
        json: {
          cvx: {
            price: cvxPrice,
            priceFormatted: formatUsd(cvxPrice),
            contract: ETHEREUM_CONTRACTS.cvx,
            symbol: 'CVX',
          },
          crv: {
            price: crvPrice,
            priceFormatted: formatUsd(crvPrice),
            contract: ETHEREUM_CONTRACTS.crv,
            symbol: 'CRV',
          },
          cvxCrv: {
            price: cvxCrvPrice,
            priceFormatted: formatUsd(cvxCrvPrice),
            contract: ETHEREUM_CONTRACTS.cvxCrv,
            symbol: 'cvxCRV',
          },
          ratios: {
            cvxToCrv: cvxToCrvRatio,
            cvxToCrvFormatted: cvxToCrvRatio.toFixed(4),
          },
          network: 'ethereum',
          timestamp: new Date().toISOString(),
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get CVX Price');
  }
}
