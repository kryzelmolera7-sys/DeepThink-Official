import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEffectiveSystemInstruction,
  DEEPTHINK_IDENTITY_DIRECTIVE,
} from './models';

test('buildEffectiveSystemInstruction enforces DeepThink 1 identity for default and custom prompts', () => {
  const defaultPrompt = buildEffectiveSystemInstruction('universal');
  assert.ok(defaultPrompt.includes('Your name is DeepThink 1'));
  assert.ok(defaultPrompt.includes(DEEPTHINK_IDENTITY_DIRECTIVE));

  const customPrompt = buildEffectiveSystemInstruction('coding', 'Always answer in Rust.');
  assert.ok(customPrompt.includes('Your name is DeepThink 1'));
  assert.ok(customPrompt.includes('Always answer in Rust.'));
});
