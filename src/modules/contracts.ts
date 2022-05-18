import {
  MulticallAbi__factory,
  OffchainOracleAbi__factory,
  ProxyLightABI__factory,
  TornadoProxyABI__factory,
} from '../../contracts';
import { providers } from 'ethers';
import { httpRpcUrl, multiCallAddress, netId, offchainOracleAddress, oracleRpcUrl } from '../config';

export function getProvider(isStatic = true, rpcUrl?: string) {
  if (isStatic) return new providers.StaticJsonRpcProvider(rpcUrl || httpRpcUrl, netId);
  else return new providers.JsonRpcProvider(rpcUrl || httpRpcUrl, netId);
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
  return MulticallAbi__factory.connect(multiCallAddress, getProvider(true, oracleRpcUrl));
};

// export const getAggregatorContract = () => {
//   return AggregatorAbi__factory.connect(aggregatorAddress, getProvider());
// };
