import { Telegram } from 'telegraf';
import { autoInjectable, container } from 'tsyringe';
import { RedisStore } from '../modules/redis';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { netId } from '../config';

export type Levels = keyof typeof AlertLevel;

export enum AlertLevel {
  'INFO' = 'ℹ️️',
  'WARN' = '⚠️',
  'CRITICAL' = '‼️',
  'ERROR' = '💩',
  'OK' = '✅',
}

export enum AlertType {
  'INSUFFICIENT_BALANCE',
  'INSUFFICIENT_TORN_BALANCE',
  'RPC',
}

class MockTelegram {
  async sendMessage(chatId, text: string, extra?: ExtraReplyMessage) {
    console.log(text, extra);
  }

  async getMe() {
    return {
      id: 1,
      first_name: 'test',
      is_bot: true,
    };
  }
}

@autoInjectable()
export class NotifierService {
  private telegram: Telegram | MockTelegram;
  private readonly token: string;
  private readonly chatId: string;

  constructor(private store: RedisStore) {
    this.token = process.env.TELEGRAM_NOTIFIER_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_NOTIFIER_CHAT_ID;
    this.telegram = this.token ? new Telegram(this.token) : new MockTelegram();
  }

  async processAlert(message: string) {
    const alert = JSON.parse(message);
    const [a, b, c] = alert.type.split('_');
    const isSent = await this.store.client.sismember('alerts:sent', `${a}_${b}_${c}`);
    if (!isSent) {
      if (alert.level === 'OK') {
        this.store.client.srem('alerts:sent', ...['WARN', 'CRITICAL'].map((c) => `${a}_${b}_${c}`));
      } else {
        await this.send(alert.message, alert.level);
        this.store.client.sadd('alerts:sent', alert.type);
      }
    }
  }

  async subscribe() {
    const channel = `${netId}/user-notify`;
    this.store.subscriber.subscribe(channel);
    this.store.subscriber.on('message', async (channel, message) => {
      await this.processAlert(<string>message);
    });
  }

  send(message: string, level: Levels) {
    const text = `${AlertLevel[level]} ${message}`;
    return this.telegram.sendMessage(this.chatId, text, { parse_mode: 'HTML' });
  }

  sendError(e: Error) {
    return this.telegram.sendMessage(this.chatId, `Error: ${e}`);
  }

  check() {
    return this.telegram.getMe();
  }
}

export default () => container.resolve(NotifierService);
