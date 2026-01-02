/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatNumber } from '../../utils';
import { 
  MAX_CVX_SUPPLY, 
  CVX_EMISSION_PARAMS, 
  EMISSION_MILESTONES,
  calculateCvxEmissionRate,
} from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get CVX price
    const cvxPrice = await client.defiLlama.getCvxPrice();

    // Estimate current emission state
    const estimatedCrvEarned = 60_000_000; // Estimated total CRV earned by Convex
    const currentRate = calculateCvxEmissionRate(estimatedCrvEarned);
    const currentCliff = Math.floor(estimatedCrvEarned / CVX_EMISSION_PARAMS.cliffSize);

    return [
      {
        json: {
          emissionSchedule: {
            mechanism: 'CVX is minted proportional to CRV earned',
            initialRate: `${CVX_EMISSION_PARAMS.initialRate} CVX per CRV`,
            reductionMechanism: 'Rate decreases over 1000 cliffs',
            cliffSize: `${formatNumber(CVX_EMISSION_PARAMS.cliffSize)} CRV`,
            totalCliffs: CVX_EMISSION_PARAMS.totalCliffs,
          },
          currentState: {
            estimatedCrvEarned,
            estimatedCrvEarnedFormatted: formatNumber(estimatedCrvEarned),
            currentCliff,
            currentEmissionRate: currentRate,
            currentEmissionRateFormatted: `${currentRate.toFixed(4)} CVX per CRV`,
            remainingCliffs: CVX_EMISSION_PARAMS.totalCliffs - currentCliff,
          },
          milestones: EMISSION_MILESTONES,
          supplyInfo: {
            maxSupply: MAX_CVX_SUPPLY,
            maxSupplyFormatted: formatNumber(MAX_CVX_SUPPLY),
            estimatedMinted: estimatedCrvEarned * 0.7, // Rough estimate
            remainingToMint: MAX_CVX_SUPPLY - (estimatedCrvEarned * 0.7),
          },
          cvxPrice,
          note: 'Emission rate decreases as more CRV is earned by the protocol',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get CVX Emissions');
  }
}
