import { Telegram } from 'telegraf';
import { autoInjectable, container } from 'tsyringe';
import { RedisStore } from '../modules/redis';

export type Levels = keyof typeof AlertLevel

export enum AlertLevel {
  'INFO' = 'ℹ️️',
  'WARN' = '⚠️',
  'CRITICAL' = '‼️',
  'ERROR' = '💩',
  'RECOVERED' = '✅'
}

export enum AlertType {
  'INSUFFICIENT_BALANCE',
  'INSUFFICIENT_TORN_BALANCE',
  'RPC'

}

@autoInjectable()
export class NotifierService {
  private telegram: Telegram;
  private readonly token: string;
  private readonly chatId: string;

  constructor(private store: RedisStore) {
    this.token = process.env.TELEGRAM_NOTIFIER_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_NOTIFIER_CHAT_ID || '';
    this.telegram = new Telegram(this.token);

  }

  async processAlert(message: string) {
    const alert = JSON.parse(message);
    const [a, b] = alert.type.split('_');
    if (alert.level === 'OK') {
      this.store.client.srem('alerts:sent', ...['WARN', 'CRITICAL'].map(l => `${a}_${b}_${l}`));
    } else {
      await this.send(alert.message, alert.level);
      this.store.client.sadd('alerts:sent', alert.type);
    }
  }

  async subscribe() {
    const sub = await this.store.subscriber;
    sub.subscribe('__keyspace@0__:alerts', 'rpush');
    sub.on('message', async (channel, event) => {
      if (event === 'rpush') {
        const messages = await this.store.client.brpop('alerts', 10);
        while (messages.length) {
          const [, message] = messages.splice(0, 2);
          await this.processAlert(message);
        }
      }
    });
  }

  send(message: string, level: Levels) {
    const text = `${AlertLevel[level]} ${message}`;
    console.log('sending message: ', text);
    return this.telegram.sendMessage(
      this.chatId,
      text,
      { parse_mode: 'HTML' },
    );
  }

  sendError(e: any) {
    return this.telegram.sendMessage(
      this.chatId,
      `Error: ${e}`,
    );
  }

  check() {
    return this.telegram.getMe();
  }
}

export default () => container.resolve(NotifierService);
