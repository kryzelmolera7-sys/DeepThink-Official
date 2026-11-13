import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAttachmentFile,
  createThread,
  deriveThreadTitle,
  exportThreadToJson,
  exportThreadToMarkdown,
  filterThreads,
  forkThread,
  groupThreadsByRecency,
  MAX_ATTACHMENT_BYTES,
} from './threadStorage';

test('deriveThreadTitle trims whitespace and truncates long prompts cleanly', () => {
  assert.equal(deriveThreadTitle('   '), 'Untitled Thread');
  assert.equal(deriveThreadTitle('Hello   world'), 'Hello world');
  const longTitle = deriveThreadTitle('A'.repeat(60), 20);
  assert.equal(longTitle.length, 20);
  assert.ok(longTitle.endsWith('…'));
});

test('filterThreads matches both thread titles and message contents', () => {
  const t1 = createThread({ id: '1', title: 'Paxos Safety Proof' });
  const t2 = createThread({ id: '2', title: 'Database Migration' });
  t2.messages.push({
    id: 'm1',
    role: 'user',
    content: 'Write a PostgreSQL index strategy',
    createdAt: 1000,
  });

  assert.equal(filterThreads([t1, t2], 'paxos').length, 1);
  assert.equal(filterThreads([t1, t2], 'postgresql').length, 1);
  assert.equal(filterThreads([t1, t2], '').length, 2);
});

test('groupThreadsByRecency places threads into Today, Yesterday, Previous 7 Days, Older', () => {
  const now = new Date('2026-11-12T15:00:00Z').getTime();
  const today = createThread({ id: 'a', now: now - 3600_000 });
  const yesterday = createThread({ id: 'b', now: now - 26 * 3600_000 });
  const week = createThread({ id: 'c', now: now - 4 * 86_400_000 });
  const older = createThread({ id: 'd', now: now - 20 * 86_400_000 });

  const grouped = groupThreadsByRecency([older, week, yesterday, today], now);
  assert.deepEqual(
    grouped.map((g) => g.bucket),
    ['Today', 'Yesterday', 'Previous 7 Days', 'Older']
  );
  assert.equal(grouped[0].items[0].id, 'a');
});

test('classifyAttachmentFile validates file sizes and MIME/extensions', () => {
  assert.deepEqual(classifyAttachmentFile('diagram.png', 'image/png', 1024), {
    ok: true,
    kind: 'image',
  });
  assert.deepEqual(classifyAttachmentFile('server.ts', '', 500), {
    ok: true,
    kind: 'text',
  });
  assert.equal(
    classifyAttachmentFile('huge.png', 'image/png', MAX_ATTACHMENT_BYTES + 1).ok,
    false
  );
  assert.equal(classifyAttachmentFile('archive.exe', 'application/octet-stream', 100).ok, false);
});

test('exportThreadToMarkdown formats conversation, thoughts, and sources for DeepThink v1.5', () => {
  const thread = createThread({ id: 't1', title: 'Test Export', profile: 'reasoning' });
  thread.messages.push(
    { id: 'u1', role: 'user', content: 'What is 2+2?', createdAt: 1 },
    {
      id: 'a1',
      role: 'assistant',
      thoughts: 'Adding two and two yields four.',
      content: 'The answer is **4**.',
      sources: [{ title: 'Arithmetic Ref', uri: 'https://example.com' }],
      createdAt: 2,
    }
  );
  const md = exportThreadToMarkdown(thread);
  assert.ok(md.includes('# Test Export'));
  assert.ok(md.includes('DeepThink v1.5'));
  assert.ok(md.includes('<summary>Reasoning trace</summary>'));
  assert.ok(md.includes('The answer is **4**.'));
  assert.ok(md.includes('[Arithmetic Ref](https://example.com)'));
});

test('exportThreadToJson produces valid JSON containing version and messages', () => {
  const thread = createThread({ id: 't-json', title: 'JSON Thread' });
  thread.messages.push({
    id: 'm-1',
    role: 'user',
    content: 'Hello JSON',
    createdAt: 10,
  });
  const jsonStr = exportThreadToJson(thread);
  const parsed = JSON.parse(jsonStr) as { version: string; thread: { title: string } };
  assert.equal(parsed.version, 'deepthink-v1.5');
  assert.equal(parsed.thread.title, 'JSON Thread');
});

test('forkThread creates an independent branched copy up to target message', () => {
  const base = createThread({ id: 't-base', title: 'Root Thread' });
  base.messages.push(
    { id: 'u1', role: 'user', content: 'First prompt', createdAt: 1 },
    { id: 'a1', role: 'assistant', content: 'First answer', createdAt: 2 },
    { id: 'u2', role: 'user', content: 'Second prompt', createdAt: 3 },
    { id: 'a2', role: 'assistant', content: 'Second answer', createdAt: 4 }
  );

  const forked = forkThread(base, 'a1');
  assert.notEqual(forked.id, base.id);
  assert.equal(forked.messages.length, 2);
  assert.equal(forked.messages[1].id, 'a1');
  assert.ok(forked.title.includes('(Branch)'));
});
