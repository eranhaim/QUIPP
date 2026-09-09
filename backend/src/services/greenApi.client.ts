import { env } from '../config/env.js';

const REQUEST_TIMEOUT_MS = 10_000;

export interface SendTextInput {
  chatId: string;
  message: string;
}

export interface SendTextResult {
  externalMessageId: string | null;
}

export interface OutboundTextSender {
  sendText(input: SendTextInput): Promise<SendTextResult>;
}

export class GreenApiClient implements OutboundTextSender {
  isConfigured(): boolean {
    return Boolean(
      env.GREEN_API_ID_INSTANCE &&
        env.GREEN_API_TOKEN_INSTANCE &&
        env.GREEN_API_WEBHOOK_TOKEN,
    );
  }

  async sendText(input: SendTextInput): Promise<SendTextResult> {
    return this.sendMessage(input.chatId, input.message);
  }

  async sendMessage(chatId: string, message: string): Promise<SendTextResult> {
    const response = await this.request<{ idMessage?: unknown }>('sendMessage', {
      method: 'POST',
      body: JSON.stringify({ chatId, message }),
    });
    return {
      externalMessageId:
        typeof response.idMessage === 'string' ? response.idMessage : null,
    };
  }

  async getState(): Promise<string> {
    const response = await this.request<{ stateInstance?: unknown }>(
      'getStateInstance',
      { method: 'GET' },
    );
    if (typeof response.stateInstance !== 'string') {
      throw new Error('GreenAPI state response was invalid');
    }
    return response.stateInstance;
  }

  private async request<T>(
    operation: 'sendMessage' | 'getStateInstance',
    init: RequestInit,
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('GreenAPI is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    timeout.unref?.();
    const baseUrl = env.GREEN_API_API_URL.replace(/\/+$/, '');
    const idInstance = encodeURIComponent(env.GREEN_API_ID_INSTANCE!);
    const apiToken = encodeURIComponent(env.GREEN_API_TOKEN_INSTANCE!);
    const url = `${baseUrl}/waInstance${idInstance}/${operation}/${apiToken}`;

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...init.headers,
        },
      });
      if (!response.ok) {
        throw new Error(`GreenAPI ${operation} failed with status ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith(`GreenAPI ${operation}`)
      ) {
        throw error;
      }
      if (controller.signal.aborted) {
        throw new Error(`GreenAPI ${operation} timed out`);
      }
      // Do not propagate fetch errors because they can contain the credential-bearing URL.
      throw new Error(`GreenAPI ${operation} request failed`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const greenApiClient = new GreenApiClient();
