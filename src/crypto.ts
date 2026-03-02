import {
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
  createPrivateKey,
  createPublicKey,
} from 'node:crypto';

export interface Keypair {
  publicKey: string;  // 64-char hex (32 bytes)
  privateKey: string; // 64-char hex (32-byte seed)
}

/**
 * Generate a new Ed25519 keypair.
 * Returns raw keys as lowercase hex strings.
 * Public key: 32 bytes = 64 hex chars.
 * Private key: 32-byte seed = 64 hex chars (NOT the full 64-byte expanded key).
 */
export function generateKeypair(): Keypair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding:  { type: 'spki',  format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  // SPKI DER for Ed25519: 12-byte header + 32-byte public key
  const rawPublicKey  = (publicKey  as unknown as Buffer).subarray(12);
  // PKCS8 DER for Ed25519: 16-byte header + 32-byte seed
  const rawPrivateKey = (privateKey as unknown as Buffer).subarray(16);

  return {
    publicKey:  rawPublicKey.toString('hex'),
    privateKey: rawPrivateKey.toString('hex'),
  };
}

/**
 * Sign an AIEOS profile.
 *
 * Signing input: RFC 8785 canonical JSON where metadata is reduced to
 * ONLY { public_key } — all other metadata fields are stripped before signing
 * (they are server-assigned and not client-authenticated).
 *
 * Returns the 128-char hex Ed25519 signature.
 */
export function signProfile(
  profile: Record<string, unknown>,
  privateKeyHex: string,
): string {
  const canonical = buildSignInput(profile);

  const seed = Buffer.from(privateKeyHex, 'hex');
  if (seed.byteLength !== 32) {
    throw new Error('privateKey must be 64 hex chars (32-byte seed)');
  }
  // Reconstruct PKCS8 DER from seed
  const pkcs8Header = Buffer.from('302e020100300506032b657004220420', 'hex');
  const pkcs8Der    = Buffer.concat([pkcs8Header, seed]);
  const keyObject   = createPrivateKey({ key: pkcs8Der, format: 'der', type: 'pkcs8' });

  // Ed25519 uses its own internal hash — pass null as algorithm
  return cryptoSign(null, Buffer.from(canonical), keyObject).toString('hex');
}

/**
 * Verify the Ed25519 signature on an AIEOS profile.
 * Returns true if the signature is valid.
 */
export function verifyProfile(profile: Record<string, unknown>): boolean {
  try {
    const meta = profile.metadata as Record<string, unknown> | undefined;
    if (!meta?.signature || !meta?.public_key) return false;

    const publicKeyHex  = meta.public_key as string;
    const signatureHex  = meta.signature  as string;

    const canonical = buildSignInput(profile);

    // Reconstruct SPKI DER from raw 32-byte public key
    const rawPubKey  = Buffer.from(publicKeyHex, 'hex');
    const spkiHeader = Buffer.from('302a300506032b6570032100', 'hex');
    const spkiDer    = Buffer.concat([spkiHeader, rawPubKey]);
    const keyObject  = createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });

    return cryptoVerify(
      null,
      Buffer.from(canonical),
      keyObject,
      Buffer.from(signatureHex, 'hex'),
    );
  } catch {
    return false;
  }
}

/**
 * Build the canonical signing input.
 * Metadata is reduced to ONLY { public_key } before canonicalization —
 * all other metadata fields are server-assigned and excluded from signing.
 */
function buildSignInput(profile: Record<string, unknown>): string {
  const copy  = JSON.parse(JSON.stringify(profile)) as Record<string, unknown>;
  const meta  = copy.metadata as Record<string, unknown> | undefined;
  copy.metadata = { public_key: meta?.public_key ?? '' };
  return canonicalize(copy);
}

/**
 * Minimal RFC 8785 (JCS) canonical JSON serialization.
 * Sufficient for AIEOS profiles (strings, integers, booleans, objects, arrays).
 */
function canonicalize(data: unknown): string {
  if (data === null || typeof data !== 'object') {
    return JSON.stringify(data) ?? 'null';
  }
  if (Array.isArray(data)) {
    return '[' + (data as unknown[]).map(canonicalize).join(',') + ']';
  }
  const keys = Object.keys(data as Record<string, unknown>).sort();
  return '{' + keys.map((k) =>
    JSON.stringify(k) + ':' + canonicalize((data as Record<string, unknown>)[k])
  ).join(',') + '}';
}
