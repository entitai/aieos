/**
 * EVM payment helpers for the AIEOS CLI.
 * Handles USDC balance checks and transfers on Base / Base Sepolia.
 * Private keys are used only in-memory and never written to disk.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
  type Hex,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function' as const,
    inputs: [
      { name: 'to',     type: 'address' as const },
      { name: 'amount', type: 'uint256' as const },
    ],
    outputs: [{ name: '', type: 'bool' as const }],
    stateMutability: 'nonpayable' as const,
  },
  {
    name: 'balanceOf',
    type: 'function' as const,
    inputs: [{ name: 'account', type: 'address' as const }],
    outputs: [{ name: '', type: 'uint256' as const }],
    stateMutability: 'view' as const,
  },
] as const;

export const CHAIN_CONFIG = {
  'base-sepolia': {
    chain:        baseSepolia,
    rpc:          'https://sepolia.base.org',
    usdcAddress:  '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
    explorerBase: 'https://sepolia.basescan.org/tx',
    label:        'Base Sepolia (testnet)',
    faucetUsdc:   'https://faucet.circle.com/',
    faucetEth:    'https://www.coinbase.com/faucets/base-ethereum-goerli-faucet',
  },
  'base': {
    chain:        base,
    rpc:          'https://mainnet.base.org',
    usdcAddress:  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    explorerBase: 'https://basescan.org/tx',
    label:        'Base',
    faucetUsdc:   null,
    faucetEth:    null,
  },
} as const;

export type SupportedChain = keyof typeof CHAIN_CONFIG;

export function isSupportedChain(chain: string): chain is SupportedChain {
  return chain in CHAIN_CONFIG;
}

export interface Balances {
  usdc: string;  // formatted e.g. "2.50"
  eth:  string;  // formatted e.g. "0.001234"
  usdcRaw: bigint;
}

export async function getBalances(address: Address, chain: SupportedChain): Promise<Balances> {
  const cfg    = CHAIN_CONFIG[chain];
  const client = createPublicClient({ chain: cfg.chain, transport: http(cfg.rpc) });

  const [usdcRaw, ethRaw] = await Promise.all([
    client.readContract({
      address:      cfg.usdcAddress,
      abi:          ERC20_ABI,
      functionName: 'balanceOf',
      args:         [address],
    }) as Promise<bigint>,
    client.getBalance({ address }),
  ]);

  return {
    usdc:    formatUnits(usdcRaw, 6),
    eth:     formatUnits(ethRaw, 18),
    usdcRaw,
  };
}

export interface SendUsdcResult {
  txHash:      Hex;
  explorerUrl: string;
}

export async function sendUsdc(
  privateKeyHex: string,
  toAddress:     Address,
  amount:        string,        // human-readable e.g. "2.00"
  chain:         SupportedChain,
): Promise<SendUsdcResult> {
  const cfg = CHAIN_CONFIG[chain];
  const pk  = (privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`) as Hex;
  const account = privateKeyToAccount(pk);

  const publicClient = createPublicClient({ chain: cfg.chain, transport: http(cfg.rpc) });
  const walletClient = createWalletClient({ account, chain: cfg.chain, transport: http(cfg.rpc) });

  const amountRaw = parseUnits(amount, 6);

  const txHash = await walletClient.writeContract({
    address:      cfg.usdcAddress,
    abi:          ERC20_ABI,
    functionName: 'transfer',
    args:         [toAddress as Address, amountRaw],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    explorerUrl: `${cfg.explorerBase}/${txHash}`,
  };
}

/** Normalise a raw hex private key — strips 0x, validates length. */
export function normalisePrivateKey(raw: string): string | null {
  const stripped = raw.startsWith('0x') ? raw.slice(2) : raw;
  if (!/^[0-9a-fA-F]{64}$/.test(stripped)) return null;
  return stripped;
}
