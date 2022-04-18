require('chai').should()

const {
  getTornadoWithdrawInputError,
  getMiningRewardInputError,
  getMiningWithdrawInputError,
} = require('../src/modules/validator')

describe('Validator', () => {
  describe('#getTornadoWithdrawInputError', () => {
    it('should work', () => {
      getTornadoWithdrawInputError(withdrawData)
    })

    it('should throw for incorrect proof', () => {
      const malformedData = { ...withdrawData }
      malformedData.proof = '0xbeef'
      getTornadoWithdrawInputError(malformedData).should.be.equal(
        '.proof should match pattern "^0x[a-fA-F0-9]{512}$"',
      )
    })
    it('should throw if unknown contract', () => {
      const malformedData = { ...withdrawData }
      malformedData.contract = '0xf17f52151ebef6c7334fad080c5704d77216b732'
      getTornadoWithdrawInputError(malformedData).should.be.equal(
        '.contract should pass "isKnownContract" keyword validation',
      )
    })
    it('should throw something is missing', () => {
      const malformedData = { ...withdrawData }
      delete malformedData.proof
      getTornadoWithdrawInputError(malformedData).should.be.equal(" should have required property 'proof'")
      malformedData.proof = withdrawData.proof

      delete malformedData.args
      getTornadoWithdrawInputError(malformedData).should.be.equal(" should have required property 'args'")
      malformedData.args = withdrawData.args

      delete malformedData.contract
      getTornadoWithdrawInputError(malformedData).should.be.equal(" should have required property 'contract'")
      malformedData.contract = withdrawData.contract
    })
  })

  describe('#getMiningRewardInputError', () => {
    it('should work', () => {
      getMiningRewardInputError(rewardData)
    })

    it('should throw for incorrect proof', () => {
      const malformedData = { ...rewardData }
      malformedData.proof = '0xbeef'
      getMiningRewardInputError(malformedData).should.be.equal(
        '.proof should match pattern "^0x[a-fA-F0-9]{512}$"',
      )
    })

    it('should throw something is missing', () => {
      const malformedData = { ...rewardData }
      delete malformedData.proof
      getMiningRewardInputError(malformedData).should.be.equal(" should have required property 'proof'")
      malformedData.proof = rewardData.proof

      delete malformedData.args
      getMiningRewardInputError(malformedData).should.be.equal(" should have required property 'args'")
      malformedData.args = rewardData.args
    })
  })

  describe('#getMiningWithdrawInputError', () => {
    it('should work', () => {
      getMiningWithdrawInputError(miningWithdrawData)
    })

    it('should throw for incorrect proof', () => {
      const malformedData = { ...miningWithdrawData }
      malformedData.proof = '0xbeef'
      getMiningWithdrawInputError(malformedData).should.be.equal(
        '.proof should match pattern "^0x[a-fA-F0-9]{512}$"',
      )
    })

    it('should throw something is missing', () => {
      const malformedData = { ...miningWithdrawData }
      delete malformedData.proof
      getMiningWithdrawInputError(malformedData).should.be.equal(" should have required property 'proof'")
      malformedData.proof = miningWithdrawData.proof

      delete malformedData.args
      getMiningWithdrawInputError(malformedData).should.be.equal(" should have required property 'args'")
      malformedData.args = miningWithdrawData.args
    })
  })
})

const withdrawData = {
  proof:
    '0x0f8cb4c2ca9cbb23a5f21475773e19e39d3470436d7296f25c8730d19d88fcef2986ec694ad094f4c5fff79a4e5043bd553df20b23108bc023ec3670718143c20cc49c6d9798e1ae831fd32a878b96ff8897728f9b7963f0d5a4b5574426ac6203b2456d360b8e825d8f5731970bf1fc1b95b9713e3b24203667ecdd5939c2e40dec48f9e51d9cc8dc2f7f3916f0e9e31519c7df2bea8c51a195eb0f57beea4924cb846deaa78cdcbe361a6c310638af6f6157317bc27d74746bfaa2e1f8d2e9088fd10fa62100740874cdffdd6feb15c95c5a303f6bc226d5e51619c5b825471a17ddfeb05b250c0802261f7d05cf29a39a72c13e200e5bc721b0e4c50d55e6',
  args: [
    '0x1579d41e5290ab5bcec9a7df16705e49b5c0b869095299196c19c5e14462c9e3',
    '0x0cf7f49c5b35c48b9e1d43713e0b46a75977e3d10521e9ac1e4c3cd5e3da1c5d',
    '0xbd4369dc854c5d5b79fe25492e3a3cfcb5d02da5',
    '0x0000000000000000000000000000000000000000',
    '0x000000000000000000000000000000000000000000000000058d15e176280000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ],
  contract: '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936',
}

const rewardData = {
  proof:
    '0x2e0f4c76b35ce3275bf57492cbe12ddc76fae4eabdbeaacdcc7cd5255d0abb2325bd80b2a867f9c1bab854de5d7c443a18eb9ad796943dd53c30c04e8f0a37ae164916c932776b3c28dd49808a5d5e1648d8bc9006b2386096b88757644ce8f102f7e2f1505bb66385a1d53a101922a17d8ab653694dedd7d150ec71d543202e0f0a67e5d59904d75af1c52bef4dfac0a302c2beb2ca3bb29b6bbbe1038368702e5ba8d6d829d74968a94e321cc91cccbc0654f5df6460a0a6ad73b06c42b7d1289ff36655fc7106b5538bd2c6617dd0c313919331e63bcb4de9c9b45dc2207b098a5729efbecf79a4cab39ade3c99e5772bfbe5ae75d932facbf9e0910a34ae',
  args: {
    rate: '0x000000000000000000000000000000000000000000000000000000000000000a',
    fee: '0x0000000000000000000000000000000000000000000000000000000000000000',
    instance: '0x8b3f5393bA08c24cc7ff5A66a832562aAB7bC95f',
    rewardNullifier: '0x08fdc416b85c76d246925994ae0c0df539789fd1669c45b57104907c7ef8b0b5',
    extDataHash: '0x006c5f12c20933beab10cfffab31ea0c9d736cf9aa868ee29eed3047d4ea4c2e',
    depositRoot: '0x0405962838a47fb25ffd75d80d53b268654a06bc1bdde7e5ad94c675c2f2f0ff',
    withdrawalRoot: '0x1cd83f5df5dbc826fecbf6be87f05db9c9dc617a3f1b1f3a421b1335c1ff7dbf',
    extData: {
      relayer: '0x0000000000000000000000000000000000000000',
      encryptedAccount:
        '0x6a8494fca4c433ef323d03f0db3fede90c3d2c6f216d73345ffc77ceec79622f327a83c4254063a3027620c262835e335fa32c33600a70547a53b2aa311d3ff35cf943e8f9e8f321f60d4266f680e0606a5837d78deb4d74c8b4fa3e9b67414513c71b73e38995cd8d57fd08aa9e135b342cecaf4128d4cfbb26148022e7a87da8b2423440b62034be202a6a48b45baa9736def6455771b442baaf2358fc52aa6c1d14a9a452b064d280fafd69f2a3ba416c10c1d8276f1c3810c664b24e0f1eefc75d63',
    },
    account: {
      inputRoot: '0x22e875e5e54d8569fb40d0c568984e87b4c97da6383d8d8a334a79e22b48fd54',
      inputNullifierHash: '0x24be972a00e3938a58f44ea6f8ead271ecdd6ab2cab42d1910fb7190b5816188',
      outputRoot: '0x04a3cd1e37487dcee5da51cbce4245742903262a5824aef77fb7aff84a3cb053',
      outputPathIndices: '0x0000000000000000000000000000000000000000000000000000000000000000',
      outputCommitment: '0x0ae58c1605312bd42fffdfc41d5e0f9a364ad458717c522bf9338068ab258601',
    },
  },
}

const miningWithdrawData = {
  proof:
    '0x087c02cdc5946b44f295e1adb8b65341708fe43854e44f05f205da6e46e2e4c4248b2dd5ee30236e7be2ea657265765b4e43dae263d67ff43190bb806faaafc10dd0a771f9d589b5061ddf0a713f27fc0b496d1b136dc4e98838b88f60efb072087c3018fa5c25b1f78b4bb968291b9afa3966d976e961d0a86719a8e07d771209dad29620f3bc2fc21c00510749a19e7ff369ade6b9fd1a7f05b74e70faee771fd839c710bd983927c9d3d5f39bb5e839a2ece19e899c4d50a91b29d5ac3f1a0e8faf7eeb2f6f672561bfba39bcb1d851f6c97d5c14b7fce6661cf315af3468119855a426fc4df511e848011bcdb704369deba20541a7651ab4d5813a60c056',
  args: {
    amount: '0x000000000000000000000000000000000000000000000000000000000000000f',
    fee: '0x0000000000000000000000000000000000000000000000000000000000000000',
    extDataHash: '0x00d95a201b89061613b5bc539bcf8fdee63a400ea80f1f5e813d6aacfee3ec67',
    extData: {
      recipient: '0xf17f52151ebef6c7334fad080c5704d77216b732',
      relayer: '0x0000000000000000000000000000000000000000',
      encryptedAccount:
        '0x4bd7f84edab796b390181d8b1dd850c418c8b3fe41d63b9677b7b99a2fadc505dcc70df336a42847dc00fa39175d16ddfec0d80dc166282e024b5371f561467651ed94e71524fa2e365a8330b053d5cff7c3bcc3564b335fb9e74fb805a3a6e760b811db60e5d6b4e154376196c3cb61457bac6d5ea804f63208a389555cde72f40ab1b94705e728f692e699fc441504b9df34390b3992a1a1eac160dcf0df0b5c5a9ec9cd6c0c8f5f8aa11627fdf2b3bedece5836e9ca38b09d70ff7ba06702971d245d',
    },
    account: {
      inputRoot: '0x1a756aeee7f7d05f276b20c8ca83150e110e1a436c2d959e501ab306420ab536',
      inputNullifierHash: '0x0dc8ea0330171a1f868ef5f3f9f92e919d7be754846f6145c5e7819e87738e65',
      outputRoot: '0x0d9d85371bd8c941400ae54815491799e98d1f335a9d263e41f0b81f22b55aa8',
      outputPathIndices: '0x0000000000000000000000000000000000000000000000000000000000000001',
      outputCommitment: '0x1ebd38a8bc53f47386687386397c8b5cefd33d55341b62a2a576b39d9bcec57c',
    },
  },
}
