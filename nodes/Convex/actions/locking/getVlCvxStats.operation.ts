/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd, formatNumber } from '../../utils';
import { ETHEREUM_CONTRACTS, VLCVX_PARAMS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const client = await getConvexClient(this);

    // Get CVX price
    const cvxPrice = await client.defiLlama.getCvxPrice();
    const protocolData = await client.defiLlama.getProtocolData();

    // Estimate vlCVX stats (typically ~60-70% of CVX supply is locked)
    const estimatedLockedSupply = 50_000_000; // Estimated locked CVX
    const estimatedTotalVlCvx = estimatedLockedSupply * cvxPrice;

    return [
      {
        json: {
          vlCvxContract: ETHEREUM_CONTRACTS.vlCvx,
          cvxContract: ETHEREUM_CONTRACTS.cvx,
          lockDurationWeeks: VLCVX_PARAMS.lockDuration,
          lockDurationDays: VLCVX_PARAMS.lockDuration * 7 + VLCVX_PARAMS.gracePeriod,
          epochDurationWeeks: VLCVX_PARAMS.epochDuration,
          estimatedTotalLocked: estimatedLockedSupply,
          estimatedTotalLockedFormatted: formatNumber(estimatedLockedSupply),
          estimatedTotalValueLocked: estimatedTotalVlCvx,
          estimatedTotalValueLockedFormatted: formatUsd(estimatedTotalVlCvx),
          cvxPrice,
          protocolTvl: protocolData.tvl,
          description: 'vlCVX (Vote Locked CVX) enables governance participation and bribe revenue',
          benefits: [
            'Vote on gauge weight allocation',
            'Receive bribe revenue from protocols',
            'Participate in governance proposals',
            'Direct CRV emissions to preferred pools',
          ],
          lockTerms: {
            duration: '16 weeks + 1 day',
            earlyUnlock: false,
            relocking: 'Automatic relock option available',
          },
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get vlCVX Stats');
  }
}
