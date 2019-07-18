# Relayer for Tornado mixer
## Setup
1. `npm i`
2. `cp .env.example .env`
3. Modify `.env` as needed

## Run localy
1. `npm run start`
2. `curl -X POST -H 'content-type:application/json' --data '<PROOF>' http://127.0.0.1:8000/relay`
Relayer should return a transaction hash.

## Run in Docker 
1. `docker-compose up -d`

## Proof example
```json
{
   "pi_a":[
      "0x0ed9b1afc791a551f5baa2f84786963b1463ca3f7c68eb0de3b267e6cb491f05",
      "0x1335f2af3c71e442fd82f63f8f1c605ca2612b8d0fa22b4cbd1239cca839aa3d"
   ],
   "pi_b":[
      [
         "0x000189f7f1067a768d116cd86980eae6963dd9bc6c1f8204ceacf90a94f60d81",
         "0x1abb4b71da0efa67cbc76a97ac360826b17a88f07bd89151258bf076474a4804"
      ],
      [
         "0x0526b509ba2cda2b21b09401d70d23ea0225be4fdaa9097af842ff6783d1e0f4",
         "0x15b11f9f5441adeea61534105902170a409b228e159fe7428abf6e863fc05273"
      ]
   ],
   "pi_c":[
      "0x2cd9a2305827f7da64aa1a3136c11ae1d3d7b3cb69832d8c04ab39d8b9393cda",
      "0x2090cd3f9d09d66ca4e1e9bed2c72d5fa174b47599cb47e572324b1a98a3cb7a"
   ],
   "publicSignals":[
      "0x1e8a85160889dfb5c03a8e2a6cca18b4c476c0b486003e9ed666a33e04114658",
      "0x00bfb0befe19eac571ecaf7858e50d70273fbe2952cc8431f59399bb28665796",
      "0x00000000000000000000000003ebd0748aa4d1457cf479cce56309641e0a98f5",
      "0x0000000000000000000000000000000000000000000000000000000000000000"
   ]
}
```
