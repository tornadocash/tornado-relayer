import {
  AggregatorAbi__factory,
  MulticallAbi__factory,
  OffchainOracleAbi__factory, ProxyLightABI__factory,
  TornadoProxyABI__factory,
} from '../../contracts';
import { providers } from 'ethers';
import { aggregatorAddress, httpRpcUrl, multiCallAddress, netId, offchainOracleAddress } from '../config';
import { configService } from '../services';

export function getProvider() {
  return new providers.StaticJsonRpcProvider(httpRpcUrl, netId);
}

export const getTornadoProxyContract = () => {
  return TornadoProxyABI__factory.connect(configService.proxyAddress, getProvider());
};
export const getTornadoProxyLightContract = () => {
  return ProxyLightABI__factory.connect(configService.proxyAddress, getProvider());
};
export const getAggregatorContract = () => {
  return AggregatorAbi__factory.connect(aggregatorAddress, getProvider());
};

export const getOffchainOracleContract = () => {
  return OffchainOracleAbi__factory.connect(offchainOracleAddress, getProvider());
};

export const getMultiCallContract = () => {
  return MulticallAbi__factory.connect(multiCallAddress, getProvider());
};
