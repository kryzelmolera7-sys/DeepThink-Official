import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createThinkTagParserState,
  formatDurationMs,
  formatInferenceError,
  isQuotaOrRateLimitError,
  parseSseBuffer,
  parseThinkTagChunk,
} from './streamParser';

test('parseThinkTagChunk extracts split <think> tags across chunks', () => {
  let state = createThinkTagParserState();

  const r1 = parseThinkTagChunk('Hello <thi', state);
  assert.equal(r1.textDelta, 'Hello ');
  assert.equal(r1.thoughtDelta, '');
  state = r1.nextState;

  const r2 = parseThinkTagChunk('nk>step 1\nstep 2</th', state);
  assert.equal(r2.textDelta, '');
  assert.equal(r2.thoughtDelta, 'step 1\nstep 2');
  state = r2.nextState;

  const r3 = parseThinkTagChunk('ink>Final answer.', state, true);
  assert.equal(r3.thoughtDelta, '');
  assert.equal(r3.textDelta, 'Final answer.');
});

test('parseThinkTagChunk handles plain text without think tags', () => {
  const state = createThinkTagParserState();
  const r = parseThinkTagChunk('Just a normal response.', state, true);
  assert.equal(r.thoughtDelta, '');
  assert.equal(r.textDelta, 'Just a normal response.');
});

test('parseSseBuffer handles partial event boundaries across chunks', () => {
  const first = parseSseBuffer('event: thought\ndata: {"delta":"abc"}\n\nevent: text\ndata: {"del', '');
  assert.equal(first.events.length, 1);
  assert.deepEqual(first.events[0], { event: 'thought', data: '{"delta":"abc"}' });
  assert.equal(first.remaining, 'event: text\ndata: {"del');

  const second = parseSseBuffer('ta":"xyz"}\n\n', first.remaining);
  assert.equal(second.events.length, 1);
  assert.deepEqual(second.events[0], { event: 'text', data: '{"delta":"xyz"}' });
  assert.equal(second.remaining, '');
});

test('formatDurationMs formats sub-second, seconds, and minutes cleanly', () => {
  assert.equal(formatDurationMs(420), '420ms');
  assert.equal(formatDurationMs(2350), '2.4s');
  assert.equal(formatDurationMs(65000), '1m 5s');
});

test('formatInferenceError unwraps nested JSON 429 errors into readable prose', () => {
  const nested = JSON.stringify({
    error: {
      message: JSON.stringify({
        error: {
          code: 429,
          message: 'You exceeded your current quota',
          status: 'RESOURCE_EXHAUSTED',
        },
      }),
    },
  });
  assert.equal(isQuotaOrRateLimitError(nested), true);
  const formatted = formatInferenceError(new Error(nested));
  assert.ok(formatted.includes('429'));
  assert.ok(!formatted.includes('{"error"'));
});
