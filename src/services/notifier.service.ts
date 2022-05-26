import { Telegram } from 'telegraf';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class NotifierService {
  private telegram: Telegram;
  private readonly token: string;
  private readonly chatId: string;

  constructor() {
    this.token = process.env.TELEGRAM_NOTIFIER_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_NOTIFIER_CHAT_ID || '';
    this.telegram = new Telegram(this.token);
  }

  send(message: string) {
    return this.telegram.sendMessage(
      this.chatId,
      message,
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
