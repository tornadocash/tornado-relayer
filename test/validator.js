require('chai').should()

const { getTornadoWithdrawInputError } = require('../src/modules/validator')

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
  contract: '0xd47438C816c9E7f2E2888E060936a499Af9582b3',
}
