import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveRequestId } from './requestContext.js';

test('request correlation accepts safe IDs and replaces unsafe values', () => {
  assert.equal(resolveRequestId('edge-123.trace_4'), 'edge-123.trace_4');
  assert.match(resolveRequestId(undefined), /^[0-9a-f-]{36}$/);
  assert.notEqual(resolveRequestId('contains spaces'), 'contains spaces');
  assert.notEqual(resolveRequestId('../header-injection'), '../header-injection');
  assert.notEqual(resolveRequestId(`a${'x'.repeat(128)}`), `a${'x'.repeat(128)}`);
});
