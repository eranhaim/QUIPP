import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isWhatsAppCourseLeadEmail,
  isWhatsAppCourseLeadHumanRequest,
} from './whatsAppCourseLeadBot.service.js';

test('course lead bot recognizes explicit human escalation requests', () => {
  assert.equal(isWhatsAppCourseLeadHumanRequest('Can I speak to a human?'), true);
  assert.equal(isWhatsAppCourseLeadHumanRequest('אני רוצה נציג'), true);
  assert.equal(isWhatsAppCourseLeadHumanRequest('Tell me about refrigeration training'), false);
});

test('course lead bot only accepts a plausible email during qualification', () => {
  assert.equal(isWhatsAppCourseLeadEmail('learner@example.com'), true);
  assert.equal(isWhatsAppCourseLeadEmail('not an email'), false);
});
