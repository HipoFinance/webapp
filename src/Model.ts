import { Network, getHttpV4Endpoint } from '@orbs-network/ton-access'
import { TonConnectUI, THEME, CHAIN, SendTransactionRequest } from '@tonconnect/ui'
import { action, autorun, computed, makeObservable, observable, runInAction } from 'mobx'
import { Address, Dictionary, OpenedContract, TonClient4, beginCell, fromNano, toNano } from '@ton/ton'
import {
    ParticipationState,
    Times,
    Treasury,
    Wallet,
    Parent,
    TreasuryConfig,
    WalletState,
    maxAmountToStake,
    opUnstakeTokens,
    treasuryAddresses,
    feeUnstake,
    createDepositMessage,
    createUnstakeMessage,
} from '@hipo-finance/sdk'
import { OldTreasury } from './OldTreasury'

type ActivePage = 'stake' | 'reward' | 'defi'

type ActiveTab = 'stake' | 'unstake'

type UnstakeOption = 'unstake' | 'swap'

type WaitForTransaction = 'no' | 'signed' | 'sent' | 'timeout' | 'done'

type RewardsFetchState = 'init' | 'loading' | 'error' | 'more' | 'done'

interface RewardRow {
    time: Date
    htonBalance: string
    tonReward: string
}

interface RewardsState {
    state: RewardsFetchState
    rewards: RewardRow[]
}

const emptyRewardsState: RewardsState = {
    state: 'init',
    rewards: [],
}

interface FragmentState {
    network?: Network
    activePage?: ActivePage
    activeTab?: ActiveTab
}

const updateTimesDelay = 5 * 60 * 1000
const updateLastBlockDelay = 30 * 1000
const retryDelay = 3 * 1000
const waitForCompletionDelay = 3 * 1000
const txValidUntil = 5 * 60

const averageStakeFee = 15000000n
const averageUnstakeFee = 42000000n

const oldTreasuryAddresses: Record<Network, Address> = {
    mainnet: Address.parse('EQBNo5qAG8I8J6IxGaz15SfQVB-kX98YhKV_mT36Xo5vYxUa'),
    testnet: Address.parse('kQAjvBlA6Gt0BZhvM9_PgBDVv1_EkRuMYZ3XxdaXlKRyCeaI'),
}

const defaultNetwork: Network = 'mainnet'
const defaultActivePage: ActivePage = 'stake'
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
    walletState?: WalletState
    oldWalletAddress?: Address
    oldWalletTokens?: bigint
    newWalletTokens?: bigint
    activePage: ActivePage = defaultActivePage
    activeTab: ActiveTab = defaultActiveTab
    amount = ''
    unstakeOption: UnstakeOption = 'unstake'
    waitForTransaction: WaitForTransaction = 'no'
    ongoingRequests = 0
    errorMessage = ''
    holdersCount?: number
    rewardsState: RewardsState = emptyRewardsState

    // unobserved state
    dark = false
    tonConnectUI?: TonConnectUI
    lastBlock = 0
    switchNetworkCounter = 0
    timeoutConnectTonAccess?: ReturnType<typeof setTimeout>
    timeoutReadTimes?: ReturnType<typeof setTimeout>
    timeoutReadLastBlock?: ReturnType<typeof setTimeout>
    timeoutSwitchNetwork?: ReturnType<typeof setTimeout>
    timeoutErrorMessage?: ReturnType<typeof setTimeout>
    timeoutHipoGauge?: ReturnType<typeof setTimeout>

    // readonly numberParser = new NumberParser(navigator.language)

    readonly dedustSwapUrl = 'https://dedust.io/swap/hTON/TON'
    readonly dedustPoolUrl = 'https://dedust.io/pools/EQBWsAdyAg-8fs3G-m-eUBCXZuVaOldF5-tCMJBJzxQG7nLX'
    readonly stonSwapUrl = 'https://app.ston.fi/swap?chartVisible=false&ft=hTON&tt=TON'
    readonly stonPoolUrl = 'https://app.ston.fi/pools/EQDjmQDt12Ys1-gyKZskDSIDAVQaciI3cIUpk46LCWtnKpGF'
    readonly toncoSwapUrl = 'https://app.tonco.io/#/swap?from=hTON&to=TON'
    readonly toncoPoolUrl = 'https://app.tonco.io/#/pool/EQCNtxsO6JYljVLkcJVt7hZZhkC50kMIFAZklE4zBby31RAR'
    readonly aquaUsdUrl = 'https://app.aquaprotocol.xyz/?asset=hton'
    readonly tonspaceUrl = 'https://t.me/wallet?startattach'
    readonly mtwUrl = 'https://mytonwallet.io/get'
    readonly evaaLoanUrl = 'https://app.evaa.finance/'

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
            activePage: observable,
            activeTab: observable,
            amount: observable,
            unstakeOption: observable,
            waitForTransaction: observable,
            ongoingRequests: observable,
            errorMessage: observable,
            holdersCount: observable,
            rewardsState: observable,

            isWalletConnected: computed,
            isMainnet: computed,
            isStakeTabActive: computed,
            tonBalanceFormatted: computed,
            htonBalance: computed,
            htonBalanceFormatted: computed,
            htonBalanceInTon: computed,
            htonBalanceInTonAfterOneYear: computed,
            profitAfterOneYear: computed,
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
            swapUrl: computed,
            youWillReceive: computed,
            exchangeRate: computed,
            exchangeRateFormatted: computed,
            averageStakeFeeFormatted: computed,
            averageUnstakeFeeFormatted: computed,
            unstakeHours: computed,
            explorerHref: computed,
            apy: computed,
            apyFormatted: computed,
            protocolFee: computed,
            currentlyStaked: computed,

            setNetwork: action,
            setTonClient: action,
            setAddress: action,
            setTimes: action,
            setActivePage: action,
            setActiveTab: action,
            setUnstakeOption: action,
            setAmount: action,
            setAmountToMax: action,
            setWaitForTransaction: action,
            beginRequest: action,
            endRequest: action,
            setErrorMessage: action,
            setRewardsFetchState: action,
            loadMoreRewards: action,
        })
    }

    init() {
        this.dark =
            localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)

        document.onvisibilitychange = this.controlBackgroundJobs
        this.controlBackgroundJobs()

        window.onhashchange = () => {
            const fragmentState = this.readFragmentState()
            runInAction(() => {
                this.setActivePage(fragmentState.activePage ?? defaultActivePage)
                this.setActiveTab(fragmentState.activeTab ?? defaultActiveTab)
                this.setNetwork(fragmentState.network ?? defaultNetwork)
            })
            this.writeFragmentState()
        }
        window.dispatchEvent(new HashChangeEvent('hashchange'))

        this.initTonConnect()
        this.loadHipoGauge()

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

        autorun(() => {
            const walletAddress = this.walletAddress
            const activePage = this.activePage
            const rewardsState = this.rewardsState
            if (walletAddress == null || activePage !== 'reward' || rewardsState.state !== 'init') {
                return
            }
            this.loadMoreRewards()
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

    get htonBalance() {
        return this.walletState?.tokens ?? 0n
    }

    get htonBalanceFormatted() {
        if (this.tonBalance != null) {
            return formatNano(this.walletState?.tokens ?? 0n) + ' hTON'
        }
    }

    get htonBalanceInTon() {
        const state = this.treasuryState
        if (state != null && this.walletState != null) {
            const rate = Number(state.totalCoins) / Number(state.totalTokens) || 1
            const balance = Number(this.walletState.tokens ?? 0n) * rate
            return '≈ ' + formatNano(balance) + ' TON'
        }
    }

    get htonBalanceInTonAfterOneYear() {
        const apy = this.apy
        const state = this.treasuryState
        if (apy != null && state != null && this.walletState != null) {
            const rate = Number(state.totalCoins) / Number(state.totalTokens) || 1
            const balance = Number(this.walletState.tokens ?? 0n) * rate * (1 + apy)
            return '≈ ' + formatNano(balance) + ' TON'
        }
    }

    get profitAfterOneYear() {
        const apy = this.apy
        const state = this.treasuryState
        if (apy != null && state != null && this.walletState != null) {
            const rate = Number(state.totalCoins) / Number(state.totalTokens) || 1
            const balance = Number(this.walletState.tokens ?? 0n) * rate * apy
            return '≈ ' + formatNano(balance) + ' TON'
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
        return formatNano(this.walletState?.unstaking ?? 0n) + ' hTON'
    }

    get unstakingInProgressDetails() {
        const value = this.walletState?.unstaking
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
        const staking = this.walletState?.staking ?? empty
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
        const staking = this.walletState?.staking ?? empty
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
            // reserve enough TON for user's ton wallet storage fee + enough funds for future unstake
            return maxAmountToStake(tonBalance ?? 0n)
        } else {
            return walletState?.tokens ?? 0n
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
        const htonBalance = this.walletState?.tokens
        const haveBalance = this.isStakeTabActive ? tonBalance != null : htonBalance != null
        const isStakeTabActive = this.isStakeTabActive
        const unstakeOption = this.unstakeOption
        if (this.isWalletConnected) {
            return (isAmountValid && isAmountPositive && haveBalance) || (!isStakeTabActive && unstakeOption === 'swap')
        } else {
            return true
        }
    }

    get buttonLabel() {
        if (this.isWalletConnected) {
            if (this.isStakeTabActive) {
                return 'Stake'
            } else {
                if (this.unstakeOption === 'unstake') {
                    return 'Unstake'
                } else {
                    return 'Swap'
                }
            }
        } else {
            return 'Connect Wallet'
        }
    }

    get swapUrl() {
        let url = 'https://swap.coffee/dex?ft=EQDPdq8xjAhytYqfGSX8KcFWIReCufsB9Wdg0pLlYSO_h76w&st=TON'
        if (this.isAmountValid && this.isAmountPositive) {
            url += '&fa=' + this.amount
        }
        return url
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
            const rate = (Number(state.totalCoins) / Number(state.totalTokens)) * 1000000000 || 1
            return '1 hTON = ~ ' + formatNano(rate, 4) + ' TON'
        }
    }

    get averageStakeFeeFormatted() {
        if (this.treasuryState != null) {
            return formatNano(averageStakeFee, 3) + ' TON'
        }
    }

    get averageUnstakeFeeFormatted() {
        if (this.treasuryState != null) {
            return formatNano(averageUnstakeFee, 3) + ' TON'
        }
    }

    get unstakeHours() {
        const times = this.times
        const participations = this.treasuryState?.participations
        if (times != null && participations != null) {
            const keys = participations.keys().sort()
            return formatUnstakeHours(participations.get(keys[0] ?? 0n)?.stakeHeldUntil ?? 0n)
        }
    }

    get explorerHref() {
        const treasuryAddress = treasuryAddresses.get(this.network)
        let address = ''
        if (treasuryAddress != null) {
            address = treasuryAddress.toString({ testOnly: !this.isMainnet })
        }
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

    get holdersCountFormatted() {
        if (this.holdersCount != null) {
            return formatCompact1Fraction(this.holdersCount)
        } else {
            return '-'
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

    setTonClient = (endpoint: string) => {
        this.tonClient = new TonClient4({ endpoint, timeout: 5 * 1_000 })
    }

    setAddress = (address?: Address) => {
        this.address = address
        this.tonBalance = undefined
        this.walletAddress = undefined
        this.wallet = undefined
        this.walletState = undefined
        this.oldWalletAddress = undefined
        this.oldWalletTokens = undefined
        this.newWalletTokens = undefined
        this.lastBlock = 0
        this.rewardsState = emptyRewardsState
    }

    setTimes = (times?: Times) => {
        this.times = times
    }

    setActivePage = (activePage: ActivePage) => {
        if (this.activePage !== activePage) {
            this.activePage = activePage
            this.controlBackgroundJobs()
            window.scrollTo(0, 0)
        }
    }

    setActiveTab = (activeTab: ActiveTab) => {
        if (this.activeTab !== activeTab) {
            this.activeTab = activeTab
            this.amount = ''
        }
    }

    setUnstakeOption = (unstakeOption: UnstakeOption) => {
        if (this.unstakeOption !== unstakeOption) {
            this.unstakeOption = unstakeOption
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

    setRewardsFetchState = (state: RewardsFetchState) => {
        this.rewardsState.state = state
    }

    loadMoreRewards = async () => {
        const walletAddress = this.walletAddress
        if (walletAddress == null || this.rewardsState.state === 'loading') {
            return
        }

        this.setRewardsFetchState('loading')

        const url = 'https://api.hipo.finance:8443/hton/rewards/' + walletAddress.toString() + '?before='

        let before = 0
        if (this.rewardsState.rewards.length > 0) {
            before = this.rewardsState.rewards[this.rewardsState.rewards.length - 1].time.getTime() / 1_000
        }

        try {
            let count = 0
            while (true) {
                const rewards = await fetch(url + before.toString())
                    .then((res) => res.json())
                    .then((res) => {
                        const ok = res?.ok ?? false
                        const rewards = res?.result?.rewards
                        if (!ok || !Array.isArray(rewards)) {
                            throw new Error()
                        } else {
                            return rewards
                        }
                    })

                runInAction(() => {
                    for (const reward of rewards) {
                        before = reward.time
                        if (BigInt(reward.ton_reward) > 0n) {
                            this.rewardsState.rewards.push({
                                time: new Date(reward.time * 1000),
                                htonBalance: formatNano(BigInt(reward.hton_balance), 3),
                                tonReward: formatNano(BigInt(reward.ton_reward), 9),
                            })
                            count += 1
                        }
                    }
                })
                if (rewards.length < 10) {
                    this.setRewardsFetchState('done')
                    break
                } else if (count >= 10) {
                    this.setRewardsFetchState('more')
                    break
                }
            }
        } catch {
            this.setRewardsFetchState('error')
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
        const treasuryAddress = treasuryAddresses.get(this.network)
        clearTimeout(this.timeoutReadTimes)
        if (document.hidden) {
            return
        }
        this.timeoutReadTimes = setTimeout(this.readTimes, updateTimesDelay)

        if (tonClient == null || treasuryAddress == null) {
            this.setTimes(undefined)
            return
        }

        const openedTreasury = tonClient.open(Treasury.createFromAddress(treasuryAddress))
        retry(openedTreasury.getTimes)
            .then(this.setTimes)
            .catch(() => {
                clearTimeout(this.timeoutReadTimes)
                this.timeoutReadTimes = setTimeout(this.readTimes, retryDelay)
            })
    }

    readLastBlock = async () => {
        const tonClient = this.tonClient
        const address = this.address
        const treasuryAddress = treasuryAddresses.get(this.network)
        clearTimeout(this.timeoutReadLastBlock)
        if (document.hidden) {
            return
        }
        this.timeoutReadLastBlock = setTimeout(() => void this.readLastBlock(), updateLastBlockDelay)

        if (tonClient == null || treasuryAddress == null) {
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
            const lastBlock = (await retry(() => tonClient.getLastBlock())).last.seqno
            if (lastBlock < this.lastBlock) {
                throw new Error('older block')
            }
            const treasury = tonClient.openAt(lastBlock, Treasury.createFromAddress(treasuryAddress))

            const readTreasuryState = retry(treasury.getTreasuryState)

            const readTonBalance =
                address == null
                    ? Promise.resolve(undefined)
                    : retry(() => tonClient.getAccountLite(lastBlock, address)).then((value) =>
                          BigInt(value.account.balance.coins),
                      )

            const lastParent = this.treasuryState?.parent
            const readWallet: Promise<[Address, OpenedContract<Wallet>, typeof this.walletState] | undefined> =
                address == null || lastParent == null
                    ? Promise.resolve(undefined)
                    : (this.walletAddress != null
                          ? Promise.resolve(this.walletAddress)
                          : retry(() =>
                                tonClient
                                    .openAt(lastBlock, Parent.createFromAddress(lastParent))
                                    .getWalletAddress(address),
                            )
                      ).then(async (walletAddress) => {
                          const wallet = tonClient.openAt(lastBlock, Wallet.createFromAddress(walletAddress))
                          const walletState = await wallet.getWalletState().catch((e: unknown) => {
                              if (e instanceof Error && 'message' in e && e.message === 'Exit code: -256') {
                                  return undefined // wallet does not exists
                              } else {
                                  throw e
                              }
                          })
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
                try {
                    const openedParent = tonClient.openAt(lastBlock, Parent.createFromAddress(treasuryState.parent))
                    ;[walletAddress, wallet, walletState] = await retry(() =>
                        openedParent.getWalletAddress(address),
                    ).then(async (walletAddress) => {
                        const wallet = tonClient.openAt(lastBlock, Wallet.createFromAddress(walletAddress))
                        const walletState = await wallet.getWalletState().catch((e: unknown) => {
                            if (e instanceof Error && 'message' in e && e.message === 'Exit code: -256') {
                                return undefined // wallet does not exists
                            } else {
                                throw e
                            }
                        })
                        return [walletAddress, wallet, walletState]
                    })
                } catch {
                    // ignore
                }
            }

            runInAction(() => {
                this.tonBalance = tonBalance
                this.treasury = treasury
                this.treasuryState = treasuryState
                this.walletAddress = walletAddress
                this.wallet = wallet
                this.walletState = walletState
                this.lastBlock = lastBlock
            })

            await this.readOldWallet(tonClient, lastBlock, treasuryState)
        } catch {
            this.setErrorMessage(errorMessageTonAccess, retryDelay - 500)
            clearTimeout(this.timeoutReadLastBlock)
            this.timeoutReadLastBlock = setTimeout(() => void this.readLastBlock(), retryDelay)
        } finally {
            this.endRequest()
        }
    }

    readOldWallet = async (tonClient: TonClient4, lastBlock: number, treasuryState: TreasuryConfig) => {
        const address = this.address
        const oldTreasuryAddress = oldTreasuryAddresses[this.network]

        const readOldWallet: Promise<[Address | undefined, bigint | undefined, bigint | undefined]> =
            address == null || this.oldWalletAddress != null
                ? Promise.resolve([this.oldWalletAddress, this.oldWalletTokens, this.newWalletTokens])
                : Promise.resolve(tonClient.openAt(lastBlock, OldTreasury.createFromAddress(oldTreasuryAddress))).then(
                      async (oldTreasury) => {
                          const oldWalletAddress = await retry(() => oldTreasury.getWalletAddress(address))
                          const oldWallet = tonClient.openAt(lastBlock, Wallet.createFromAddress(oldWalletAddress))
                          const oldWalletTokens =
                              (await retry(() =>
                                  oldWallet
                                      .getWalletState()
                                      .then((walletState) => walletState.tokens)
                                      .catch((e: unknown) => {
                                          if (e instanceof Error && 'message' in e && e.message === 'Exit code: -256') {
                                              return undefined // wallet does not exists
                                          } else {
                                              throw e
                                          }
                                      }),
                              )) ?? 0n
                          let newWalletTokens = 0n
                          if (oldWalletTokens > 0n) {
                              const [oldTotalCoins, oldTotalTokens] = await retry(oldTreasury.getTotalCoinsAndTokens)
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
            this.oldWalletAddress = oldWalletAddress
            this.oldWalletTokens = oldWalletTokens
            this.newWalletTokens = newWalletTokens
        })
    }

    pause = () => {
        clearTimeout(this.timeoutReadTimes)
        clearTimeout(this.timeoutReadLastBlock)
    }

    resume = () => {
        this.readTimes()
        void this.readLastBlock()
    }

    controlBackgroundJobs = () => {
        if (!document.hidden && this.activePage === 'stake') {
            this.resume()
        } else {
            this.pause()
        }
    }

    upgradeOldWallet = () => {
        if (
            this.address != null &&
            this.oldWalletAddress != null &&
            this.tonConnectUI != null &&
            this.tonBalance != null &&
            this.oldWalletTokens != null
        ) {
            const queryId = generateRandomQueryId()

            const tx: SendTransactionRequest = {
                validUntil: Math.floor(Date.now() / 1000) + txValidUntil,
                network: this.isMainnet ? CHAIN.MAINNET : CHAIN.TESTNET,
                from: this.address.toRawString(),
                messages: [
                    {
                        address: this.oldWalletAddress.toString(),
                        amount: feeUnstake.toString(),
                        payload: beginCell()
                            .storeUint(opUnstakeTokens, 32)
                            .storeUint(queryId, 64)
                            .storeCoins(this.oldWalletTokens)
                            .storeAddress(undefined)
                            .storeMaybeRef(undefined)
                            .endCell()
                            .toBoc()
                            .toString('base64'),
                    },
                ],
            }
            void this.tonConnectUI
                .sendTransaction(tx)
                .then(() => this.waitForCompletion(queryId))
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
            const queryId = generateRandomQueryId()

            const message = this.isStakeTabActive
                ? createDepositMessage(this.treasury.address, this.amountInNano, queryId)
                : createUnstakeMessage(this.wallet.address, this.amountInNano, queryId)

            const tx: SendTransactionRequest = {
                validUntil: Math.floor(Date.now() / 1000) + txValidUntil,
                network: this.isMainnet ? CHAIN.MAINNET : CHAIN.TESTNET,
                from: this.address.toRawString(),
                messages: [message],
            }
            void this.tonConnectUI
                .sendTransaction(tx)
                .then(() => this.waitForCompletion(queryId))
                .then(() => {
                    this.setAmount('')
                })
        }
    }

    waitForCompletion = async (queryId: bigint) => {
        const tonClient = this.tonClient
        const address = this.address

        if (tonClient == null || address == null) {
            this.setWaitForTransaction('timeout')
            return
        }

        this.setWaitForTransaction('signed')

        try {
            clearTimeout(this.timeoutReadLastBlock)

            for (let i = 0; i < 100; i += 1) {
                await sleep(waitForCompletionDelay)

                const lastBlock = (await retry(() => tonClient.getLastBlock())).last.seqno
                const last = (await retry(() => tonClient.getAccountLite(lastBlock, address))).account.last
                if (last == null) {
                    continue
                }
                const txs = await retry(() =>
                    tonClient.getAccountTransactions(address, BigInt(last.lt), Buffer.from(last.hash, 'base64')),
                )

                for (const txBlock of txs) {
                    const tx = txBlock.tx
                    if (tx.description.type !== 'generic' || tx.inMessage == null) {
                        continue
                    }

                    const inPayload = tx.inMessage.body.beginParse()
                    if (tx.inMessage.info.type === 'internal' && inPayload.remainingBits >= 32 + 64) {
                        inPayload.skip(32)
                        if (inPayload.loadUintBig(64) === queryId) {
                            await this.readLastBlock()
                            clearTimeout(this.timeoutReadLastBlock)
                            this.setWaitForTransaction('done')
                            return
                        }
                    }

                    const outMessage = tx.outMessages.get(0)
                    if (this.waitForTransaction === 'signed' && outMessage != null) {
                        const outPayload = outMessage.body.beginParse()
                        if (outPayload.remainingBits >= 32 + 64) {
                            outPayload.skip(32)
                            if (outPayload.loadUintBig(64) === queryId) {
                                this.setWaitForTransaction('sent')
                                break
                            }
                        }
                    }
                }
            }
        } catch {
            this.setWaitForTransaction('timeout')
        } finally {
            this.timeoutReadLastBlock = setTimeout(() => void this.readLastBlock(), updateLastBlockDelay)
        }
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
                if (key === 'page') {
                    if (value === 'stake' || value === 'reward' || value === 'defi') {
                        fragmentState.activePage = value
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
        if (this.activePage !== defaultActivePage) {
            hash += '/page=' + this.activePage
        }
        if (this.activeTab !== defaultActiveTab) {
            hash += '/tab=' + this.activeTab
        }
        hash += '/'
        window.location.hash = hash
    }

    loadHipoGauge = () => {
        clearTimeout(this.timeoutHipoGauge)
        fetch('https://gauge.hipo.finance/data')
            .then((res) => res.json())
            .then((res: { ok: boolean; result: { hton: { holders_count: number } } }) => {
                if (res.ok && res.result.hton.holders_count >= 0) {
                    runInAction(() => {
                        this.holdersCount = res.result.hton.holders_count
                    })
                } else {
                    throw new Error('invalid response')
                }
            })
            .catch(() => {
                clearTimeout(this.timeoutHipoGauge)
                this.timeoutHipoGauge = setTimeout(this.loadHipoGauge, 5000)
            })
    }
}

// class NumberParser {
//     #group: RegExp
//     #decimal: RegExp
//     #numeral: RegExp
//     #index: (substring: string) => string
//     constructor(locale: string) {
//         const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
//         const numerals = [...new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210)].reverse()
//         const index = new Map(numerals.map((d, i) => [d, i]))
//         this.#group = new RegExp(`[${(parts.find((d) => d.type === 'group') ?? parts[0]).value}]`, 'g')
//         this.#decimal = new RegExp(`[${(parts.find((d) => d.type === 'decimal') ?? parts[0]).value}]`)
//         this.#numeral = new RegExp(`[${numerals.join('')}]`, 'g')
//         this.#index = (d) => (index.get(d) ?? '').toString()
//     }
//     parse(input: string) {
//         const result = input
//             .trim()
//             .replace(this.#group, '')
//             .replace(this.#decimal, '.')
//             .replace(this.#numeral, this.#index)
//         return result ? +result : NaN
//     }
// }

export function formatCompact1Fraction(n: number): string {
    return n.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 })
}

function formatNano(amount: bigint | number, maximumFractionDigits = 2): string {
    return (Number(amount) / 1000000000).toLocaleString(undefined, {
        maximumFractionDigits,
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

function formatUnstakeHours(time: bigint): string {
    time += 5n * 60n // add 5 minutes as a gap for better estimation
    const now = Math.floor(Date.now() / 1000)
    const diff = Number(time) - now
    const hours = Math.max(0, Math.ceil(diff / 3600))
    return hours.toString()
}

function generateRandomQueryId(): bigint {
    const randomArray = new BigUint64Array(1)
    crypto.getRandomValues(randomArray)
    return randomArray[0]
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}

function retry<T>(fn: () => Promise<T>, retries = 10): Promise<T> {
    return new Promise(function (resolve, reject) {
        let err: Error | undefined
        const attempt = () => {
            if (retries < 10) {
                console.warn('retry', retries)
            }
            if (retries <= 0) {
                reject(err ?? new Error())
            } else {
                fn()
                    .then(resolve)
                    .catch((e: unknown) => {
                        retries -= 1
                        err = e as Error
                        setTimeout(attempt)
                    })
            }
        }
        attempt()
    })
}
