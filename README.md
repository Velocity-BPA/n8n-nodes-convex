# n8n-nodes-convex

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **Convex Finance** - the leading yield optimization protocol that boosts rewards for Curve, Frax, Prisma, and f(x) Protocol users. This node provides access to pool data, staking metrics, locking statistics, governance information, and multi-protocol yield tracking via DefiLlama API and The Graph subgraphs.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **Pool Analytics**: Access all Curve pools staked on Convex with APY, TVL, and reward data
- **cvxCRV Staking**: Monitor cvxCRV staking metrics, rewards, and APR
- **vlCVX Locking**: Track vote-locked CVX stats, voting power, and bribe revenue
- **Token Metrics**: Get CVX price, supply, emissions, and holder data
- **Protocol Overview**: Platform TVL, revenue, fee structure, and aggregated stats
- **Frax Integration**: Monitor cvxFXS staking and Frax pool yields
- **Prisma Integration**: Track cvxPRISMA staking and Prisma pool metrics
- **Governance**: Access Snapshot proposals, gauge votes, and voting schedules
- **Trigger Node**: Automated alerts for APY changes, new pools, governance events

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-convex`
5. Accept the risks and install

### Manual Installation

```bash
# Navigate to your n8n installation
cd ~/.n8n

# Install the package
npm install n8n-nodes-convex

# Restart n8n
n8n start
```

### Development Installation

```bash
# Clone and build
git clone https://github.com/Velocity-BPA/n8n-nodes-convex.git
cd n8n-nodes-convex
npm install
npm run build

# Link to n8n
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-convex

# Restart n8n
n8n start
```

## Credentials Setup

Create a **Convex Data** credential in n8n with the following options:

| Field | Description | Required |
|-------|-------------|----------|
| Data Source | DefiLlama (public), TheGraph, or Custom | Yes |
| Network | Ethereum, Arbitrum, or Fraxtal | Yes |
| Subgraph URL | Custom subgraph endpoint | For TheGraph |
| The Graph API Key | API key for The Graph | Optional |
| RPC URL | Custom RPC endpoint | For Custom source |

**Note**: DefiLlama is the default and requires no authentication.

## Resources & Operations

### Pool Resource (Curve Pools on Convex)
| Operation | Description |
|-----------|-------------|
| Get All Pools | List all Curve pools staked on Convex |
| Get Pool by ID | Get specific pool details |
| Get Pool APY | Current and projected APR |
| Get Pool TVL | Total value locked in pool |
| Get Pool Rewards | CRV, CVX, and extra rewards |
| Get Top Pools by APY | Highest yielding pools |
| Get Top Pools by TVL | Largest pools by TVL |

### Staking Resource (cvxCRV Staking)
| Operation | Description |
|-----------|-------------|
| Get cvxCRV Stats | Total staked, APR overview |
| Get cvxCRV Rewards | Detailed reward breakdown |
| Get Staking APR | Current staking returns |
| Get cvxCRV/CRV Ratio | Peg status monitoring |
| Get Staking TVL | Total cvxCRV staked |

### Locking Resource (vlCVX)
| Operation | Description |
|-----------|-------------|
| Get vlCVX Stats | Total locked, lock periods |
| Get Lock APR | Voting rewards APR |
| Get Voting Power | Protocol voting statistics |
| Get Lock Schedule | Unlock timeline |
| Get Bribe Revenue | Voting incentive data |
| Get Gauge Votes | CVX vote distribution |

### Token Resource
| Operation | Description |
|-----------|-------------|
| Get CVX Price | Current CVX market price |
| Get CVX Supply | Circulating, total, max supply |
| Get CVX Emissions | Emission schedule data |
| Get cvxCRV Supply | Total cvxCRV minted |
| Get Token Holders | Major CVX holders |

### Protocol Resource
| Operation | Description |
|-----------|-------------|
| Get Protocol TVL | Total Convex TVL |
| Get Protocol Revenue | Fee generation data |
| Get Fee Structure | Platform fees breakdown |
| Get Supported Protocols | Curve, Frax, Prisma, FX info |
| Get Platform Stats | Aggregated platform metrics |

### Frax Resource
| Operation | Description |
|-----------|-------------|
| Get Frax Pools | FXS pools on Convex |
| Get cvxFXS Stats | Staked FXS metrics |
| Get Frax APY | Frax pool yields |
| Get FXS Rewards | FXS reward distribution |

### Prisma Resource
| Operation | Description |
|-----------|-------------|
| Get Prisma Pools | Prisma pools on Convex |
| Get cvxPRISMA Stats | Staked PRISMA metrics |
| Get Prisma APY | Prisma pool yields |

### Snapshot Resource (Governance)
| Operation | Description |
|-----------|-------------|
| Get Active Proposals | Current governance votes |
| Get Gauge Weight Votes | Bi-weekly gauge votes |
| Get Vote Results | Historical vote outcomes |
| Get Voting Schedule | Next vote timing |

## Trigger Node

The Convex Trigger node provides polling-based alerts:

| Trigger | Description |
|---------|-------------|
| Pool APY Changed | Alert when pool yield crosses threshold |
| New Pool Added | Notification for new Curve pools |
| Pool TVL Changed | Significant TVL movement alert |
| Reward Rate Changed | Emission change notifications |
| cvxCRV APR Changed | Staking yield updates |
| cvxCRV Peg Alert | Ratio deviation warnings |
| New Proposal Created | Governance activity alerts |
| Gauge Vote Started | Bi-weekly vote cycle alerts |
| Vote Ended | Vote results notifications |
| CVX Price Alert | Price threshold triggers |
| Emission Event | CVX distribution alerts |
| Large Lock/Unlock | vlCVX movement tracking |

## Usage Examples

### Find Highest APY Pools

```javascript
// Configure Convex node
{
  "resource": "pool",
  "operation": "getTopPoolsByApy",
  "limit": 10
}
```

### Monitor cvxCRV Staking

```javascript
// Get current staking stats
{
  "resource": "staking",
  "operation": "getCvxCrvStats"
}

// Check peg status
{
  "resource": "staking",
  "operation": "getCvxCrvRatio"
}
```

### Track vlCVX Voting Power

```javascript
// Get voting statistics
{
  "resource": "locking",
  "operation": "getVotingPower"
}

// Check bribe revenue
{
  "resource": "locking",
  "operation": "getBribeRevenue"
}
```

### Governance Monitoring

```javascript
// Get active proposals
{
  "resource": "snapshot",
  "operation": "getActiveProposals"
}

// Check voting schedule
{
  "resource": "snapshot",
  "operation": "getVotingSchedule"
}
```

## Convex Finance Concepts

### Key Tokens
- **CVX**: Convex governance and utility token
- **cvxCRV**: Tokenized CRV permanently locked by Convex (liquid staking derivative)
- **vlCVX**: Vote-locked CVX for governance (16 week + 1 day lock)
- **cvxFXS**: Tokenized FXS for Frax integration
- **cvxPRISMA**: Tokenized PRISMA for Prisma integration

### Core Mechanics
- **Boost**: Up to 2.5x CRV reward multiplier from veCRV held by Convex
- **BaseRewardPool**: Main reward contract for LP pools
- **VirtualBalanceRewardPool**: Extra reward distribution contract
- **Booster Contract**: Main Convex deposit contract

### Fee Structure
Convex takes a 17% platform fee on CRV rewards:
- 10% to cvxCRV stakers
- 5% to vlCVX holders
- 1% to harvest caller
- 1% to platform

### Governance
- **Gauge Weight Vote**: Bi-weekly vote directing CRV emissions
- **Bribes**: Incentives paid to vlCVX holders for gauge votes
- **Curve Wars**: Competition for CRV liquidity and governance power
- **Snapshot Space**: cvx.eth for governance proposals

## Networks

| Network | Status | Notes |
|---------|--------|-------|
| Ethereum | ✅ Supported | Primary network |
| Arbitrum | ✅ Supported | L2 pools |
| Fraxtal | ✅ Supported | Frax L2 |

## Error Handling

The node implements comprehensive error handling:

- **API Errors**: Automatic retry with exponential backoff
- **Rate Limiting**: Respects API rate limits
- **Network Errors**: Clear error messages with troubleshooting hints
- **Validation**: Input validation with helpful error messages

## Security Best Practices

1. **API Keys**: Store credentials securely in n8n's credential store
2. **Rate Limiting**: Avoid excessive API calls
3. **Data Validation**: Always validate output data in workflows
4. **Monitoring**: Set up alerts for failed workflow executions

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format code
npm run format
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all tests pass and code follows the existing style.

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-convex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Velocity-BPA/n8n-nodes-convex/discussions)
- **Email**: support@velobpa.com

## Acknowledgments

- [Convex Finance](https://www.convexfinance.com/) - The yield optimization protocol
- [Curve Finance](https://curve.fi/) - The underlying DEX
- [DefiLlama](https://defillama.com/) - DeFi data API
- [The Graph](https://thegraph.com/) - Decentralized indexing
- [n8n](https://n8n.io/) - Workflow automation platform
