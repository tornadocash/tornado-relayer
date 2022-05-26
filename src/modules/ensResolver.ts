import { getProvider } from './contracts';
import { mainnetRpcUrl } from '../config';
import { ChainIds } from '../types';

const addresses = new Map<string, string>();

async function resolve(domain: string) {
  try {
    const provider = getProvider(true, mainnetRpcUrl, ChainIds.ethereum);
    if (!addresses.has(domain)) {
      const resolved = await provider.resolveName(domain);
      addresses.set(domain, resolved);
    }
    return addresses.get(domain);
  } catch (e) {
    console.log(e);
    return null;
  }
}

export { resolve };
