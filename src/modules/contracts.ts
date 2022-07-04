import {
  ERC20Abi__factory,
  MulticallAbi__factory,
  OffchainOracleAbi__factory,
  ProxyLightABI__factory,
  TornadoProxyABI__factory,
} from '../contracts';
import { providers } from 'ethers';
import { mainnetRpcUrl, multiCallAddress, netId, offchainOracleAddress, oracleRpcUrl, rpcUrl } from '../config';

export function getProvider(isStatic = true, customRpcUrl?: string, chainId = netId) {
  const url = customRpcUrl || rpcUrl;
  if (isStatic) return new providers.StaticJsonRpcProvider(url, chainId);
  else return new providers.JsonRpcProvider(url, chainId);
}

export const getTornadoProxyContract = (proxyAddress: string) => {
  return TornadoProxyABI__factory.connect(proxyAddress, getProvider());
};
export const getTornadoProxyLightContract = (proxyAddress: string) => {
  return ProxyLightABI__factory.connect(proxyAddress, getProvider());
};

export const getOffchainOracleContract = () => {
  return OffchainOracleAbi__factory.connect(offchainOracleAddress, getProvider(true, oracleRpcUrl));
};

export const getMultiCallContract = () => {
  return MulticallAbi__factory.connect(multiCallAddress, getProvider(true, mainnetRpcUrl));
};

export const getTornTokenContract = (tokenAddress: string) => {
  return ERC20Abi__factory.connect(tokenAddress, getProvider(true, mainnetRpcUrl));
};
