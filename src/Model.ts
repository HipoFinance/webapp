import { Network, getHttpV4Endpoint } from '@orbs-network/ton-access'
import { TonConnectUI, THEME, CHAIN } from '@tonconnect/ui'
import { action, autorun, computed, makeObservable, observable, runInAction } from 'mobx'
import { Address, Dictionary, OpenedContract, TonClient4, beginCell, fromNano, toNano } from 'ton'
import { ParticipationState, Reward, Treasury, TreasuryConfig } from './wrappers/Treasury'
import { Wallet } from './wrappers/Wallet'
import { op } from './wrappers/common'

const updateLastBlockDelay = 6 * 1000
const retryDelay = 3 * 1000

const treasuryAddresses = {
    mainnet: Address.parse('kQAjvBlA6Gt0BZhvM9_PgBDVv1_EkRuMYZ3XxdaXlKRyCeaI'),
    testnet: Address.parse('kQAjvBlA6Gt0BZhvM9_PgBDVv1_EkRuMYZ3XxdaXlKRyCeaI'),
}

const depositCoinsFee = 0x76a14bbn
const unstakeTokensFee = 0x7f2b933n

type ActiveTab = 'stake' | 'unstake'

type WaitForTransaction = 'no' | 'wait' | 'timeout' | 'done'

export class Model {
    // observed state
    network: Network
    tonClient?: TonClient4
    address?: Address
    tonBalance? = 0n
    treasury?: OpenedContract<Treasury>
    treasuryState?: TreasuryConfig
    htonWalletAddress?: Address
    htonWallet?: OpenedContract<Wallet>
    htonWalletState?: [bigint, Dictionary<bigint, bigint>, bigint]
    activeTab: ActiveTab = 'stake'
    amount = ''
    waitForTransaction: WaitForTransaction = 'no'
    ongoingRequests = 0

    // unobserved state
    dark = false
    tonConnectUI?: TonConnectUI
    switchNetworkCounter = 0
    timeoutConnectTonAccess?: ReturnType<typeof setTimeout>
    timeoutReadLastBlock?: ReturnType<typeof setTimeout>
    timeoutSwitchNetwork?: ReturnType<typeof setTimeout>

    constructor(network: Network) {
        this.network = network

        makeObservable(this, {
            network: observable,
            tonClient: observable,
            address: observable,
            tonBalance: observable,
            treasury: observable,
            treasuryState: observable,
            htonWalletAddress: observable,
            htonWallet: observable,
            htonWalletState: observable,
            activeTab: observable,
            amount: observable,
            waitForTransaction: observable,
            ongoingRequests: observable,

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
            setAddress: action,
            setActiveTab: action,
            setAmount: action,
            setAmountToMax: action,
            setWaitForTransaction: action,
            beginRequest: action,
            endRequest: action,
        })
    }

    init(buttonRootId: string) {
        this.dark =
            localStorage.theme === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)

        this.initTonConnect(buttonRootId)

        autorun(() => {
            this.connectTonAccess()
        })
        autorun(() => {
            void this.readLastBlock()
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
                const until = this.treasuryState?.participations.get(time)?.stakeHeldUntil ?? 0n
                result.push({
                    amount: formatAmount(value) + ' TON',
                    estimated: until === 0n ? undefined : formatDate(new Date((Number(until) + 5 * 60) * 1000)),
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
        const tonBalance = this.tonBalance
        const htonBalance = this.htonWalletState?.[0]
        const haveBalance = this.isStakeTabActive ? tonBalance != null : htonBalance != null
        if (this.isWalletConnected) {
            return this.isAmountValid && this.isAmountPositive && haveBalance
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
        this.tonBalance = undefined
        this.treasury = undefined
        this.treasuryState = undefined
        this.htonWalletAddress = undefined
        this.htonWallet = undefined
        this.htonWalletState = undefined
        this.amount = ''
        clearTimeout(this.timeoutConnectTonAccess)
        clearTimeout(this.timeoutReadLastBlock)
    }

    setTonClient = (endpoint: string) => {
        this.tonClient = new TonClient4({ endpoint })
    }

    setAddress = (address?: Address) => {
        this.address = address
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

    setWaitForTransaction = (wait: WaitForTransaction) => {
        this.waitForTransaction = wait
    }

    beginRequest = () => {
        this.ongoingRequests += 1
    }

    endRequest = () => {
        this.ongoingRequests -= 1
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

    readLastBlock = async () => {
        const tonClient = this.tonClient
        const address = this.address
        clearTimeout(this.timeoutReadLastBlock)
        this.timeoutReadLastBlock = setTimeout(() => void this.readLastBlock(), updateLastBlockDelay)

        if (tonClient == null) {
            runInAction(() => {
                this.treasury = undefined
                this.treasuryState = undefined
                this.tonBalance = undefined
                this.htonWalletAddress = undefined
                this.htonWallet = undefined
                this.htonWalletState = undefined
            })
            return
        }

        try {
            this.beginRequest()
            const value = await tonClient.getLastBlock()
            const lastBlock = value.last.seqno
            const treasury = tonClient.openAt(lastBlock, Treasury.createFromAddress(treasuryAddresses[this.network]))
            const parallel: [Promise<TreasuryConfig>, Promise<bigint>?, Promise<Address>?] = [
                treasury.getTreasuryState(),
                address == null
                    ? undefined
                    : tonClient
                          .getAccountLite(lastBlock, address)
                          .then((value: { account: { balance: { coins: string } } }) =>
                              BigInt(value.account.balance.coins),
                          ),
                address == null ? undefined : treasury.getWalletAddress(address),
            ]

            const [treasuryState, tonBalance, htonWalletAddress] = await Promise.all(parallel)
            const htonWallet =
                htonWalletAddress == null
                    ? undefined
                    : tonClient.openAt(lastBlock, Wallet.createFromAddress(htonWalletAddress))
            const htonWalletState = await htonWallet?.getWalletState().catch(() => {
                return undefined
            })
            runInAction(() => {
                this.treasury = treasury
                this.treasuryState = treasuryState
                this.tonBalance = tonBalance
                this.htonWalletAddress = htonWalletAddress
                this.htonWallet = htonWallet
                this.htonWalletState = htonWalletState
            })
        } catch (e) {
            clearTimeout(this.timeoutReadLastBlock)
            this.timeoutReadLastBlock = setTimeout(() => void this.readLastBlock(), retryDelay)
        } finally {
            this.endRequest()
        }
    }

    pause = () => {
        clearTimeout(this.timeoutReadLastBlock)
    }

    resume = () => {
        void this.readLastBlock()
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
            void this.tonConnectUI.sendTransaction(tx).then(() => {
                this.setAmount('')
                this.setWaitForTransaction('wait')
                return this.checkIfBalanceChanged(tonBalance, 1)
            })
        }
    }

    checkIfBalanceChanged = async (tonBalance: bigint, counter: number): Promise<void> => {
        await sleep(1 * 1000)
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

    initTonConnect = (buttonRootId: string) => {
        if (document.getElementById(buttonRootId) != null) {
            this.connectWallet(buttonRootId)
        } else {
            setTimeout(() => {
                this.initTonConnect(buttonRootId)
            }, 10)
        }
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
                            error: '#e00', // error notification color
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
            this.setAddress(wallet == null ? undefined : Address.parseRaw(wallet.account.address))
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
