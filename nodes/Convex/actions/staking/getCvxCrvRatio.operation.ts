/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatPercentage } from '../../utils';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get token prices for CRV and cvxCRV
    const prices = await client.defiLlama.getMultipleTokenPrices([
      { chain: 'ethereum', address: '0xD533a949740bb3306d119CC777fa900bA034cd52' }, // CRV
      { chain: 'ethereum', address: '0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7' }, // cvxCRV
    ]);

    const crvKey = 'ethereum:0xD533a949740bb3306d119CC777fa900bA034cd52';
    const cvxCrvKey = 'ethereum:0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7';

    const crvPrice = prices[crvKey] || 0;
    const cvxCrvPrice = prices[cvxCrvKey] || crvPrice; // Default to CRV price if not found

    // Calculate peg ratio
    const ratio = crvPrice > 0 ? cvxCrvPrice / crvPrice : 1;
    const pegDeviation = (1 - ratio) * 100;
    const isPegged = Math.abs(pegDeviation) < 3; // Within 3% is considered pegged

    return [
      {
        json: {
          crvPrice,
          cvxCrvPrice,
          ratio,
          ratioFormatted: ratio.toFixed(4),
          pegStatus: isPegged ? 'pegged' : pegDeviation > 0 ? 'premium' : 'discount',
          pegDeviation,
          pegDeviationFormatted: formatPercentage(Math.abs(pegDeviation)),
          isPegged,
          arbitrageOpportunity: Math.abs(pegDeviation) > 5,
          description: ratio < 1 
            ? 'cvxCRV is trading at a discount to CRV' 
            : ratio > 1 
              ? 'cvxCRV is trading at a premium to CRV'
              : 'cvxCRV is at parity with CRV',
          recommendation: !isPegged 
            ? pegDeviation < 0 
              ? 'Consider converting CRV to cvxCRV for arbitrage'
              : 'cvxCRV premium detected, hold or sell'
            : 'No significant arbitrage opportunity',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get cvxCRV/CRV Ratio');
  }
}
