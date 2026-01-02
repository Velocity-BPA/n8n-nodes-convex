/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { handleApiError, formatPercentage } from '../../utils';
import { TOTAL_PLATFORM_FEE, getFeeStructureArray } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const feeStructure = getFeeStructureArray();

    return [
      {
        json: {
          protocol: 'Convex Finance',
          feeStructure: {
            totalPlatformFee: TOTAL_PLATFORM_FEE,
            totalPlatformFeeFormatted: formatPercentage(TOTAL_PLATFORM_FEE),
            userRetention: 100 - TOTAL_PLATFORM_FEE,
            userRetentionFormatted: formatPercentage(100 - TOTAL_PLATFORM_FEE),
          },
          breakdown: feeStructure.map((fee) => ({
            recipient: fee.recipient,
            percentage: fee.percentage,
            percentageFormatted: formatPercentage(fee.percentage),
            description: fee.description,
            shareOfPlatformFee: (fee.percentage / TOTAL_PLATFORM_FEE) * 100,
            shareOfPlatformFeeFormatted: formatPercentage((fee.percentage / TOTAL_PLATFORM_FEE) * 100),
          })),
          comparison: {
            convex: {
              totalFee: TOTAL_PLATFORM_FEE,
              description: 'Competitive fee with value redistribution',
            },
            competitors: [
              {
                name: 'Yearn Finance',
                managementFee: 2,
                performanceFee: 20,
                note: 'Traditional 2/20 structure',
              },
              {
                name: 'Stake DAO',
                performanceFee: 15,
                note: 'Similar yield optimizer',
              },
            ],
          },
          valueProposition: {
            cvxCrvStakers: 'Receive 10% of all CRV farmed',
            vlCvxHolders: 'Receive 5% of CRV + bribe revenue',
            harvesters: 'Receive 1% bounty for calling harvest',
            platform: 'Retains 1% for operations',
          },
          timestamp: new Date().toISOString(),
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Fee Structure');
  }
}
