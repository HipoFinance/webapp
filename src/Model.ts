import { Network, getHttpV4Endpoint } from '@orbs-network/ton-access'
import { TonConnectUI, THEME, CHAIN, SendTransactionRequest } from '@tonconnect/ui'
import { action, autorun, computed, makeObservable, observable, runInAction } from 'mobx'
import { Address, Dictionary, OpenedContract, TonClient4, beginCell, fromNano, toNano } from '@ton/ton'
import { ParticipationState, Times, Treasury, TreasuryConfig } from './wrappers/Treasury'
import { Wallet } from './wrappers/Wallet'
import { Parent } from './wrappers/Parent'

type ActiveTab = 'stake' | 'unstake'

type WaitForTransaction = 'no' | 'wait' | 'timeout' | 'done'

interface FragmentState {
    network?: Network
    referrer?: Address
    activeTab?: ActiveTab
}

const updateTimesDelay = 60 * 1000
const updateLastBlockDelay = 6 * 1000
const retryDelay = 3 * 1000
const checkBalanceChangeDelay = 1 * 1000
const txValidUntil = 5 * 60

const averageStakeFee = 140000000n
const averageUnstakeFee = 150000000n
const stakeFee = 200000000n
const unstakeFee = 300000000n

const op = {
    depositCoins: 0x3d3761a6,
    unstakeTokens: 0x595f07bc,
}

const treasuryAddresses: Record<Network, Address> = {
    mainnet: Address.parse('EQCLyZHP4Xe8fpchQz76O-_RmUhaVc_9BAoGyJrwJrcbz2eZ'),
    testnet: Address.parse('kQAlDMBKCT8WJ4nwdwNRp0lvKMP4vUnHYspFPhEnyR36cg44'),
}

const oldTreasuryAddresses: Record<Network, Address> = {
    mainnet: Address.parse('EQBNo5qAG8I8J6IxGaz15SfQVB-kX98YhKV_mT36Xo5vYxUa'),
    testnet: Address.parse('kQAjvBlA6Gt0BZhvM9_PgBDVv1_EkRuMYZ3XxdaXlKRyCeaI'),
}

const defaultNetwork: Network = 'mainnet'
const defaultActiveTab: ActiveTab = 'stake'

const tonConnectButtonRootId = 'ton-connect-button'

const errorMessageTonAccess = 'Unable to access blockchain'
const errorMessageNetworkMismatch = 'Your wallet must be on '

export class Model {
    // observed state
    network: Network = defaultNetwork
    tonClient?: TonClient4
    address?: Address
    tonBalance?: bigint
    treasury?: OpenedContract<Treasury>
    treasuryState?: TreasuryConfig
    times?: Times
    walletAddress?: Address
    wallet?: OpenedContract<Wallet>
    walletState?: [bigint, Dictionary<bigint, bigint>, bigint]
    oldWalletAddress?: Address
    oldWalletTokens?: bigint
    newWalletTokens?: bigint
    activeTab: ActiveTab = defaultActiveTab
    amount = ''
    waitForTransaction: WaitForTransaction = 'no'
    ongoingRequests = 0
    errorMessage = ''

    // unobserved state
    dark = false
    tonConnectUI?: TonConnectUI
    lastBlock = 0
    switchNetworkCounter = 0
    referrer?: Address
    timeoutConnectTonAccess?: ReturnType<typeof setTimeout>
    timeoutReadTimes?: ReturnType<typeof setTimeout>
    timeoutReadLastBlock?: ReturnType<typeof setTimeout>
    timeoutSwitchNetwork?: ReturnType<typeof setTimeout>
    timeoutErrorMessage?: ReturnType<typeof setTimeout>

    constructor() {
        makeObservable(this, {
            network: observable,
            tonClient: observable,
            address: observable,
            tonBalance: observable,
            treasury: observable,
            treasuryState: observable,
            times: observable,
            walletAddress: observable,
            wallet: observable,
            walletState: observable,
            oldWalletAddress: observable,
            oldWalletTokens: observable,
            newWalletTokens: observable,
            activeTab: observable,
            amount: observable,
            waitForTransaction: observable,
            ongoingRequests: observable,
            errorMessage: observable,

            isWalletConnected: computed,
            isMainnet: computed,
            isStakeTabActive: computed,
            tonBalanceFormatted: computed,
            htonBalanceFormatted: computed,
            oldWalletTokensFormatted: computed,
            newWalletTokensFormatted: computed,
            unstakingInProgressFormatted: computed,
            unstakingInProgressDetails: computed,
            stakingInProgressFormatted: computed,
            stakingInProgressDetails: computed,
            maxAmount: computed,
            amountInNano: computed,
            isAmountValid: computed,
            isAmountPositive: computed,
            isButtonEnabled: computed,
            buttonLabel: computed,
            youWillReceive: computed,
            exchangeRate: computed,
            exchangeRateFormatted: computed,
            averageStakeFeeFormatted: computed,
            averageUnstakeFeeFormatted: computed,
            stakeEta: computed,
            unstakeEta: computed,
            explorerHref: computed,
            apy: computed,
            apyFormatted: computed,
            protocolFee: computed,
            currentlyStaked: computed,

            setNetwork: action,
            setTonClient: action,
            setAddress: action,
            setTimes: action,
            setActiveTab: action,
            setAmount: action,
            setAmountToMax: action,
            setWaitForTransaction: action,
            beginRequest: action,
            endRequest: action,
            setErrorMessage: action,
        })
    }

    init() {
        this.dark =
            localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)

        document.onvisibilitychange = () => {
            if (document.hidden) {
                this.pause()
            } else {
                this.resume()
            }
        }

        window.onhashchange = () => {
            const fragmentState = this.readFragmentState()
            runInAction(() => {
                this.setActiveTab(fragmentState.activeTab ?? defaultActiveTab)
                this.setNetwork(fragmentState.network ?? defaultNetwork)
                this.setReferrer(fragmentState.referrer)
            })
            this.writeFragmentState()
        }
        window.dispatchEvent(new HashChangeEvent('hashchange'))

        this.initTonConnect()

        autorun(() => {
            this.connectTonAccess()
        })

        autorun(() => {
            this.readTimes()
        })

        autorun(() => {
            void this.readLastBlock()
        })

        autorun(() => {
            this.writeFragmentState()
        })
    }

    get isWalletConnected() {
        return this.address != null
    }

    get isMainnet() {
        return this.network === 'mainnet'
    }

    get isStakeTabActive() {
        return this.activeTab === 'stake'
    }

    get tonBalanceFormatted() {
        if (this.tonBalance != null) {
            return formatNano(this.tonBalance) + ' TON'
        }
    }

    get htonBalanceFormatted() {
        if (this.tonBalance != null) {
            return formatNano(this.walletState?.[0] ?? 0n) + ' hTON'
        }
    }

    get oldWalletTokensFormatted() {
        if (this.oldWalletTokens != null) {
            return formatNano(this.oldWalletTokens) + ' hTON'
        }
    }

    get newWalletTokensFormatted() {
        if (this.newWalletTokens != null) {
            return formatNano(this.newWalletTokens) + ' hTON'
        }
    }

    get unstakingInProgressFormatted() {
        return formatNano(this.walletState?.[2] ?? 0n) + ' hTON'
    }

    get unstakingInProgressDetails() {
        const value = this.walletState?.[2]
        if (value == null || value === 0n || this.treasuryState == null) {
            return
        }
        let time = undefined
        const firstParticipationKey = this.treasuryState.participations.keys()[0] ?? 0n
        const firstParticipationValue = this.treasuryState.participations.get(firstParticipationKey)
        if ((firstParticipationValue?.state ?? ParticipationState.Open) >= ParticipationState.Staked) {
            time = firstParticipationValue?.stakeHeldUntil
        }
        return {
            amount: formatNano(value) + ' hTON',
            estimated: time == null ? undefined : formatDate(new Date((Number(time) + 5 * 60) * 1000)),
        }
    }

    get stakingInProgressFormatted() {
        let result = 0n
        const empty = Dictionary.empty(Dictionary.Keys.BigUint(32), Dictionary.Values.BigVarUint(4))
        const staking = this.walletState?.[1] ?? empty
        const times = staking.keys()
        for (const time of times) {
            const value = staking.get(time)
            if (value != null) {
                result += value
            }
        }
        return formatNano(result) + ' TON'
    }

    get stakingInProgressDetails() {
        const result = []
        const empty = Dictionary.empty(Dictionary.Keys.BigUint(32), Dictionary.Values.BigVarUint(4))
        const staking = this.walletState?.[1] ?? empty
        const times = staking.keys()
        for (const time of times) {
            const value = staking.get(time)
            if (value != null) {
                const until = this.treasuryState?.participations.get(time)?.stakeHeldUntil ?? 0n
                result.push({
                    amount: formatNano(value) + ' TON',
                    estimated: until === 0n ? undefined : formatDate(new Date((Number(until) + 5 * 60) * 1000)),
                })
            }
        }
        return result
    }

    get maxAmount() {
        const isStakeTabActive = this.isStakeTabActive
        const tonBalance = this.tonBalance
        const walletState = this.walletState
        if (isStakeTabActive) {
            // reserve 0.5 TON for user's ton wallet storage fee + enough funds for future unstake
            const m = (tonBalance ?? 0n) - 500000000n
            return m > 0n ? m : 0n
        } else {
            const m = walletState?.[0] ?? 0n
            return m > 0n ? m : 0n
        }
    }

    get amountInNano() {
        const amount = this.amount.trim()
        try {
            return toNano(amount)
        } catch {
            return undefined
        }
    }

    get isAmountValid() {
        const nano = this.amountInNano
        return nano != null && nano >= 0n && (this.tonBalance == null || nano <= this.maxAmount)
    }

    get isAmountPositive() {
        const nano = this.amountInNano
        return nano != null && nano > 0n
    }

    get isButtonEnabled() {
        const isAmountValid = this.isAmountValid
        const isAmountPositive = this.isAmountPositive
        const tonBalance = this.tonBalance
        const htonBalance = this.walletState?.[0]
        const haveBalance = this.isStakeTabActive ? tonBalance != null : htonBalance != null
        if (this.isWalletConnected) {
            return isAmountValid && isAmountPositive && haveBalance
        } else {
            return true
        }
    }

    get buttonLabel() {
        if (this.isWalletConnected) {
            return this.isStakeTabActive ? 'Stake' : 'Unstake'
        } else {
            return 'Connect Wallet'
        }
    }

    get youWillReceive() {
        const rate = this.exchangeRate
        const nano = this.amountInNano
        const isStakeTabActive = this.isStakeTabActive
        if (rate == null) {
            return
        } else if (nano == null || !this.isAmountValid || !this.isAmountPositive) {
            return isStakeTabActive ? 'hTON' : 'TON'
        } else {
            return `~ ${formatNano(Number(nano) * rate)} ${isStakeTabActive ? 'hTON' : 'TON'}`
        }
    }

    get exchangeRate() {
        const state = this.treasuryState
        if (state != null) {
            if (this.isStakeTabActive) {
                return Number(state.totalTokens) / Number(state.totalCoins) || 1
            } else {
                return Number(state.totalCoins) / Number(state.totalTokens) || 1
            }
        }
    }

    get exchangeRateFormatted() {
        const state = this.treasuryState
        if (state != null) {
            const rate = Number(state.totalCoins) / Number(state.totalTokens) || 1
            return '1 hTON = ~ ' + rate.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' TON'
        }
    }

    get averageStakeFeeFormatted() {
        if (this.treasuryState != null) {
            return formatNano(averageStakeFee) + ' TON'
        }
    }

    get averageUnstakeFeeFormatted() {
        if (this.treasuryState != null) {
            return formatNano(averageUnstakeFee) + ' TON'
        }
    }

    get stakeEta() {
        const times = this.times
        const participations = this.treasuryState?.participations
        const instantMint = this.treasuryState?.instantMint
        if (instantMint) {
            return 'Instant'
        } else if (times != null && participations != null) {
            for (const key of participations.keys().reverse()) {
                const participation = participations.get(key)
                if (participation?.state != null && participation.state > ParticipationState.Open) {
                    return formatEta(participation.stakeHeldUntil ?? 0n)
                }
            }
            return formatEta(0n)
        }
    }

    get unstakeEta() {
        const times = this.times
        const participations = this.treasuryState?.participations
        if (times != null && participations != null) {
            const currentParticipation = participations.get(times.currentRoundSince)
            let eta = currentParticipation?.stakeHeldUntil
            if (eta != null) {
                return formatEta(eta)
            }
            const now = Math.floor(Date.now() / 1000)
            const nextParticipation = participations.get(times.nextRoundSince)
            if (nextParticipation == null || now < Number(times.participateSince) - 5 * 60) {
                return formatEta(0n)
            }
            eta = times.nextRoundUntil + times.stakeHeldFor + 5n * 60n
            return formatEta(eta)
        }
    }

    get explorerHref() {
        const address = treasuryAddresses[this.network].toString({ testOnly: !this.isMainnet })
        return (this.isMainnet ? 'https://tonviewer.com/' : 'https://testnet.tonviewer.com/') + address
    }

    get apy() {
        const times = this.times
        const lastStaked = this.treasuryState?.lastStaked
        const lastRecovered = this.treasuryState?.lastRecovered
        if (times != null && lastStaked != null && lastRecovered != null) {
            const duration = 2 * Number(times.nextRoundSince - times.currentRoundSince)
            const year = 365 * 24 * 60 * 60
            const compoundingFrequency = year / duration
            return Math.pow(Number(lastRecovered) / Number(lastStaked) || 1, compoundingFrequency) - 1
        }
    }

    get apyFormatted() {
        if (this.apy != null) {
            return formatPercent(this.apy)
        }
    }

    get protocolFee() {
        const governanceFee = this.treasuryState?.governanceFee
        if (governanceFee != null) {
            return formatPercent(Number(governanceFee) / 65535)
        }
    }

    get currentlyStaked() {
        if (this.treasuryState != null) {
            return (
                (Number(this.treasuryState.totalCoins) / 1000000000).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                }) + ' TON'
            )
        }
    }

    setNetwork = (network: Network) => {
        if (this.network !== network) {
            this.network = network
            this.tonClient = undefined
            this.setAddress(undefined)
            this.tonBalance = undefined
            this.treasury = undefined
            this.treasuryState = undefined
            this.times = undefined
            this.walletAddress = undefined
            this.wallet = undefined
            this.walletState = undefined
            this.amount = ''
            this.errorMessage = ''
            clearTimeout(this.timeoutConnectTonAccess)
            clearTimeout(this.timeoutReadTimes)
            clearTimeout(this.timeoutReadLastBlock)
            clearTimeout(this.timeoutErrorMessage)
            if (this.tonConnectUI?.connected === true) {
                void this.tonConnectUI.disconnect()
            }
        }
    }

    setReferrer = (referrer?: Address) => {
        if (referrer != null) {
            this.referrer = referrer
            localStorage.setItem('referrer', referrer.toString({ testOnly: !this.isMainnet, bounceable: false }))
        } else {
            try {
                this.referrer = Address.parseFriendly(localStorage.getItem('referrer') ?? '').address
            } catch {
                this.referrer = undefined
            }
        }

        if (this.referrer != null && this.address != null && this.referrer.equals(this.address)) {
            this.referrer = undefined
            localStorage.removeItem('referrer')
        }
    }

    setTonClient = (endpoint: string) => {
        this.tonClient = new TonClient4({ endpoint })
    }

    setAddress = (address?: Address) => {
        this.address = address
        this.oldWalletAddress = undefined
        this.oldWalletTokens = undefined
        this.newWalletTokens = undefined
        this.setReferrer()
    }

    setTimes = (times?: Times) => {
        this.times = times
    }

    setActiveTab = (activeTab: ActiveTab) => {
        if (this.activeTab !== activeTab) {
            this.activeTab = activeTab
            this.amount = ''
        }
    }

    setAmount = (amount: string) => {
        this.amount = amount
    }

    setAmountToMax = () => {
        this.amount = fromNano(this.maxAmount)
    }

    setWaitForTransaction = (wait: WaitForTransaction) => {
        this.waitForTransaction = wait
    }

    beginRequest = () => {
        this.ongoingRequests += 1
    }

    endRequest = () => {
        this.ongoingRequests -= 1
    }

    setErrorMessage = (errorMessage: string, delay: number) => {
        this.errorMessage = errorMessage
        clearTimeout(this.timeoutErrorMessage)
        if (errorMessage !== '') {
            this.timeoutErrorMessage = setTimeout(() => {
                this.setErrorMessage('', 0)
            }, delay)
        }
    }

    connectTonAccess = () => {
        const network = this.network
        clearTimeout(this.timeoutConnectTonAccess)
        getHttpV4Endpoint({ network })
            .then(this.setTonClient)
            .catch(() => {
                this.setErrorMessage(errorMessageTonAccess, retryDelay - 500)
                this.timeoutConnectTonAccess = setTimeout(this.connectTonAccess, retryDelay)
            })
    }

    readTimes = () => {
        const tonClient = this.tonClient
        const treasuryAddress = treasuryAddresses[this.network]
        clearTimeout(this.timeoutReadTimes)
        this.timeoutReadTimes = setTimeout(this.readTimes, updateTimesDelay)

        if (tonClient == null) {
            this.setTimes(undefined)
            return
        }

        tonClient
            .open(Treasury.createFromAddress(treasuryAddress))
            .getTimes()
            .then(this.setTimes)
            .catch(() => {
                clearTimeout(this.timeoutReadTimes)
                this.timeoutReadTimes = setTimeout(this.readTimes, retryDelay)
            })
    }

    readLastBlock = async () => {
        const tonClient = this.tonClient
        const address = this.address
        const treasuryAddress = treasuryAddresses[this.network]
        const oldTreasuryAddress = oldTreasuryAddresses[this.network]
        clearTimeout(this.timeoutReadLastBlock)
        this.timeoutReadLastBlock = setTimeout(() => void this.readLastBlock(), updateLastBlockDelay)

        if (tonClient == null) {
            runInAction(() => {
                this.tonBalance = undefined
                this.treasury = undefined
                this.treasuryState = undefined
                this.walletAddress = undefined
                this.wallet = undefined
                this.walletState = undefined
                this.oldWalletAddress = undefined
                this.oldWalletTokens = undefined
                this.newWalletTokens = undefined
            })
            return
        }

        try {
            this.beginRequest()
            const lastBlock = (await tonClient.getLastBlock()).last.seqno
            if (lastBlock <= this.lastBlock) {
                return
            }
            const treasury = tonClient.openAt(lastBlock, Treasury.createFromAddress(treasuryAddress))

            const readTreasuryState = treasury.getTreasuryState()

            const readTonBalance =
                address == null
                    ? Promise.resolve(undefined)
                    : tonClient.getAccountLite(lastBlock, address).then((value) => BigInt(value.account.balance.coins))

            const readWallet: Promise<[Address, OpenedContract<Wallet>, typeof this.walletState] | undefined> =
                address == null || this.treasuryState?.parent == null
                    ? Promise.resolve(undefined)
                    : (this.walletAddress != null
                          ? Promise.resolve(this.walletAddress)
                          : tonClient
                                .openAt(lastBlock, Parent.createFromAddress(this.treasuryState.parent))
                                .getWalletAddress(address)
                      ).then(async (walletAddress) => {
                          const wallet = tonClient.openAt(lastBlock, Wallet.createFromAddress(walletAddress))
                          // Wallet may not exist or tonClient may throw an exception,
                          // so return previous this.walletState which is good for both cases.
                          const walletState = await wallet.getWalletState().catch(() => this.walletState)
                          return [walletAddress, wallet, walletState]
                      })

            const parallel: [
                Promise<TreasuryConfig>,
                Promise<bigint | undefined>,
                Promise<[Address, OpenedContract<Wallet>, typeof this.walletState] | undefined>,
            ] = [readTreasuryState, readTonBalance, readWallet]
            const [treasuryState, tonBalance, hton] = await Promise.all(parallel)
            let [walletAddress, wallet, walletState] = hton ?? []

            if (walletAddress == null && address != null && treasuryState.parent != null) {
                ;[walletAddress, wallet, walletState] = await tonClient
                    .openAt(lastBlock, Parent.createFromAddress(treasuryState.parent))
                    .getWalletAddress(address)
                    .then(async (walletAddress) => {
                        const wallet = tonClient.openAt(lastBlock, Wallet.createFromAddress(walletAddress))
                        const walletState = await wallet.getWalletState().catch(() => undefined)
                        return [walletAddress, wallet, walletState]
                    })
            }

            const readOldWallet: Promise<[Address | undefined, bigint | undefined, bigint | undefined]> =
                address == null || this.oldWalletAddress != null
                    ? Promise.resolve([this.oldWalletAddress, this.oldWalletTokens, this.newWalletTokens])
                    : Promise.resolve(tonClient.openAt(lastBlock, Parent.createFromAddress(oldTreasuryAddress))).then(
                          async (oldTreasury) => {
                              const oldWalletAddress = await oldTreasury.getWalletAddress(address)
                              const oldWallet = tonClient.openAt(lastBlock, Wallet.createFromAddress(oldWalletAddress))
                              const oldWalletTokens = await oldWallet
                                  .getWalletState()
                                  .then(([oldWalletTokens]) => oldWalletTokens)
                                  .catch(() => 0n)
                              let newWalletTokens = 0n
                              if (oldWalletTokens > 0n) {
                                  const [oldTotalCoins, oldTotalTokens] = await oldTreasury.getOldTotalCoinsAndTokens()
                                  if (oldTotalTokens > 0n && treasuryState.totalCoins > 0n) {
                                      const coins = (oldWalletTokens * oldTotalCoins) / oldTotalTokens
                                      newWalletTokens = (coins * treasuryState.totalTokens) / treasuryState.totalCoins
                                  }
                              }
                              return [oldWalletAddress, oldWalletTokens, newWalletTokens]
                          },
                      )
            const [oldWalletAddress, oldWalletTokens, newWalletTokens] = await readOldWallet

            runInAction(() => {
                this.tonBalance = tonBalance
                this.treasury = treasury
                this.treasuryState = treasuryState
                this.walletAddress = walletAddress
                this.wallet = wallet
                this.walletState = walletState
                this.oldWalletAddress = oldWalletAddress
                this.oldWalletTokens = oldWalletTokens
                this.newWalletTokens = newWalletTokens
                this.lastBlock = lastBlock
            })
        } catch {
            this.setErrorMessage(errorMessageTonAccess, retryDelay - 500)
            clearTimeout(this.timeoutReadLastBlock)
            this.timeoutReadLastBlock = setTimeout(() => void this.readLastBlock(), retryDelay)
        } finally {
            this.endRequest()
        }
    }

    pause = () => {
        clearTimeout(this.timeoutReadTimes)
        clearTimeout(this.timeoutReadLastBlock)
    }

    resume = () => {
        this.readTimes()
        void this.readLastBlock()
    }

    upgradeOldWallet = () => {
        if (
            this.address != null &&
            this.oldWalletAddress != null &&
            this.tonConnectUI != null &&
            this.tonBalance != null &&
            this.oldWalletTokens != null
        ) {
            const tx: SendTransactionRequest = {
                validUntil: Math.floor(Date.now() / 1000) + txValidUntil,
                network: this.isMainnet ? CHAIN.MAINNET : CHAIN.TESTNET,
                from: this.address.toRawString(),
                messages: [
                    {
                        address: this.oldWalletAddress.toString(),
                        amount: unstakeFee.toString(),
                        payload: beginCell()
                            .storeUint(op.unstakeTokens, 32)
                            .storeUint(0, 64)
                            .storeCoins(this.oldWalletTokens)
                            .storeAddress(undefined)
                            .storeMaybeRef(undefined)
                            .endCell()
                            .toBoc()
                            .toString('base64'),
                    },
                ],
            }
            const tonBalance = this.tonBalance
            void this.tonConnectUI
                .sendTransaction(tx)
                .then(() => {
                    this.setWaitForTransaction('wait')
                    return this.checkIfBalanceChanged(tonBalance, 1)
                })
                .then(() => {
                    this.oldWalletAddress = undefined
                    this.oldWalletTokens = undefined
                    this.newWalletTokens = undefined
                })
        }
    }

    send = () => {
        if (
            this.address != null &&
            this.isAmountValid &&
            this.isAmountPositive &&
            this.amountInNano != null &&
            this.treasury != null &&
            this.wallet != null &&
            this.tonConnectUI != null &&
            this.tonBalance != null
        ) {
            let address: string
            let amount: string
            let payload: string
            if (this.isStakeTabActive) {
                address = this.treasury.address.toString()
                amount = (this.amountInNano + stakeFee).toString()
                payload = beginCell()
                    .storeUint(op.depositCoins, 32)
                    .storeUint(0, 64)
                    .storeAddress(null)
                    .storeCoins(this.amountInNano)
                    .storeCoins(1n)
                    .storeAddress(this.referrer)
                    .endCell()
                    .toBoc()
                    .toString('base64')
            } else {
                address = this.wallet.address.toString()
                amount = unstakeFee.toString()
                const details = beginCell().storeUint(0, 4).storeCoins(1n)
                payload = beginCell()
                    .storeUint(op.unstakeTokens, 32)
                    .storeUint(0, 64)
                    .storeCoins(this.amountInNano)
                    .storeAddress(undefined)
                    .storeMaybeRef(details)
                    .endCell()
                    .toBoc()
                    .toString('base64')
            }
            const tx: SendTransactionRequest = {
                validUntil: Math.floor(Date.now() / 1000) + txValidUntil,
                network: this.isMainnet ? CHAIN.MAINNET : CHAIN.TESTNET,
                from: this.address.toRawString(),
                messages: [
                    {
                        address,
                        amount,
                        payload,
                    },
                ],
            }
            const tonBalance = this.tonBalance
            void this.tonConnectUI
                .sendTransaction(tx)
                .then(() => {
                    this.setWaitForTransaction('wait')
                    return this.checkIfBalanceChanged(tonBalance, 1)
                })
                .then(() => {
                    this.setAmount('')
                })
        }
    }

    checkIfBalanceChanged = async (tonBalance: bigint, counter: number): Promise<void> => {
        await sleep(checkBalanceChangeDelay)
        void this.readLastBlock()
        if (this.tonBalance !== tonBalance) {
            this.setWaitForTransaction('done')
            return Promise.resolve()
        }
        if (counter > 60) {
            this.setWaitForTransaction('timeout')
            return Promise.resolve()
        }
        return this.checkIfBalanceChanged(tonBalance, counter + 1)
    }

    initTonConnect = () => {
        if (document.getElementById(tonConnectButtonRootId) != null) {
            this.connectWallet()
        } else {
            setTimeout(this.initTonConnect, 10)
        }
    }

    connect = () => {
        if (this.tonConnectUI != null) {
            void this.tonConnectUI.openModal()
        }
    }

    connectWallet = () => {
        this.tonConnectUI = new TonConnectUI({
            manifestUrl: 'https://app.hipo.finance/tonconnect-manifest.json',
            buttonRootId: tonConnectButtonRootId,
            actionsConfiguration: {
                skipRedirectToWallet: 'never',
                twaReturnUrl: 'https://t.me/HipoFinanceBot',
            },
            uiPreferences: {
                theme: this.dark ? THEME.DARK : THEME.LIGHT,
                colorsSet: {
                    [THEME.LIGHT]: {
                        connectButton: {
                            background: '#ff7e73',
                            foreground: '#fff',
                        },
                        background: {
                            primary: '#efebe5',
                            secondary: '#fff',
                            qr: '#fff',
                            tint: '#fff',
                            segment: '#fff',
                        },
                        text: {
                            primary: '#776464',
                            secondary: '#776464',
                        },
                        icon: {
                            primary: '#776464',
                            secondary: '#776464',
                            tertiary: '#776464',
                            success: '#4bb543',
                            error: '#e00',
                        },
                        constant: {
                            black: '#776464',
                            white: '#fff',
                        },
                        accent: '#ff7e73',
                    },
                    [THEME.DARK]: {
                        connectButton: {
                            background: '#ff7e73',
                            foreground: '#483637',
                        },
                        background: {
                            primary: '#464343', // dialog/connected-button background
                            secondary: '#8b807f', // menu item hover background
                            qr: '#eaeaea',
                            tint: '#8b807f',
                            segment: '#464343',
                        },
                        text: {
                            primary: '#f2f2f2', // dialog/connected-button text
                            secondary: '#ffedef', // dialog subtitle
                        },
                        icon: {
                            primary: '#f2f2f2', // browser extension icon
                            secondary: '#ffedef', // dialog close
                            tertiary: '#f2f2f2', // loading indicator in connect button
                            success: '#4bb543', // success notification color
                            error: '#f00', // error notification color
                        },
                        constant: {
                            black: '#333131', // qrcode color
                            white: '#333131', // ton connect footer
                        },
                        accent: '#ff7e73', // orange
                    },
                },
            },
        })
        this.tonConnectUI.onStatusChange((wallet) => {
            if (wallet != null) {
                const chain = wallet.account.chain
                if (
                    (chain === CHAIN.MAINNET && this.network === 'mainnet') ||
                    (chain === CHAIN.TESTNET && this.network === 'testnet')
                ) {
                    this.setAddress(Address.parseRaw(wallet.account.address))
                } else {
                    void this.tonConnectUI?.disconnect()
                    runInAction(() => {
                        this.setAddress(undefined)
                        this.setErrorMessage(
                            errorMessageNetworkMismatch + (this.isMainnet ? 'MainNet' : 'TestNet'),
                            10000,
                        )
                    })
                }
            } else {
                this.setAddress(undefined)
            }
        })
    }

    setDark = (dark: boolean) => {
        this.dark = dark
        if (dark) {
            localStorage.theme = 'dark'
            document.documentElement.classList.add('dark')
        } else {
            localStorage.theme = 'light'
            document.documentElement.classList.remove('dark')
        }
        if (this.tonConnectUI != null) {
            this.tonConnectUI.uiOptions = {
                uiPreferences: {
                    theme: dark ? THEME.DARK : THEME.LIGHT,
                },
            }
        }
    }

    switchNetwork = () => {
        this.switchNetworkCounter += 1
        clearTimeout(this.timeoutSwitchNetwork)
        if (this.switchNetworkCounter >= 5) {
            this.switchNetworkCounter = 0
            if (confirm(`Switch network to ${this.isMainnet ? 'TestNet' : 'MainNet'}?`)) {
                this.setNetwork(this.isMainnet ? 'testnet' : 'mainnet')
                window.scrollTo(0, 0)
            }
        } else {
            this.timeoutSwitchNetwork = setTimeout(() => {
                this.switchNetworkCounter = 0
            }, 1000)
        }
    }

    readFragmentState = (): FragmentState => {
        const fragmentState: FragmentState = {}
        if (window.location.hash.startsWith('#')) {
            const fragment = window.location.hash.substring(1)
            const pairs = fragment.split('/')
            for (const pair of pairs) {
                const [key, value] = pair.split('=', 2)
                if (key === 'network') {
                    if (value === 'mainnet' || value === 'testnet') {
                        fragmentState.network = value
                    }
                }
                if (key === 'referrer') {
                    try {
                        fragmentState.referrer = Address.parseFriendly(value).address
                    } catch {
                        // ignore
                    }
                }
                if (key === 'tab') {
                    if (value === 'stake' || value === 'unstake') {
                        fragmentState.activeTab = value
                    }
                }
            }
        }
        return fragmentState
    }

    writeFragmentState = () => {
        let hash = ''
        if (this.network !== defaultNetwork) {
            hash += '/network=' + this.network
        }
        if (this.activeTab !== defaultActiveTab) {
            hash += '/tab=' + this.activeTab
        }
        hash += '/'
        window.location.hash = hash
    }
}

function formatNano(amount: bigint | number): string {
    return (Number(amount) / 1000000000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
    })
}

function formatPercent(amount: number): string {
    return amount.toLocaleString(undefined, {
        style: 'percent',
        maximumFractionDigits: 2,
    })
}

function formatDate(date: Date): string {
    return date.toLocaleString(navigator.language, {
        weekday: 'short',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatEta(time: bigint): string {
    time += 5n * 60n // add 5 minutes as a gap for better estimation
    const now = Math.floor(Date.now() / 1000)
    if (time < now) {
        return 'Instant'
    } else {
        return formatDate(new Date(Number(time) * 1000))
    }
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}
