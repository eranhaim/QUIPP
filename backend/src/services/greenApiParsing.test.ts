import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyGreenApiCommand,
  extractGreenApiMessageText,
  normalizeGreenApiCommand,
  normalizeGreenApiPhone,
} from './greenApiParsing.js';

test('GreenAPI command normalization handles punctuation, whitespace, case, and Hebrew', () => {
  assert.equal(normalizeGreenApiCommand('  STOP!!!  '), 'stop');
  assert.equal(normalizeGreenApiCommand('  הפסק   הודעות. '), 'הפסק הודעות');
  assert.equal(classifyGreenApiCommand('Unsubscribe'), 'opt_out');
  assert.equal(classifyGreenApiCommand('  לא רוצה '), 'opt_out');
  assert.equal(classifyGreenApiCommand('START.'), 'opt_in');
  assert.equal(classifyGreenApiCommand('חזרה'), 'opt_in');
  assert.equal(classifyGreenApiCommand('start the oven'), null);
});

test('GreenAPI phone normalization accepts direct chats only', () => {
  assert.equal(normalizeGreenApiPhone('14165550199@c.us'), '+14165550199');
  assert.equal(normalizeGreenApiPhone('+1 (416) 555-0199@c.us'), '+14165550199');
  assert.equal(normalizeGreenApiPhone('120363000000@g.us'), null);
  assert.equal(normalizeGreenApiPhone('@c.us'), null);
});

test('GreenAPI text extraction supports plain and extended messages safely', () => {
  assert.equal(
    extractGreenApiMessageText({
      typeMessage: 'textMessage',
      textMessageData: { textMessage: 'hello' },
    }),
    'hello',
  );
  assert.equal(
    extractGreenApiMessageText({
      typeMessage: 'extendedTextMessage',
      extendedTextMessageData: { text: 'quoted reply' },
    }),
    'quoted reply',
  );
  assert.equal(extractGreenApiMessageText({ typeMessage: 'imageMessage' }), null);
  assert.equal(extractGreenApiMessageText({ typeMessage: 'textMessage' }), null);
});
