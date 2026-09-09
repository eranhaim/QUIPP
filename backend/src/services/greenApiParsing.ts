const OPT_OUT_WORDS = new Set([
  'stop',
  'unsubscribe',
  'הסר',
  'הסרה',
  'ביטול',
  'בטל',
  'בטלו',
  'עצור',
  'תפסיק',
  'תפסיקו',
  'הפסק',
  'הפסק הודעות',
  'הסר אותי',
  'לא רוצה',
]);
const OPT_IN_WORDS = new Set(['start', 'חזרה', 'חזור', 'התחל', 'התחלה']);

export type GreenApiCommand = 'opt_in' | 'opt_out' | null;

export function normalizeGreenApiCommand(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[\s.!?,;:'"״׳]+|[\s.!?,;:'"״׳]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function classifyGreenApiCommand(value: string): GreenApiCommand {
  const command = normalizeGreenApiCommand(value);
  if (OPT_OUT_WORDS.has(command)) return 'opt_out';
  if (OPT_IN_WORDS.has(command)) return 'opt_in';
  return null;
}

export function normalizeGreenApiPhone(chatId: string): string | null {
  if (!chatId.endsWith('@c.us')) return null;
  const digits = chatId.slice(0, -'@c.us'.length).replace(/\D/g, '');
  return digits ? `+${digits}` : null;
}

export interface GreenApiMessageData {
  typeMessage: string;
  textMessageData?: { textMessage: string };
  extendedTextMessageData?: { text: string };
}

export function extractGreenApiMessageText(
  messageData: GreenApiMessageData,
): string | null {
  if (messageData.typeMessage === 'textMessage') {
    return messageData.textMessageData?.textMessage ?? null;
  }
  if (messageData.typeMessage === 'extendedTextMessage') {
    return messageData.extendedTextMessageData?.text ?? null;
  }
  return null;
}
