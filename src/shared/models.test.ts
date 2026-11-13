import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEffectiveSystemInstruction,
  DEEPTHINK_IDENTITY_DIRECTIVE,
} from './models';

test('buildEffectiveSystemInstruction enforces DeepThink v1.5 identity for default and custom prompts', () => {
  const defaultPrompt = buildEffectiveSystemInstruction('universal');
  assert.ok(defaultPrompt.includes('Your name is DeepThink v1.5'));
  assert.ok(defaultPrompt.includes(DEEPTHINK_IDENTITY_DIRECTIVE));

  const customPrompt = buildEffectiveSystemInstruction('coding', 'Always answer in Rust.');
  assert.ok(customPrompt.includes('Your name is DeepThink v1.5'));
  assert.ok(customPrompt.includes('Always answer in Rust.'));
});

test('ENGINE_ROUTES_INFO defines swarm and security-swarm routes', async () => {
  const { ENGINE_ROUTES_INFO, STARTER_PROMPTS } = await import('./models');
  
  const swarmRoute = ENGINE_ROUTES_INFO.find((r) => r.id === 'swarm');
  assert.ok(swarmRoute, 'Swarm route should exist');
  assert.ok(swarmRoute.description.includes('Consensus engine'));

  const secRoute = ENGINE_ROUTES_INFO.find((r) => r.id === 'security-swarm');
  assert.ok(secRoute, 'Security Swarm route should exist');
  assert.ok(secRoute.name.includes('Security Swarm'));

  const swarmStarter = STARTER_PROMPTS.find((p) => p.id === 'starter-swarm');
  assert.ok(swarmStarter, 'Swarm starter prompt should exist');

  const secStarter = STARTER_PROMPTS.find((p) => p.id === 'starter-security-swarm');
  assert.ok(secStarter, 'Security swarm starter prompt should exist');
});
