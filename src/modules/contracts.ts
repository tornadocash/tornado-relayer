import {
  ERC20Abi__factory,
  MulticallAbi__factory,
  OffchainOracleAbi__factory,
  ProxyLightABI__factory,
  TornadoProxyABI__factory,
} from '../../contracts';
import { providers } from 'ethers';
import { multiCallAddress, netId, offchainOracleAddress, mainnetRpcUrl, rpcUrl } from '../config';

export function getProvider(isStatic = true, customRpcUrl?: string, chainId = netId) {
  if (isStatic) return new providers.StaticJsonRpcProvider(customRpcUrl || rpcUrl, chainId);
  else return new providers.JsonRpcProvider(customRpcUrl || rpcUrl, chainId);

}

export const getTornadoProxyContract = (proxyAddress: string) => {
  return TornadoProxyABI__factory.connect(proxyAddress, getProvider());
};
export const getTornadoProxyLightContract = (proxyAddress: string) => {
  return ProxyLightABI__factory.connect(proxyAddress, getProvider());
};


export const getOffchainOracleContract = () => {
  return OffchainOracleAbi__factory.connect(offchainOracleAddress, getProvider(true, mainnetRpcUrl));
};

export const getMultiCallContract = () => {
  return MulticallAbi__factory.connect(multiCallAddress, getProvider(true, mainnetRpcUrl));
};

export const getTornTokenContract = (tokenAddress: string) => {
  return ERC20Abi__factory.connect(tokenAddress, getProvider(true, mainnetRpcUrl));
};
// export const getAggregatorContract = () => {
//   return AggregatorAbi__factory.connect(aggregatorAddress, getProvider());
// };
