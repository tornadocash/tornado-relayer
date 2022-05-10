import { Provider } from '@ethersproject/providers';

export default class EnsResolver {
  addresses: Map<string, string>;
  provider: Provider;

  constructor(provider: Provider) {
    this.addresses = new Map<string, string>();
    this.provider = provider;
  }

  async resolve(domain: string) {
    try {
      if (!this.addresses.has(domain)) {
        const resolved = await this.provider.resolveName(domain);
        this.addresses.set(domain, resolved);
      }
      return this.addresses.get(domain);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

