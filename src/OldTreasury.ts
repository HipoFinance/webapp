import { Address, Contract, ContractProvider, TupleBuilder } from '@ton/ton'

export class OldTreasury implements Contract {
    constructor(readonly address: Address) {}

    static createFromAddress(address: Address) {
        return new OldTreasury(address)
    }

    async getWalletAddress(provider: ContractProvider, owner: Address): Promise<Address> {
        const tb = new TupleBuilder()
        tb.writeAddress(owner)
        const { stack } = await provider.get('get_wallet_address', tb.build())
        return stack.readAddress()
    }

    async getTotalCoinsAndTokens(provider: ContractProvider): Promise<[bigint, bigint]> {
        const { stack } = await provider.get('get_treasury_state', [])
        return [stack.readBigNumber(), stack.readBigNumber()]
    }
}
