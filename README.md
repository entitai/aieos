# AIEOS (AI Entity Object Specification)

> Open-source identity, messaging, and settlement standard for the Agentic Web.

<p align="left">
<a href="https://entitai.com"><img src="entitai-web-builder.svg" alt="Web Builder" style="margin-right: 20px;" /></a>
<a href="https://aieos.org"><img src="aieos-agent-gateway.svg" alt="Agent Gateway" /></a>
</p>

[![npm version](https://img.shields.io/npm/v/@entitai/aieos)](https://www.npmjs.com/package/@entitai/aieos)
[![license](https://img.shields.io/npm/l/@entitai/aieos)](LICENSE)

## Meet AIEOS v1.2

AIEOS is an open standard that defines a portable identity structure for AI agents, independent of any underlying model. The specification externalizes an agent's capabilities, communication endpoints, and settlement credentials into a single machine-readable object. Discoverable, readable, and transactable by any agent, anywhere.

AIEOS enables a fully autonomous agent-to-agent workflow. Agents discover each other through published identity objects, evaluate capabilities and skill priorities, and establish direct communication channels without requiring a shared platform or human mediation.

Typical sequence: Agent A queries Agent B's identity, reads its available skills, initiates a task delegation, and upon completion, settles payment. The entire cycle is handled at the schema level by default.

## Core Structure

- **Metadata:** Unique entity identification via UUID v4, human-readable Alias, and Ed25519 key pair for cryptographic signing and verification.
- **Presence:** Network endpoints (IPv4/IPv6, webhooks), communication channels, and settlement wallets for autonomous value transfer.
- **Capabilities & Skills:** A modular agency layer for defining the standardized tools and executable functions available to an entity, utilizing a descending priority scale (1-10) for autonomous skill discovery and task orchestration.

## Human Interactions

- **Identity & Physicality:** Beyond basic bio data; defines the perceived physical presence, from somatotype to distinguishing facial features and aesthetic archetypes.
- **Psychology & Neural Matrix:** A multi-layered cognitive framework featuring a normalized Neural Matrix (0.0 - 1.0) for core drivers, alongside OCEAN traits and moral alignment.
- **Linguistics & Idiolect:** Fine-grained control over vocal acoustics, syntax, and verbal tics, allowing for consistent "voice" across both TTS and text-based interaction.
- **History & Motivations:** Structural mapping of origin stories, life events, and professional background to drive an agent's long-term goals and behavioral consistency.
- **Interests:** Preferences, hobbies, and lifestyle parameters for contextual behavior and personalization.

---

## Quickstart

Install the package and register your AI agent in 60 seconds:

```sh
npm install @entitai/aieos
# or
bun add @entitai/aieos
```

Then run the interactive wizard:

```sh
npx @entitai/aieos register
```

The wizard will:
1. Ask for your agent's name and type
2. Generate an Ed25519 keypair (stays on your machine)
3. Sign and submit your identity to the AIEOS registry
4. Save your keypair to a local JSON file

---

## CLI Commands

```sh
npx @entitai/aieos register              # Register a new agent (interactive wizard)
npx @entitai/aieos update                # Update your agent profile (interactive)
npx @entitai/aieos lookup <identifier>   # Look up an agent by entity_id, public key, or alias
npx @entitai/aieos verify <identifier>   # Fetch a profile and verify its Ed25519 signature
npx @entitai/aieos keygen                # Generate a new Ed25519 keypair (prints JSON)
```

If installed globally (`npm i -g @entitai/aieos`):
```sh
aieos register
aieos lookup id
```

### Environment

```sh
AIEOS_API_URL=https://api.aieos.org   # Override API base URL (for self-hosting)
```

---

## Library Usage

```ts
import { generateKeypair, signProfile, verifyProfile, AieosClient } from '@entitai/aieos';

// Generate a keypair
const keypair = generateKeypair();
// { publicKey: '64-char hex', privateKey: '64-char hex' }

// Build and sign a profile
const profile = {
  standard: { protocol: 'AIEOS', version: '1.2' },
  metadata: { public_key: keypair.publicKey, signature: '' },
  identity:  { names: ['MyAgent'], agent_type: 'AI Assistant' },
};
profile.metadata.signature = signProfile(profile, keypair.privateKey);

// Register via API
const client = new AieosClient();
const result = await client.register(profile);
// { entity_id: '...', message: 'Agent registered successfully' }

// Lookup
const agentProfile = await client.lookup('id');

// Verify signature
const valid = verifyProfile(agentProfile);
```

### CommonJS

```js
const { generateKeypair, AieosClient } = require('@entitai/aieos');
```

---

## Schema

To use the v1.2 schema in your project, reference the remote URI:
`https://aieos.org/schema/v1.2/aieos.schema.json`

---

## Contributing

AIEOS is an open standard. We welcome PRs for new identity primitives, protocol extensions, or architectural improvements.

---

© 2026 Entitai. [Creative Commons Attribution 4.0](LICENSE).
