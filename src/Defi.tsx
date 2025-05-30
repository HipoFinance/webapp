import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import dedust from './assets/dedust.png'
import ston from './assets/ston.png'
import tonco from './assets/tonco.svg'
import aquaUsd from './assets/aquausd.png'
import tonspace from './assets/tonspace.jpg'
import mtw from './assets/mytonwallet.webp'
// import evaa from './assets/evaa.svg'

interface Props {
    model: Model
}

const Referral = observer(({ model }: Props) => {
    return (
        <div className='mx-auto w-full max-w-screen-lg p-4 pb-32 font-body text-brown dark:text-dark-50'>
            <p className='px-8 pt-4 text-center text-3xl font-bold'>What Can I Do with hTON?</p>
            <p className='mx-auto my-8 max-w-[32rem] px-8 text-center text-xl'>
                Maximize the potential of your capital with hTON in TON DeFi protocols
            </p>

            <div className='m-8 mt-32 flex flex-col items-start gap-4 sm:flex-row'>
                <div className='flex-1 sm:max-w-64'>
                    <h3 className='py-4 text-2xl font-bold'>Swap on DEXs</h3>
                    <p className='my-4 text-lg'>hTON can be traded on DEXs for other tokens.</p>
                </div>
                <div className='flex w-full flex-1 flex-col flex-wrap items-center justify-center gap-4 md:flex-row'>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={dedust} className='mx-auto h-12' />
                        <p className='m-4 font-medium'>DeDust</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.dedustSwapUrl}
                            target='hipo_dedust'
                        >
                            Swap now
                        </a>
                    </div>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={ston} className='mx-auto h-12' />
                        <p className='m-4 font-medium'>STON.fi</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.stonSwapUrl}
                            target='hipo_ston'
                        >
                            Swap now
                        </a>
                    </div>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={tonco} className='mx-auto h-12' />
                        <p className='m-4 font-medium'>TONCO</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.toncoSwapUrl}
                            target='hipo_tonco'
                        >
                            Swap now
                        </a>
                    </div>
                </div>
            </div>

            <div className='m-8 mt-48 flex flex-col items-start gap-4 sm:flex-row'>
                <div className='flex-1 sm:max-w-64'>
                    <h3 className='py-4 text-2xl font-bold'>Provide Liquidity</h3>
                    <p className='my-4 text-lg'>Use hTON to provide liquidity on DEXs, earning fees, and reward.</p>
                </div>
                <div className='flex w-full flex-1 flex-col flex-wrap items-center justify-center gap-4 md:flex-row'>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={dedust} className='mx-auto h-12' />
                        <p className='m-4 font-medium'>DeDust</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.dedustPoolUrl}
                            target='hipo_dedust'
                        >
                            Earn now
                        </a>
                    </div>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={ston} className='mx-auto h-12' />
                        <p className='m-4 font-medium'>STON.fi</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.stonPoolUrl}
                            target='hipo_ston'
                        >
                            Earn now
                        </a>
                    </div>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={tonco} className='mx-auto h-12' />
                        <p className='m-4 font-medium'>TONCO</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.toncoPoolUrl}
                            target='hipo_tonco'
                        >
                            Earn now
                        </a>
                    </div>
                </div>
            </div>

            <div className='m-8 mt-48 flex flex-col items-start gap-4 sm:flex-row'>
                <div className='flex-1 sm:max-w-64'>
                    <h3 className='py-4 text-2xl font-bold'>Mint Stablecoin</h3>
                    <p className='my-4 text-lg'>Use hTON as collateral to mint stablecoins on TON.</p>
                </div>
                <div className='flex w-full flex-1 flex-col flex-wrap items-center justify-center gap-4 md:flex-row'>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={aquaUsd} className='mx-auto h-12' />
                        <p className='m-4 font-medium'>AquaUSD</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.aquaUsdUrl}
                            target='hipo_dedust'
                        >
                            Mint Now
                        </a>
                    </div>
                </div>
            </div>

            <div className='m-8 mt-48 flex flex-col items-start gap-4 sm:flex-row'>
                <div className='flex-1 sm:max-w-64'>
                    <h3 className='py-4 text-2xl font-bold'>Ton Wallets</h3>
                    <p className='my-4 text-lg'>Partner wallets supporting hTON and HPO.</p>
                </div>
                <div className='flex w-full flex-1 flex-col flex-wrap items-center justify-center gap-4 md:flex-row'>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={tonspace} className='mx-auto h-12' />
                        <p className='m-4 font-medium'>Ton Space</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.tonspaceUrl}
                            target='hipo_tonspace'
                        >
                            Use Now
                        </a>
                    </div>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={mtw} className='mx-auto h-12' />
                        <p className='m-4 whitespace-nowrap font-medium'>MyTonWallet</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.mtwUrl}
                            target='hipo_mtw'
                        >
                            Use Now
                        </a>
                    </div>
                </div>
            </div>

            {/* <div className='m-8 mt-48 flex flex-col items-start gap-4 sm:flex-row'>
                <div className='flex-1 sm:max-w-64'>
                    <h3 className='py-4 text-2xl font-bold'>Take a Loan</h3>
                    <p className='my-4 text-lg'>Use hTON as collateral for a loan.</p>
                </div>
                <div className='flex w-full flex-1 flex-col flex-wrap items-center justify-center gap-4 md:flex-row'>
                    <div className='flex w-44 flex-none flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center opacity-50 shadow-md dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                        <img src={evaa} className='mx-auto h-12' />
                        <p className='m-4 font-medium'>Evaa</p>
                        <a
                            className='mx-4 rounded-xl bg-orange p-2 text-white dark:text-dark-600'
                            href={model.evaaLoanUrl}
                            target='hipo_evaa'
                        >
                            Take now
                        </a>
                        Coming Soon
                    </div>
                </div>
            </div> */}
        </div>
    )
})

export default Referral
