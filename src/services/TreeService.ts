import { getTornadoMiningContract, getTornadoProxyContract } from '../modules/contracts';
import { MiningAbi, TornadoProxyABI } from '../../contracts';
import { NewAccountEvent } from '../../contracts/MiningAbi';
import MerkleTree from 'fixed-merkle-tree';
import { minerMerkleTreeHeight, netId } from '../config';
import { poseidon } from 'circomlib';
import { BigNumber } from 'ethers';
import { readJSON } from '../modules';

const poseidonHash = (items) => BigNumber.from(poseidon(items)).toString();
const poseidonHash2 = (a, b) => poseidonHash([a, b]);

export class TreeService {
  proxy: TornadoProxyABI;
  miner: MiningAbi;
  tree: MerkleTree;

  constructor() {
    this.proxy = getTornadoProxyContract();
    this.miner = getTornadoMiningContract();
  }

  async initTree() {

    const cachedEvents = await readJSON(`../../cache/accounts_farmer_${netId}.json`);
    console.log('loaded cached events', cachedEvents.length);
    const cachedCommitments = cachedEvents.map(e => BigNumber.from(e.commitment).toString());

    const [{ blockNumber: fromBlock }] = cachedEvents.slice(-1);
    console.log('fetching new events');
    const newEvents = await this.fetchEvents(fromBlock);

    console.log('fetched', newEvents.length);
    const newCommitments = newEvents
      .sort((a, b) => a.args.index.sub(b.args.index).toNumber())
      .map(e => BigNumber.from(e.args.commitment).toString())
      .filter((item, index, arr) => !index || item !== arr[index - 1]);

    const commitments = cachedCommitments.concat(newCommitments);
    console.log(newEvents.slice(-1), commitments.slice(-1));
    console.log('create tree');
    this.tree = new MerkleTree(minerMerkleTreeHeight, commitments, { hashFunction: poseidonHash2 });
    const rootOnContract = await this.miner.callStatic.getLastAccountRoot();
    console.log(this.tree.root, BigNumber.from(rootOnContract).toString());
  }

  async fetchEvents(fromBlock: number, toBlock?: number): Promise<NewAccountEvent[]> {
    toBlock = toBlock ?? await this.proxy.provider.getBlockNumber();
    if (fromBlock <= toBlock) {
      try {
        const newAccountEvent = this.miner.filters.NewAccount();
        return await this.miner.queryFilter(newAccountEvent, fromBlock, toBlock);
      } catch (error) {
        const midBlock = (fromBlock + toBlock) >> 1;

        if (midBlock - fromBlock < 2) {
          throw new Error(`error fetching events: ${error.message}`);
        }

        const result = await Promise.all([this.fetchEvents(fromBlock, midBlock), this.fetchEvents(midBlock + 1, toBlock)]);
        return result.flat();
      }
    }
    return [];
  }
}
