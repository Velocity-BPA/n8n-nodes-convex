/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  ETHEREUM_CONTRACTS,
  ARBITRUM_CONTRACTS,
  FRAXTAL_CONTRACTS,
  CONTRACT_ADDRESSES,
  getContractAddresses,
  FEE_PERCENTAGES,
  TOTAL_PLATFORM_FEE,
  CONVEX_FEES,
  calculateNetApy,
  calculateFeeAmounts,
  getFeeStructureArray,
  MAX_CVX_SUPPLY,
  CVX_EMISSION_PARAMS,
  VLCVX_PARAMS,
  calculateCvxEmissionRate,
  estimateCvxFromCrv,
  PROTOCOLS,
  SNAPSHOT_SPACE,
  GAUGE_VOTE_CYCLE_DAYS,
  VL_CVX_LOCK_DURATION_DAYS,
} from '../../nodes/Convex/constants';

describe('Contract Constants', () => {
  describe('ETHEREUM_CONTRACTS', () => {
    it('should have Ethereum contracts defined', () => {
      expect(ETHEREUM_CONTRACTS).toBeDefined();
      expect(ETHEREUM_CONTRACTS.booster).toBe('0xF403C135812408BFbE8713b5A23a04b3D48AAE31');
      expect(ETHEREUM_CONTRACTS.cvx).toBe('0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B');
      expect(ETHEREUM_CONTRACTS.cvxCrv).toBe('0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7');
      expect(ETHEREUM_CONTRACTS.vlCvx).toBe('0x72a19342e8F1838460eBFCCEf09F6585e32db86E');
      expect(ETHEREUM_CONTRACTS.crv).toBe('0xD533a949740bb3306d119CC777fa900bA034cd52');
    });
  });

  describe('ARBITRUM_CONTRACTS', () => {
    it('should have Arbitrum contracts defined', () => {
      expect(ARBITRUM_CONTRACTS).toBeDefined();
      expect(ARBITRUM_CONTRACTS.booster).toBeDefined();
    });
  });

  describe('FRAXTAL_CONTRACTS', () => {
    it('should have Fraxtal contracts defined', () => {
      expect(FRAXTAL_CONTRACTS).toBeDefined();
    });
  });

  describe('CONTRACT_ADDRESSES', () => {
    it('should have all network contracts', () => {
      expect(CONTRACT_ADDRESSES.ETHEREUM).toBe(ETHEREUM_CONTRACTS);
      expect(CONTRACT_ADDRESSES.ARBITRUM).toBe(ARBITRUM_CONTRACTS);
      expect(CONTRACT_ADDRESSES.FRAXTAL).toBe(FRAXTAL_CONTRACTS);
    });
  });

  describe('getContractAddresses', () => {
    it('should return Ethereum contracts by default', () => {
      const contracts = getContractAddresses('ethereum');
      expect(contracts).toBe(ETHEREUM_CONTRACTS);
    });

    it('should return Arbitrum contracts', () => {
      const contracts = getContractAddresses('arbitrum');
      expect(contracts).toBe(ARBITRUM_CONTRACTS);
    });

    it('should handle case-insensitive network names', () => {
      expect(getContractAddresses('ETHEREUM')).toBe(ETHEREUM_CONTRACTS);
      expect(getContractAddresses('Ethereum')).toBe(ETHEREUM_CONTRACTS);
    });

    it('should return Ethereum for unknown networks', () => {
      const contracts = getContractAddresses('unknown');
      expect(contracts).toBe(ETHEREUM_CONTRACTS);
    });
  });
});

describe('Fee Constants', () => {
  describe('FEE_PERCENTAGES', () => {
    it('should have correct fee percentages', () => {
      expect(FEE_PERCENTAGES.TOTAL_FEE_PERCENT).toBe(17);
      expect(FEE_PERCENTAGES.CVX_CRV_STAKERS_PERCENT).toBe(10);
      expect(FEE_PERCENTAGES.VL_CVX_PERCENT).toBe(5);
      expect(FEE_PERCENTAGES.HARVEST_CALLER_PERCENT).toBe(1);
      expect(FEE_PERCENTAGES.PLATFORM_PERCENT).toBe(1);
    });

    it('should have fees that sum to total', () => {
      const sum = 
        FEE_PERCENTAGES.CVX_CRV_STAKERS_PERCENT +
        FEE_PERCENTAGES.VL_CVX_PERCENT +
        FEE_PERCENTAGES.HARVEST_CALLER_PERCENT +
        FEE_PERCENTAGES.PLATFORM_PERCENT;
      expect(sum).toBe(FEE_PERCENTAGES.TOTAL_FEE_PERCENT);
    });
  });

  describe('TOTAL_PLATFORM_FEE', () => {
    it('should be 17 percent', () => {
      expect(TOTAL_PLATFORM_FEE).toBe(17);
    });
  });

  describe('CONVEX_FEES', () => {
    it('should have fee breakdown for each recipient', () => {
      expect(CONVEX_FEES.cvxCrvStakers.percentage).toBe(10);
      expect(CONVEX_FEES.vlCvxHolders.percentage).toBe(5);
      expect(CONVEX_FEES.harvestCaller.percentage).toBe(1);
      expect(CONVEX_FEES.platform.percentage).toBe(1);
    });
  });

  describe('calculateNetApy', () => {
    it('should calculate net APY after fees', () => {
      // 10% gross APY should become 8.3% net (after 17% fee)
      const netApy = calculateNetApy(10);
      expect(netApy).toBeCloseTo(8.3, 1);
    });

    it('should handle 0 APY', () => {
      expect(calculateNetApy(0)).toBe(0);
    });
  });

  describe('calculateFeeAmounts', () => {
    it('should calculate fee breakdown correctly', () => {
      const fees = calculateFeeAmounts(1000);
      
      expect(fees.cvxCrvStakers).toBe(100); // 10%
      expect(fees.vlCvxHolders).toBe(50); // 5%
      expect(fees.harvestCaller).toBe(10); // 1%
      expect(fees.platform).toBe(10); // 1%
    });

    it('should handle 0 amount', () => {
      const fees = calculateFeeAmounts(0);
      expect(fees.cvxCrvStakers).toBe(0);
      expect(fees.platform).toBe(0);
    });
  });

  describe('getFeeStructureArray', () => {
    it('should return an array of fee descriptions', () => {
      const structure = getFeeStructureArray();
      
      expect(Array.isArray(structure)).toBe(true);
      expect(structure.length).toBe(4);
      
      // Check that first entry has expected properties
      const cvxCrvEntry = structure.find(s => s.name === 'cvxCrvStakers');
      expect(cvxCrvEntry).toBeDefined();
      expect(cvxCrvEntry?.percentage).toBe(10);
    });
  });
});

describe('Emission Constants', () => {
  describe('MAX_CVX_SUPPLY', () => {
    it('should be 100 million', () => {
      expect(MAX_CVX_SUPPLY).toBe(100_000_000);
    });
  });

  describe('CVX_EMISSION_PARAMS', () => {
    it('should have correct parameters', () => {
      expect(CVX_EMISSION_PARAMS.totalCliffs).toBe(1000);
      expect(CVX_EMISSION_PARAMS.initialRate).toBe(1);
      expect(CVX_EMISSION_PARAMS.cliffSize).toBe(100_000);
    });
  });

  describe('VLCVX_PARAMS', () => {
    it('should have correct lock duration', () => {
      expect(VLCVX_PARAMS.lockDuration).toBe(16);
      expect(VLCVX_PARAMS.gracePeriod).toBe(1);
    });
  });

  describe('calculateCvxEmissionRate', () => {
    it('should return 1 for early stages', () => {
      const rate = calculateCvxEmissionRate(0);
      expect(rate).toBe(1);
    });

    it('should decrease rate as more CRV is earned', () => {
      const earlyRate = calculateCvxEmissionRate(1_000_000);
      const laterRate = calculateCvxEmissionRate(50_000_000);
      
      expect(laterRate).toBeLessThan(earlyRate);
    });

    it('should return 0 when all CVX is minted', () => {
      const rate = calculateCvxEmissionRate(100_000_000_000);
      expect(rate).toBe(0);
    });
  });

  describe('estimateCvxFromCrv', () => {
    it('should estimate CVX based on CRV amount and emission rate', () => {
      const cvx = estimateCvxFromCrv(100, 0);
      expect(cvx).toBe(100); // 1:1 at start
    });

    it('should return less CVX as more has been earned', () => {
      const earlyCvx = estimateCvxFromCrv(100, 0);
      const laterCvx = estimateCvxFromCrv(100, 50_000_000);
      
      expect(laterCvx).toBeLessThan(earlyCvx);
    });
  });

  describe('GAUGE_VOTE_CYCLE_DAYS', () => {
    it('should be 14 days (bi-weekly)', () => {
      expect(GAUGE_VOTE_CYCLE_DAYS).toBe(14);
    });
  });

  describe('VL_CVX_LOCK_DURATION_DAYS', () => {
    it('should be 113 days (16 weeks + 1 day)', () => {
      expect(VL_CVX_LOCK_DURATION_DAYS).toBe(113);
    });
  });
});

describe('Protocol Constants', () => {
  describe('PROTOCOLS', () => {
    it('should have Curve defined', () => {
      expect(PROTOCOLS.curve).toBeDefined();
      expect(PROTOCOLS.curve.name).toBe('Curve Finance');
      expect(PROTOCOLS.curve.rewardToken).toBe('CRV');
    });

    it('should have Frax defined', () => {
      expect(PROTOCOLS.frax).toBeDefined();
      expect(PROTOCOLS.frax.name).toBe('Frax Finance');
      expect(PROTOCOLS.frax.rewardToken).toBe('FXS');
    });

    it('should have Prisma defined', () => {
      expect(PROTOCOLS.prisma).toBeDefined();
      expect(PROTOCOLS.prisma.name).toBe('Prisma Finance');
    });
  });

  describe('SNAPSHOT_SPACE', () => {
    it('should be cvx.eth', () => {
      expect(SNAPSHOT_SPACE).toBe('cvx.eth');
    });
  });
});
