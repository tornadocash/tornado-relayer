# Relayer for Tornado Cash [![Build Status](https://github.com/tornadocash/relayer/workflows/build/badge.svg)](https://github.com/tornadocash/relayer/actions) [![Docker Image Version (latest semver)](https://img.shields.io/docker/v/tornadocash/relayer?logo=docker&logoColor=%23FFFFFF&sort=semver)](https://hub.docker.com/repository/docker/tornadocash/relayer)

## Run locally

1. `npm i`
2. `cp .env.example .env`
3. Modify `.env` as needed
4. `npm run start`
5. Go to `http://127.0.0.1:8000`
6. In order to execute withdraw request, you can run following command

```bash
curl -X POST -H 'content-type:application/json' --data '<input data>' http://127.0.0.1:8000/relay
```

Relayer should return a transaction hash.

_Note._ If you want to change contracts' addresses go to [config.js](./config.js) file.

## Deploy with docker-compose

docker-compose.yml contains a stack that will automatically provision SSL certificates for your domain name and will add a https redirect to port 80.

1. Download docker-compose.yml
2. Change environment variables for `kovan` containers as appropriate
   - add `PRIVATE_KEY` for your relayer address (without 0x prefix)
   - set `VIRTUAL_HOST` and `LETSENCRYPT_HOST` to your domain and add DNS record pointing to your relayer ip address
   - customize `RELAYER_FEE`
   - update `RPC_URL` if needed
   - update `REDIS_URL` if needed
3. Run `docker-compose up -d`

## Run as a Docker container

1. `cp .env.example .env`
2. Modify `.env` as needed
3. `docker run -d --env-file .env -p 80:8000 tornadocash/relayer`

In that case you will need to add https termination yourself because browsers with default settings will prevent https
tornado.cash UI from submitting your request over http connection

## Input data example

```json
{
  "proof": "0x0f8cb4c2ca9cbb23a5f21475773e19e39d3470436d7296f25c8730d19d88fcef2986ec694ad094f4c5fff79a4e5043bd553df20b23108bc023ec3670718143c20cc49c6d9798e1ae831fd32a878b96ff8897728f9b7963f0d5a4b5574426ac6203b2456d360b8e825d8f5731970bf1fc1b95b9713e3b24203667ecdd5939c2e40dec48f9e51d9cc8dc2f7f3916f0e9e31519c7df2bea8c51a195eb0f57beea4924cb846deaa78cdcbe361a6c310638af6f6157317bc27d74746bfaa2e1f8d2e9088fd10fa62100740874cdffdd6feb15c95c5a303f6bc226d5e51619c5b825471a17ddfeb05b250c0802261f7d05cf29a39a72c13e200e5bc721b0e4c50d55e6",
  "args": [
    "0x1579d41e5290ab5bcec9a7df16705e49b5c0b869095299196c19c5e14462c9e3",
    "0x0cf7f49c5b35c48b9e1d43713e0b46a75977e3d10521e9ac1e4c3cd5e3da1c5d",
    "0x03ebd0748aa4d1457cf479cce56309641e0a98f5",
    "0xbd4369dc854c5d5b79fe25492e3a3cfcb5d02da5",
    "0x000000000000000000000000000000000000000000000000058d15e176280000",
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ],
  "contract": "0xA27E34Ad97F171846bAf21399c370c9CE6129e0D"
}
```

Disclaimer:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
