import {
  AggregatorAbi__factory,
  MiningAbi__factory,
  MulticallAbi__factory,
  OffchainOracleAbi__factory,
  TornadoProxyABI__factory,
} from '../../contracts';
import { providers } from 'ethers';
import {
  aggregatorAddress,
  httpRpcUrl,
  multiCallAddress,
  netId,
  offchainOracleAddress,
  tornadoMiningAddress,
  tornadoProxyAddress,
} from '../config';

export function getProvider() {
  return new providers.StaticJsonRpcProvider(httpRpcUrl, netId);
}

export const getTornadoProxyContract = () => {
  return TornadoProxyABI__factory.connect(tornadoProxyAddress, getProvider());
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
export const getTornadoMiningContract = () => {
  return MiningAbi__factory.connect(tornadoMiningAddress, getProvider());
};
