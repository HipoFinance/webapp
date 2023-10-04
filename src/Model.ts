import { Network, getHttpV4Endpoint } from '@orbs-network/ton-access'
import { TonConnectUI, THEME, CHAIN } from '@tonconnect/ui'
import { action, autorun, computed, makeObservable, observable } from 'mobx'
import { Address, Dictionary, OpenedContract, TonClient4, beginCell, fromNano, toNano } from 'ton'
import { ParticipationState, Reward, Treasury, TreasuryConfig } from './wrappers/Treasury'
import { Wallet } from './wrappers/Wallet'
import { op } from './wrappers/common'

const updateLastBlockDelay = 10 * 1000
const retryDelay = 3 * 1000

const treasuryAddresses = {
    mainnet: Address.parse('kQAjvBlA6Gt0BZhvM9_PgBDVv1_EkRuMYZ3XxdaXlKRyCeaI'),
    testnet: Address.parse('kQAjvBlA6Gt0BZhvM9_PgBDVv1_EkRuMYZ3XxdaXlKRyCeaI'),
}

const depositCoinsFee = 0x9431a7bn
const unstakeTokensFee = 0x7f2b933n

type ActiveTab = 'stake' | 'unstake'

export class Model {
    // observed state
    network: Network
    tonClient?: TonClient4
    lastBlock?: number
    address?: Address
    tonBalance? = 0n
    treasury?: OpenedContract<Treasury>
    treasuryState?: TreasuryConfig
    htonWalletAddress?: Address
    htonWallet?: OpenedContract<Wallet>
    htonWalletState?: [bigint, Dictionary<bigint, bigint>, bigint]
    activeTab: ActiveTab = 'stake'
    amount = ''

    // unobserved state
    tonConnectUI?: TonConnectUI
    timeoutConnectTonAccess?: ReturnType<typeof setTimeout>
    timeoutReadLastBlock?: ReturnType<typeof setTimeout>
    timeoutReadTreasuryState?: ReturnType<typeof setTimeout>
    timeoutReadTonBalance?: ReturnType<typeof setTimeout>
    timeoutReadHtonWalletAddress?: ReturnType<typeof setTimeout>
    timeoutReadHtonWalletState?: ReturnType<typeof setTimeout>

    constructor(network: Network) {
        this.network = network

        makeObservable(this, {
            network: observable,
            tonClient: observable,
            lastBlock: observable,
            address: observable,
            tonBalance: observable,
            treasury: observable,
            treasuryState: observable,
            htonWalletAddress: observable,
            htonWallet: observable,
            htonWalletState: observable,
            activeTab: observable,
            amount: observable,

            isWalletConnected: computed,
            isMainnet: computed,
            isStakeTabActive: computed,
            tonBalanceFormatted: computed,
            htonBalanceFormatted: computed,
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
            stakeFee: computed,
            unstakeFee: computed,
            explorerHref: computed,
            apyWeek: computed,
            apyMonth: computed,
            apyYear: computed,
            protocolFee: computed,
            currentlyStaked: computed,

            setNetwork: action,
            setTonClient: action,
            setLastBlock: action,
            setTreasuryState: action,
            setTonBalance: action,
            setHtonWalletAddress: action,
            setHtonWalletState: action,
            setAddress: action,
            setActiveTab: action,
            setAmount: action,
            setAmountToMax: action,
        })
    }

    init(buttonRootId: string) {
        setTimeout(() => {
            this.connectWallet(buttonRootId)
        }, 1)
        autorun(() => {
            // dependencies: network
            // updates: tonClient
            this.connectTonAccess()
        })
        autorun(() => {
            // dependencies: tonClient
            // updates: lastBlock, treasury
            this.readLastBlock()
        })
        autorun(() => {
            // dependencies: tonClient, lastBlock, address
            // updates: tonBalance
            this.readTonBalance()
        })
        autorun(() => {
            // dependencies: treasury
            // updates: treasuryState
            this.readTreasuryState()
        })
        autorun(() => {
            // dependencies: treasury, address
            // updates: htonWalletAddress, htonWallet
            this.readHtonWalletAddress()
        })
        autorun(() => {
            // dependencies: htonWallet
            // updates: htonWalletState
            this.readHtonWalletState()
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
            return formatAmount(this.tonBalance) + ' TON'
        }
    }

    get htonBalanceFormatted() {
        if (this.htonWalletState != null) {
            return formatAmount(this.htonWalletState[0]) + ' hTON'
        }
    }

    get unstakingInProgressFormatted() {
        return formatAmount(this.htonWalletState?.[2] ?? 0n) + ' hTON'
    }

    get unstakingInProgressDetails() {
        const value = this.htonWalletState?.[2]
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
            amount: formatAmount(value) + ' hTON',
            estimated: time == null ? undefined : formatDate(new Date((Number(time) + 5 * 60) * 1000)),
        }
    }

    get stakingInProgressFormatted() {
        let result = 0n
        const empty = Dictionary.empty(Dictionary.Keys.BigUint(32), Dictionary.Values.BigVarUint(4))
        const staking = this.htonWalletState?.[1] ?? empty
        const times = staking.keys()
        for (const time of times) {
            const value = staking.get(time)
            if (value != null) {
                result += value
            }
        }
        return formatAmount(result) + ' TON'
    }

    get stakingInProgressDetails() {
        const result = []
        const empty = Dictionary.empty(Dictionary.Keys.BigUint(32), Dictionary.Values.BigVarUint(4))
        const staking = this.htonWalletState?.[1] ?? empty
        const times = staking.keys()
        for (const time of times) {
            const value = staking.get(time)
            if (value != null) {
                result.push({
                    amount: formatAmount(value) + ' TON',
                    estimated: time === 0n ? undefined : formatDate(new Date((Number(time) + 5 * 60) * 1000)),
                })
            }
        }
        return result
    }

    get maxAmount() {
        if (this.isStakeTabActive) {
            const m = (this.tonBalance ?? 0n) - depositCoinsFee - 100000000n
            return m > 0n ? m : 0n
        } else {
            const m = this.htonWalletState?.[0] ?? 0n
            return m > 0n ? m : 0n
        }
    }

    get amountInNano() {
        const amount = this.amount.trim()
        try {
            return toNano(amount)
        } catch (e) {
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
        if (this.isWalletConnected) {
            return this.isAmountValid && this.isAmountPositive
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
        if (rate != null && nano != null && this.isAmountValid && this.isAmountPositive) {
            const value = ((Number(nano) / 1000000000) * rate).toFixed(4)
            if (this.isStakeTabActive) {
                return `~ ${value} hTON`
            } else {
                return `~ ${value} TON`
            }
        }
    }

    get exchangeRate() {
        const state = this.treasuryState
        if (state != null) {
            if (this.isStakeTabActive) {
                return Number(state.totalTokens) / Number(state.totalCoins)
            } else {
                return Number(state.totalCoins) / Number(state.totalTokens)
            }
        }
    }

    get exchangeRateFormatted() {
        const rate = this.exchangeRate
        if (rate != null) {
            if (this.isStakeTabActive) {
                return '1 TON = ~ ' + rate.toFixed(4) + ' hTON'
            } else {
                return '1 hTON = ~ ' + rate.toFixed(4) + ' TON'
            }
        }
    }

    get stakeFee() {
        return formatAmount(depositCoinsFee) + ' TON'
    }

    get unstakeFee() {
        return formatAmount(unstakeTokensFee) + ' TON'
    }

    get explorerHref() {
        const address = treasuryAddresses[this.network].toString({ testOnly: !this.isMainnet })
        return (this.isMainnet ? 'https://tonviewer.com/' : 'https://testnet.tonviewer.com/') + address
    }

    get apyWeek() {
        return calculateApy(7, this.treasuryState?.rewardsHistory)
    }

    get apyMonth() {
        return calculateApy(30, this.treasuryState?.rewardsHistory)
    }

    get apyYear() {
        return calculateApy(365, this.treasuryState?.rewardsHistory)
    }

    get protocolFee() {
        return toPercent(this.treasuryState?.governanceFee, 65535n)
    }

    get currentlyStaked() {
        if (this.treasuryState != null) {
            return (this.treasuryState.totalCoins / 1000000000n).toLocaleString() + ' TON'
        }
    }

    setNetwork = (network: Network) => {
        this.network = network
        this.tonClient = undefined
        this.lastBlock = undefined
        this.tonBalance = undefined
        this.treasury = undefined
        this.treasuryState = undefined
        this.htonWalletAddress = undefined
        this.htonWallet = undefined
        this.htonWalletState = undefined
        this.amount = ''
    }

    setTonClient = (endpoint: string) => {
        this.tonClient = new TonClient4({ endpoint })
    }

    setLastBlock = (value?: { last: { seqno: number } }) => {
        this.lastBlock = value?.last.seqno
        if (this.tonClient != null && this.lastBlock != null) {
            const treasury = Treasury.createFromAddress(treasuryAddresses[this.network])
            this.treasury = this.tonClient.openAt(this.lastBlock, treasury)
        }
    }

    setTonBalance = (value?: { account: { balance: { coins: string } } }) => {
        if (value == null) {
            this.tonBalance = undefined
        } else {
            this.tonBalance = BigInt(value.account.balance.coins)
        }
    }

    setTreasuryState = (state?: TreasuryConfig) => {
        this.treasuryState = state
    }

    setHtonWalletAddress = (htonWalletAddress?: Address) => {
        this.htonWalletAddress = htonWalletAddress
        this.htonWallet = undefined
        if (this.tonClient != null && this.lastBlock != null && this.htonWalletAddress != null) {
            const htonWallet = Wallet.createFromAddress(this.htonWalletAddress)
            this.htonWallet = this.tonClient.openAt(this.lastBlock, htonWallet)
        }
    }

    setHtonWalletState = (htonWalletState?: [bigint, Dictionary<bigint, bigint>, bigint]) => {
        this.htonWalletState = htonWalletState
    }

    setAddress = (address: string) => {
        this.address = address === '' ? undefined : Address.parseRaw(address)
    }

    setActiveTab = (activeTab: ActiveTab) => {
        this.activeTab = activeTab
        this.amount = ''
    }

    setAmount = (amount: string) => {
        this.amount = amount
    }

    setAmountToMax = () => {
        this.amount = fromNano(this.maxAmount)
    }

    connectTonAccess = () => {
        const network = this.network
        clearTimeout(this.timeoutConnectTonAccess)
        getHttpV4Endpoint({ network })
            .then(this.setTonClient)
            .catch(() => {
                this.timeoutConnectTonAccess = setTimeout(this.connectTonAccess, retryDelay)
            })
    }

    readLastBlock = () => {
        const tonClient = this.tonClient
        clearTimeout(this.timeoutReadLastBlock)
        this.timeoutReadLastBlock = setTimeout(this.readLastBlock, updateLastBlockDelay)
        if (tonClient == null) {
            this.setLastBlock(undefined)
            return
        }
        tonClient
            .getLastBlock()
            .then(this.setLastBlock)
            .catch(() => {
                clearTimeout(this.timeoutReadLastBlock)
                this.timeoutReadLastBlock = setTimeout(this.readLastBlock, retryDelay)
            })
    }

    pause = () => {
        clearTimeout(this.timeoutReadLastBlock)
    }

    resume = () => {
        this.readLastBlock()
    }

    readTonBalance = () => {
        const tonClient = this.tonClient
        const lastBlock = this.lastBlock
        const address = this.address
        clearTimeout(this.timeoutReadTonBalance)
        if (tonClient == null || lastBlock == null || address == null) {
            this.setTonBalance(undefined)
            return
        }
        tonClient
            .getAccountLite(lastBlock, address)
            .then(this.setTonBalance)
            .catch(() => {
                this.timeoutReadTonBalance = setTimeout(this.readTonBalance, retryDelay)
            })
    }

    readTreasuryState = () => {
        const treasury = this.treasury
        clearTimeout(this.timeoutReadTreasuryState)
        if (treasury == null) {
            this.setTreasuryState(undefined)
            return
        }
        treasury
            .getTreasuryState()
            .then(this.setTreasuryState)
            .catch(() => {
                this.timeoutReadTreasuryState = setTimeout(this.readTreasuryState, retryDelay)
            })
    }

    readHtonWalletAddress = () => {
        const treasury = this.treasury
        const address = this.address
        clearTimeout(this.timeoutReadHtonWalletAddress)
        if (treasury == null || address == null) {
            this.setHtonWalletAddress(undefined)
            return
        }
        treasury
            .getWalletAddress(address)
            .then(this.setHtonWalletAddress)
            .catch(() => {
                this.timeoutReadHtonWalletAddress = setTimeout(this.readHtonWalletAddress, retryDelay)
            })
    }

    readHtonWalletState = () => {
        const htonWallet = this.htonWallet
        clearTimeout(this.timeoutReadHtonWalletState)
        if (htonWallet == null) {
            this.setHtonWalletState(undefined)
            return
        }
        htonWallet
            .getWalletState()
            .then(this.setHtonWalletState)
            .catch(() => {
                this.timeoutReadHtonWalletState = setTimeout(this.readHtonWalletState, retryDelay)
            })
    }

    send = () => {
        if (
            this.isWalletConnected &&
            this.address != null &&
            this.isAmountValid &&
            this.isAmountPositive &&
            this.amountInNano != null &&
            this.treasury != null &&
            this.htonWallet != null &&
            this.tonConnectUI != null &&
            this.tonBalance != null
        ) {
            let address
            let amount
            let payload
            if (this.isStakeTabActive) {
                address = this.treasury.address.toString()
                amount = (this.amountInNano + depositCoinsFee).toString()
                payload = beginCell()
                    .storeUint(op.depositCoins, 32)
                    .storeUint(0, 64)
                    .endCell()
                    .toBoc()
                    .toString('base64')
            } else {
                address = this.htonWallet.address.toString()
                amount = unstakeTokensFee.toString()
                payload = beginCell()
                    .storeUint(op.unstakeTokens, 32)
                    .storeUint(0, 64)
                    .storeCoins(this.amountInNano)
                    .storeAddress(undefined)
                    .storeMaybeRef(undefined)
                    .endCell()
                    .toBoc()
                    .toString('base64')
            }
            const tx = {
                validUntil: Math.floor(Date.now() / 1000) + 60,
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
                .sendTransaction(tx, {
                    modals: ['before', 'success', 'error'],
                    notifications: [],
                })
                .then(() => {
                    this.setAmount('')
                    return this.waitForBalanceChange(tonBalance, 1)
                })
        }
    }

    waitForBalanceChange = async (tonBalance: bigint, counter: number): Promise<void> => {
        this.readLastBlock()
        await sleep(1 * 1000)
        if (this.tonBalance !== tonBalance || counter >= 30) {
            return Promise.resolve()
        }
        return this.waitForBalanceChange(tonBalance, counter + 1)
    }

    connect = () => {
        if (this.tonConnectUI != null) {
            void this.tonConnectUI.connectWallet()
        }
    }

    connectWallet = (buttonRootId: string) => {
        this.tonConnectUI = new TonConnectUI({
            manifestUrl: 'https://app.hipo.finance/tonconnect-manifest.json',
            buttonRootId,
            uiPreferences: {
                theme: THEME.LIGHT,
                colorsSet: {
                    [THEME.LIGHT]: {
                        connectButton: {
                            background: '#ff7e73', // orange
                        },
                        background: {
                            primary: '#efebe5', // milky
                            secondary: '#fff', // white
                        },
                        text: {
                            primary: '#776464', // brown
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
                            black: '#776464', // brown
                            white: '#fff', // white
                        },
                        accent: '#ff7e73', // orange
                    },
                },
            },
        })
        this.tonConnectUI.onStatusChange((wallet) => {
            this.setAddress(wallet?.account.address ?? '')
        })
    }
}

function calculateApy(days: number, history?: Dictionary<bigint, Reward>) {
    const until = BigInt(Math.floor(Date.now() / 1000) - 60 * 60 * 24 * days)
    if (history != null) {
        let totalStaked = 0n
        let totalRecovered = 0n
        const keys = history.keys()
        for (const key of keys) {
            if (key > until) {
                const reward = history.get(key)
                if (reward != null) {
                    totalStaked += reward.staked
                    totalRecovered += reward.recovered
                }
            }
        }
        const apy = (Number(totalRecovered) / Number(totalStaked) - 1) * 100
        return apy.toFixed(5) + '%'
    }
}

function formatAmount(amount: bigint): string {
    return (Number(amount) / 1000000000).toFixed(2)
}

function toPercent(nominator: bigint | undefined, denominator: bigint): string | undefined {
    if (nominator != null) {
        return ((100 * Number(nominator)) / Number(denominator)).toFixed(2) + '%'
    }
}

function formatDate(date: Date): string {
    return date.toLocaleString(navigator.language, {
        weekday: 'long',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    })
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}
