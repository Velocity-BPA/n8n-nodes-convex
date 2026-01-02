/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties, IDataObject } from 'n8n-workflow';
import { getConvexClient, handleApiError, formatUsd } from '../../utils';
import { PROTOCOLS } from '../../constants';

export const description: INodeProperties[] = [
  {
    displayName: 'Include Breakdown',
    name: 'includeBreakdown',
    type: 'boolean',
    default: true,
    description: 'Whether to include TVL breakdown by chain and protocol',
    displayOptions: {
      show: {
        resource: ['protocol'],
        operation: ['getProtocolTvl'],
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
    const includeBreakdown = this.getNodeParameter('includeBreakdown', index, true) as boolean;

    // Get protocol data from DefiLlama
    const protocolData = await client.defiLlama.getProtocolData();
    const totalTvl = await client.defiLlama.getTvl();

    const result: IDataObject = {
      protocol: 'Convex Finance',
      totalTvl,
      totalTvlFormatted: formatUsd(totalTvl),
      timestamp: new Date().toISOString(),
    };

    if (includeBreakdown && protocolData) {
      // Chain breakdown from currentChainTvls
      const chainTvls = protocolData.currentChainTvls || {};
      const chainBreakdown = Object.entries(chainTvls).map(([chain, tvl]) => ({
        chain,
        tvl,
        tvlFormatted: formatUsd(tvl),
      }));

      result.chainBreakdown = chainBreakdown;

      // Protocol breakdown (Curve, Frax, etc.)
      result.protocolBreakdown = Object.values(PROTOCOLS).map((protocol) => ({
        name: protocol.name,
        description: protocol.description,
        estimatedTvlShare: protocol.name === 'Curve Finance' ? '85%' : protocol.name === 'Frax Finance' ? '10%' : '5%',
      }));
    }

    // Add metadata
    result.metadata = {
      source: 'DefiLlama',
      slug: protocolData?.slug || 'convex-finance',
      category: 'Yield',
      updatedAt: new Date().toISOString(),
    };

    return [{ json: result }];
  } catch (error) {
    handleApiError(this, error, 'Get Protocol TVL');
  }
}
