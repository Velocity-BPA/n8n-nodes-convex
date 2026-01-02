/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { handleApiError } from '../../utils';
import { PROTOCOLS } from '../../constants';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  _index: number,
): Promise<INodeExecutionData[]> {
  try {
    const protocols = Object.values(PROTOCOLS).map((protocol) => ({
      id: protocol.id,
      name: protocol.name,
      description: protocol.description,
      rewardToken: protocol.rewardToken,
      stakingToken: protocol.stakingToken || 'N/A',
      defiLlamaSlug: protocol.defiLlamaSlug,
      status: 'active',
      features: getProtocolFeatures(protocol.name),
    }));

    return [
      {
        json: {
          totalProtocols: protocols.length,
          protocols,
          integrationOverview: {
            curve: {
              role: 'Primary - Largest integration',
              benefits: 'Boosted CRV rewards, no veCRV lock needed',
              products: ['LP staking', 'cvxCRV staking', 'vlCVX voting'],
            },
            frax: {
              role: 'Secondary - FXS integration',
              benefits: 'Boosted FXS rewards via cvxFXS',
              products: ['FXS pool staking', 'cvxFXS staking'],
            },
            prisma: {
              role: 'Tertiary - PRISMA integration',
              benefits: 'Boosted PRISMA rewards',
              products: ['Prisma pool staking', 'cvxPRISMA staking'],
            },
            fxProtocol: {
              role: 'Emerging - f(x) Protocol integration',
              benefits: 'Leverage and yield optimization',
              products: ['f(x) pool staking'],
            },
          },
          timestamp: new Date().toISOString(),
        },
      },
    ];
  } catch (error) {
    handleApiError(this, error, 'Get Supported Protocols');
  }
}

function getProtocolFeatures(protocolName: string): string[] {
  const features: Record<string, string[]> = {
    'Curve Finance': [
      'LP token staking',
      'CRV rewards boosting',
      'cvxCRV liquid staking',
      'Gauge voting via vlCVX',
      'Bribe market participation',
    ],
    'Frax Finance': [
      'FXS pool staking',
      'cvxFXS liquid staking',
      'FXS rewards boosting',
      'Frax gauge voting',
    ],
    'Prisma Finance': [
      'Prisma pool staking',
      'cvxPRISMA liquid staking',
      'PRISMA rewards boosting',
    ],
    'f(x) Protocol': [
      'Leveraged staking',
      'f(x) pool integration',
      'Yield optimization',
    ],
  };
  return features[protocolName] || [];
}
