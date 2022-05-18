import { getProvider } from './contracts';

const addresses = new Map<string, string>();
const provider = getProvider();

async function resolve(domain: string) {
  try {
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
