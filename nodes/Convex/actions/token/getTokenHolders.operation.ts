/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatNumber, formatPercentage } from '../../utils';
import { MAX_CVX_SUPPLY, ETHEREUM_CONTRACTS } from '../../constants';

export const description: INodeProperties[] = [
  {
    displayName: 'Token',
    name: 'token',
    type: 'options',
    options: [
      {
        name: 'CVX',
        value: 'cvx',
        description: 'CVX token holders',
      },
      {
        name: 'cvxCRV',
        value: 'cvxCrv',
        description: 'cvxCRV token holders',
      },
      {
        name: 'vlCVX',
        value: 'vlCvx',
        description: 'Vote-locked CVX holders',
      },
    ],
    default: 'cvx',
    description: 'Which token to get holders for',
    displayOptions: {
      show: {
        resource: ['token'],
        operation: ['getTokenHolders'],
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
    const token = this.getNodeParameter('token', index, 'cvx') as string;

    // Get CVX price
    const cvxPrice = await client.defiLlama.getCvxPrice();

    // Token-specific data
    const tokenData = {
      cvx: {
        contract: ETHEREUM_CONTRACTS.cvx,
        name: 'CVX',
        estimatedHolders: 50000,
        estimatedSupply: 85_000_000,
      },
      cvxCrv: {
        contract: ETHEREUM_CONTRACTS.cvxCrv,
        name: 'cvxCRV',
        estimatedHolders: 30000,
        estimatedSupply: 300_000_000,
      },
      vlCvx: {
        contract: ETHEREUM_CONTRACTS.vlCvx,
        name: 'vlCVX',
        estimatedHolders: 15000,
        estimatedSupply: 50_000_000,
      },
    };

    const selected = tokenData[token as keyof typeof tokenData];

    // Known major holders (publicly known DAO treasuries, etc.)
    const knownMajorHolders = [
      {
        name: 'Convex Treasury',
        category: 'Protocol Treasury',
        estimatedPercentage: 5,
      },
      {
        name: 'Frax Finance',
        category: 'Protocol',
        estimatedPercentage: 8,
      },
      {
        name: 'Various DAOs',
        category: 'DAOs',
        estimatedPercentage: 15,
      },
    ];

    return [
      {
        json: {
          token: selected.name,
          contract: selected.contract,
          holderStats: {
            estimatedTotalHolders: selected.estimatedHolders,
            estimatedTotalHoldersFormatted: formatNumber(selected.estimatedHolders),
            estimatedSupply: selected.estimatedSupply,
            estimatedSupplyFormatted: formatNumber(selected.estimatedSupply),
          },
          majorHolders: knownMajorHolders.map((holder) => ({
            ...holder,
            estimatedAmount: (holder.estimatedPercentage / 100) * selected.estimatedSupply,
            estimatedAmountFormatted: formatNumber((holder.estimatedPercentage / 100) * selected.estimatedSupply),
            percentageFormatted: formatPercentage(holder.estimatedPercentage),
          })),
          distribution: {
            topHoldersConcentration: '~30% held by top 100 addresses',
            institutionalHolding: 'Significant DAO and protocol holdings',
          },
          cvxPrice,
          maxSupply: MAX_CVX_SUPPLY,
          note: 'Holder data is estimated. For accurate data, use on-chain analytics tools.',
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Token Holders');
  }
}
