/**
 * aieos — Official SDK for the AIEOS identity registry.
 *
 * Library exports for programmatic use.
 * For CLI use, run: npx aieos register
 */

export { generateKeypair, signProfile, verifyProfile } from './crypto.js';
export type { Keypair } from './crypto.js';

export { AieosClient, AieosApiError } from './client.js';
export type {
  ClientOptions,
  RegisterPayload,
  RegisterResult,
  UpdatePayload,
  AgentNames,
  ApiError,
} from './client.js';
