/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { getConvexClient, handleApiError, validateRequiredParam, formatUsd } from '../../utils';

export const description: INodeProperties[] = [
  {
    displayName: 'Pool ID',
    name: 'poolId',
    type: 'string',
    default: '',
    required: true,
    placeholder: '0x...',
    description: 'The pool address or identifier',
    displayOptions: {
      show: {
        resource: ['pool'],
        operation: ['getPoolTvl'],
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
    const poolId = this.getNodeParameter('poolId', index) as string;

    validateRequiredParam(poolId, 'poolId');

    const pool = await client.defiLlama.getPoolById(poolId);

    if (!pool) {
      return [
        {
          json: {
            error: 'Pool not found',
            poolId,
          },
        },
      ];
    }

    return [
      {
        json: {
          poolId: pool.pool,
          symbol: pool.symbol,
          tvlUsd: pool.tvlUsd,
          tvlFormatted: formatUsd(pool.tvlUsd),
          chain: pool.chain,
          exposure: pool.exposure,
          stablecoin: pool.stablecoin,
          underlyingTokens: pool.underlyingTokens,
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Pool TVL');
  }
}
