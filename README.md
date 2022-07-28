# Relayer for Tornado Cash [![Build Status](https://github.com/tornadocash/relayer/workflows/build/badge.svg)](https://github.com/tornadocash/relayer/actions) [![Docker Image Version (latest semver)](https://img.shields.io/docker/v/tornadocash/relayer?logo=docker&logoColor=%23FFFFFF&sort=semver)](https://hub.docker.com/repository/docker/tornadocash/relayer)

## Deploy with docker-compose

docker-compose.yml contains a stack that will automatically provision SSL certificates for your domain name and will add
a https redirect to port 80.

1. Download [docker-compose.yml](/docker-compose.yml) and [.env.example](/.env.example)

```
wget https://raw.githubusercontent.com/tornadocash/tornado-relayer/master/docker-compose.yml
wget https://raw.githubusercontent.com/tornadocash/tornado-relayer/master/.env.example -O .env
```

2. Setup environment variables

- set `NET_ID` (1 for mainnet, [networks list](#compatible-networks))
- set `HTTP_RPC_URL` rpc url for your ethereum node
- set `ORACLE_RPC_URL` - rpc url for mainnet node for fetching prices(always have to be on mainnet)
- set `PRIVATE_KEY` for your relayer address (without 0x prefix)
- set `VIRTUAL_HOST` and `LETSENCRYPT_HOST` to your domain and add DNS record pointing to your relayer ip address
- set `REGULAR_TORNADO_WITHDRAW_FEE` - fee in % that is used for tornado pool withdrawals
- set `REWARD_ACCOUNT` - eth address that is used to collect fees
- update `AGGREGATOR` if needed - Contract address of aggregator instance.
- update `CONFIRMATIONS` if needed - how many block confirmations to wait before processing an event. Not recommended
  to set less than 3
- update `MAX_GAS_PRICE` if needed - maximum value of gwei value for relayer's transaction
- update `BASE_FEE_RESERVE_PERCENTAGE` if needed - how much in % will the network baseFee increase
- set `TELEGRAM_NOTIFIER_BOT_TOKEN` and `TELEGRAM_NOTIFIER_CHAT_ID` if your want get notify to telegram

If you want to use more than 1 eth address for relaying transactions, please add as many `workers` as you want. For
example, you can comment out `worker2` in docker-compose.yml file, but please use a different `PRIVATE_KEY` for each
worker.

3. Run `docker-compose up -d`

## V5 Migration Guide

This guide is intended to help with migration from Relayer v4 to v5.

1. Stop relayer

```
docker-compose down
```

2. Download the latest version of relayer`s docker compose file

```
wget https://raw.githubusercontent.com/tornadocash/tornado-relayer/master/docker-compose.yml
```

3. Check your environment variables, add new ones if needed

4. Run updated docker compose file

```
docker-compose up -d --pull
```

## Run locally

1. `yarn`
2. `cp .env.example .env`
3. Modify `.env` as needed
4. `docker-compose up -d redis`
5. `yarn start`
6. Go to `http://127.0.0.1:8000`
7. In order to execute withdraw request, you can run following command

```bash
curl -X POST -H 'content-type:application/json' --data '<input data>' http://127.0.0.1:8000/v1/tornadoWithdraw

```

Relayer should return a job id in uuid v4 format.

In that case you will need to add https termination yourself because browsers with default settings will prevent https
tornado.cash UI from submitting your request over http connection

## Run geth node

It is strongly recommended that you use your own RPC node. Instruction on how to run full node with `geth` can be
found [here](https://github.com/feshchenkod/rpc-nodes).

## Monitoring

### Basic

For basic monitoring setup telegram bot and fill variables in .env file

Alerts about:

- Main relayer currency balance
- Torn balance
- Withdraw transactions send errors

How to create bot: https://core.telegram.org/bots#3-how-do-i-create-a-bot

How to get chat
id: https://stackoverflow.com/questions/32423837/telegram-bot-how-to-get-a-group-chat-id/32572159#32572159

### Advanced

You can find the guide on how to install the Zabbix server in the [/monitoring/README.md](/monitoring/README.md).

## Compatible networks

- Ethereum Mainnet (1)
- Binance Smart Chain (56)
- Polygon (Matic) Network (137)
- Optimism (10)
- Arbitrum One (42161)
- Gnosis Chain (100)
- Avalanche Mainnet (43114)
- Ethereum Goerli (5)

Disclaimer:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
