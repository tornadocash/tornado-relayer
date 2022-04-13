# Relayer for Tornado Cash [![Build Status](https://github.com/tornadocash/relayer/workflows/build/badge.svg)](https://github.com/tornadocash/relayer/actions) [![Docker Image Version (latest semver)](https://img.shields.io/docker/v/tornadocash/relayer?logo=docker&logoColor=%23FFFFFF&sort=semver)](https://hub.docker.com/repository/docker/tornadocash/relayer)

## Deploy with docker-compose

docker-compose.yml contains a stack that will automatically provision SSL certificates for your domain name and will add a https redirect to port 80.

1. Download [docker-compose.yml](/docker-compose.yml) and [.env.example](/.env.example)

```
wget https://raw.githubusercontent.com/tornadocash/tornado-relayer/master/docker-compose.yml
wget https://raw.githubusercontent.com/tornadocash/tornado-relayer/master/.env.example -O .env
```

2. Setup environment variables

   - set `NET_ID` (1 for mainnet, 5 for Goerli)
   - set `HTTP_RPC_URL` rpc url for your ethereum node
   - set `WS_RPC_URL` websocket url
   - set `ORACLE_RPC_URL` - rpc url for mainnet node for fetching prices(always have to be on mainnet)
   - set `PRIVATE_KEY` for your relayer address (without 0x prefix)
   - set `VIRTUAL_HOST` and `LETSENCRYPT_HOST` to your domain and add DNS record pointing to your relayer ip address
   - set `REGULAR_TORNADO_WITHDRAW_FEE` - fee in % that is used for tornado pool withdrawals
   - set `MINING_SERVICE_FEE` - fee in % that is used for mining AP withdrawals
   - set `REWARD_ACCOUNT` - eth address that is used to collect fees
   - update `AGGREGATOR` if needed - Contract address of aggregator instance.
   - update `CONFIRMATIONS` if needed - how many block confirmations to wait before processing an event. Not recommended to set less than 3
   - update `MAX_GAS_PRICE` if needed - maximum value of gwei value for relayer's transaction
   - update `BASE_FEE_RESERVE_PERCENTAGE` if needed - how much in % will the network baseFee increase

     If you want to use more than 1 eth address for relaying transactions, please add as many `workers` as you want. For example, you can comment out `worker2` in docker-compose.yml file, but please use a different `PRIVATE_KEY` for each worker.

3. Run `docker-compose up -d`

## Run locally

1. `yarn`
2. `cp .env.example .env`
3. Modify `.env` as needed
4. `yarn start`
5. Go to `http://127.0.0.1:8000`
6. In order to execute withdraw request, you can run following command

```bash
curl -X POST -H 'content-type:application/json' --data '<input data>' http://127.0.0.1:8000/relay
```

Relayer should return a transaction hash

In that case you will need to add https termination yourself because browsers with default settings will prevent https
tornado.cash UI from submitting your request over http connection

## Run geth node

It is strongly recommended that you use your own RPC node. Instruction on how to run full node with `geth` can be found [here](https://github.com/feshchenkod/rpc-nodes).

## Monitoring

You can find the guide on how to install the Zabbix server in the [/monitoring/README.md](/monitoring/README.md).

## Architecture

1. TreeWatcher module keeps track of Account Tree changes and automatically caches the actual state in Redis and emits `treeUpdate` event to redis pub/sub channel
2. Server module is Express.js instance that accepts http requests
3. Controller contains handlers for the Server endpoints. It validates input data and adds a Job to Queue.
4. Queue module is used by Controller to put and get Job from queue (bull wrapper)
5. Status module contains handler to get a Job status. It's used by UI for pull updates
6. Validate contains validation logic for all endpoints
7. Worker is the main module that gets a Job from queue and processes it

Disclaimer:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
