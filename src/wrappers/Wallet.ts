import { Address, Contract, ContractProvider, Dictionary } from '@ton/core'

export enum UnstakeMode {
    Auto,
    Instant,
    Best,
}

export class Wallet implements Contract {
    constructor(readonly address: Address) {}

    static createFromAddress(address: Address) {
        return new Wallet(address)
    }

    async getWalletState(provider: ContractProvider): Promise<[bigint, Dictionary<bigint, bigint>, bigint]> {
        const { stack } = await provider.get('get_wallet_state', [])
        return [
            stack.readBigNumber(),
            Dictionary.loadDirect(Dictionary.Keys.BigUint(32), Dictionary.Values.BigVarUint(4), stack.readCellOpt()),
            stack.readBigNumber(),
        ]
    }
}
