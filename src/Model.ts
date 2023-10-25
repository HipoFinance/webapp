import { Network, getHttpEndpoint, getHttpV4Endpoint } from '@orbs-network/ton-access'
import { TonConnectUI, THEME, CHAIN } from '@tonconnect/ui'
import { action, autorun, computed, makeObservable, observable, runInAction } from 'mobx'
import { Address, Dictionary, OpenedContract, TonClient, TonClient4, beginCell, fromNano, toNano } from 'ton'
import { ParticipationState, Times, Treasury, TreasuryConfig } from './wrappers/Treasury'
import { Wallet } from './wrappers/Wallet'
import { op } from './wrappers/common'

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
const sendValidUntil = 5 * 60

const treasuryAddresses: Record<Network, Address> = {
    mainnet: Address.parse('kQAjvBlA6Gt0BZhvM9_PgBDVv1_EkRuMYZ3XxdaXlKRyCeaI'),
    testnet: Address.parse('kQAjvBlA6Gt0BZhvM9_PgBDVv1_EkRuMYZ3XxdaXlKRyCeaI'),
}

const defaultNetwork: Network = 'testnet'
const defaultActiveTab: ActiveTab = 'stake'

const depositCoinsFee = 0x76a14bbn
const unstakeTokensFee = 0x7f2b933n

const tonConnectButtonRootId = 'ton-connect-button'

const errorMessageTonAccess = 'Unable to access blockchain'
const errorMessageNetworkMismatch = 'Your wallet must be on '

export class Model {
    // observed state
    network: Network
    tonClient2?: TonClient
    tonClient4?: TonClient4
    address?: Address
    tonBalance? = 0n
    treasury?: OpenedContract<Treasury>
    treasuryState?: TreasuryConfig
    times?: Times
    htonWalletAddress?: Address
    htonWallet?: OpenedContract<Wallet>
    htonWalletState?: [bigint, Dictionary<bigint, bigint>, bigint]
    activeTab: ActiveTab
    amount = ''
    waitForTransaction: WaitForTransaction = 'no'
    ongoingRequests = 0
    errorMessage = ''

    // unobserved state
    dark = false
    tonConnectUI?: TonConnectUI
    switchNetworkCounter = 0
    referrer?: Address
    timeoutConnectTonAccess?: ReturnType<typeof setTimeout>
    timeoutReadTimes?: ReturnType<typeof setTimeout>
    timeoutReadLastBlock?: ReturnType<typeof setTimeout>
    timeoutSwitchNetwork?: ReturnType<typeof setTimeout>
    timeoutErrorMessage?: ReturnType<typeof setTimeout>

    constructor() {
        const fragmentState = this.readFragmentState()
        this.network = fragmentState.network ?? defaultNetwork
        this.activeTab = fragmentState.activeTab ?? defaultActiveTab
        this.referrer = fragmentState.referrer

        makeObservable(this, {
            network: observable,
            tonClient2: observable,
            tonClient4: observable,
            address: observable,
            tonBalance: observable,
            treasury: observable,
            treasuryState: observable,
            times: observable,
            htonWalletAddress: observable,
            htonWallet: observable,
            htonWalletState: observable,
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
            stakeEta: computed,
            unstakeEta: computed,
            explorerHref: computed,
            apy: computed,
            apyFormatted: computed,
            protocolFee: computed,
            currentlyStaked: computed,

            setNetwork: action,
            setTonClients: action,
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
                this.referrer = fragmentState.referrer
            })
            this.writeFragmentState()
        }

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
            return formatAmount(this.tonBalance) + ' TON'
        }
    }

    get htonBalanceFormatted() {
        if (this.tonBalance != null) {
            return formatAmount(this.htonWalletState?.[0] ?? 0n) + ' hTON'
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
        let value = ''
        if (rate != null && nano != null && this.isAmountValid && this.isAmountPositive) {
            value = '~ ' + ((Number(nano) / 1000000000) * rate).toFixed(4)
        }
        if (this.isStakeTabActive) {
            return `${value} hTON`
        } else {
            return `${value} TON`
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
        const state = this.treasuryState
        if (state != null) {
            return '1 hTON = ~ ' + (Number(state.totalCoins) / Number(state.totalTokens)).toFixed(4) + ' TON'
        }
    }

    get stakeFee() {
        return formatAmount(depositCoinsFee) + ' TON'
    }

    get unstakeFee() {
        return formatAmount(unstakeTokensFee) + ' TON'
    }

    get stakeEta() {
        const times = this.times
        const participations = this.treasuryState?.participations
        if (times != null && participations != null) {
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
            return Math.pow(Number(lastRecovered) / Number(lastStaked), compoundingFrequency) - 1
        }
    }

    get apyFormatted() {
        if (this.apy != null) {
            return (this.apy * 100).toFixed(5) + '%'
        }
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
        if (this.network !== network) {
            this.network = network
            this.tonClient2 = undefined
            this.tonClient4 = undefined
            this.address = undefined
            this.tonBalance = undefined
            this.treasury = undefined
            this.treasuryState = undefined
            this.times = undefined
            this.htonWalletAddress = undefined
            this.htonWallet = undefined
            this.htonWalletState = undefined
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

    setTonClients = ([endpoint2, endpoint4]: [string, string]) => {
        this.tonClient2 = new TonClient({ endpoint: endpoint2 })
        this.tonClient4 = new TonClient4({ endpoint: endpoint4 })
    }

    setAddress = (address?: Address) => {
        this.address = address
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
        Promise.all([getHttpEndpoint({ network }), getHttpV4Endpoint({ network })])
            .then(this.setTonClients)
            .catch(() => {
                this.setErrorMessage(errorMessageTonAccess, retryDelay - 500)
                this.timeoutConnectTonAccess = setTimeout(this.connectTonAccess, retryDelay)
            })
    }

    readTimes = () => {
        const tonClient2 = this.tonClient2
        const treasuryAddress = treasuryAddresses[this.network]
        clearTimeout(this.timeoutReadTimes)
        this.timeoutReadTimes = setTimeout(this.readTimes, updateTimesDelay)

        if (tonClient2 == null) {
            this.setTimes(undefined)
            return
        }

        // APIv4 does not support get methods that access network config, so use APIv2
        tonClient2
            .open(Treasury.createFromAddress(treasuryAddress))
            .getTimes()
            .then(this.setTimes)
            .catch(() => {
                clearTimeout(this.timeoutReadTimes)
                this.timeoutReadTimes = setTimeout(this.readTimes, retryDelay)
            })
    }

    readLastBlock = async () => {
        const tonClient4 = this.tonClient4
        const address = this.address
        clearTimeout(this.timeoutReadLastBlock)
        this.timeoutReadLastBlock = setTimeout(() => void this.readLastBlock(), updateLastBlockDelay)

        if (tonClient4 == null) {
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
            const value = await tonClient4.getLastBlock()
            const lastBlock = value.last.seqno
            const treasury = tonClient4.openAt(lastBlock, Treasury.createFromAddress(treasuryAddresses[this.network]))

            const readTreasuryState = treasury.getTreasuryState()

            const readTonBalance =
                address == null
                    ? undefined
                    : tonClient4
                          .getAccountLite(lastBlock, address)
                          .then((value: { account: { balance: { coins: string } } }) =>
                              BigInt(value.account.balance.coins),
                          )

            const readHtonWallet: Promise<[Address, OpenedContract<Wallet>, typeof this.htonWalletState]> | undefined =
                address == null
                    ? undefined
                    : (this.htonWalletAddress != null
                          ? Promise.resolve(this.htonWalletAddress)
                          : treasury.getWalletAddress(address)
                      ).then(async (htonWalletAddress) => {
                          const htonWallet = tonClient4.openAt(lastBlock, Wallet.createFromAddress(htonWalletAddress))
                          let htonWalletState: typeof this.htonWalletState
                          try {
                              htonWalletState = await htonWallet.getWalletState()
                          } catch {
                              htonWalletState = undefined
                          }
                          return [htonWalletAddress, htonWallet, htonWalletState]
                      })

            const parallel: [
                Promise<TreasuryConfig>,
                Promise<bigint>?,
                Promise<[Address, OpenedContract<Wallet>, typeof this.htonWalletState]>?,
            ] = [readTreasuryState, readTonBalance, readHtonWallet]
            const [treasuryState, tonBalance, hton] = await Promise.all(parallel)
            const [htonWalletAddress, htonWallet, htonWalletState] = hton ?? [undefined, undefined, undefined]

            runInAction(() => {
                this.treasury = treasury
                this.treasuryState = treasuryState
                this.tonBalance = tonBalance
                this.htonWalletAddress = htonWalletAddress
                this.htonWallet = htonWallet
                this.htonWalletState = htonWalletState
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
            let address: string
            let amount: string
            let payload: string
            if (this.isStakeTabActive) {
                address = this.treasury.address.toString()
                amount = (this.amountInNano + depositCoinsFee).toString()
                payload = beginCell()
                    .storeUint(op.depositCoins, 32)
                    .storeUint(0, 64)
                    .storeAddress(this.referrer)
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
                validUntil: Math.floor(Date.now() / 1000) + sendValidUntil,
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
            void this.tonConnectUI.connectWallet()
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
        if (this.referrer != null) {
            hash += '/referrer=' + this.referrer.toString({ testOnly: !this.isMainnet, bounceable: false })
        }
        if (this.activeTab !== defaultActiveTab) {
            hash += '/tab=' + this.activeTab
        }
        hash += '/'
        window.location.hash = hash
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

function formatEta(time: bigint): string {
    if (time > 0) {
        time += 5n * 60n // add 5 minutes as a gap for better estimation
    }
    const now = Math.floor(Date.now() / 1000)
    const seconds = Math.max(0, Number(time) - now)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor(seconds / 60) % 60
    const parts = []
    if (hours > 1) {
        parts.push(hours.toString() + ' hours')
    } else if (hours === 1) {
        parts.push('1 hour')
    }
    if (minutes > 1) {
        parts.push(minutes.toString() + ' minutes')
    } else if (minutes === 1) {
        parts.push('1 minute')
    }
    return parts.join(' ') || 'about a minute'
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}
