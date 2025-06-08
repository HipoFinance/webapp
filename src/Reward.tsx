import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import loading from './assets/loading.svg'
import loadingDark from './assets/loading-dark.svg'
import stakingRewards from './assets/staking-rewards.webp'
import ton from './assets/ton.svg'

interface Props {
    model: Model
}

const Referral = observer(({ model }: Props) => {
    return (
        <div className='mx-auto w-full max-w-screen-lg p-4 pb-32 font-body text-brown dark:text-dark-50'>
            <p className='px-8 pt-4 text-center text-3xl font-bold'>Staking Rewards</p>
            <p className='mb-4 mt-2 px-8 text-center'>Track your hTON rewards.</p>

            {model.isWalletConnected || (
                <div className='mx-auto mt-4 max-w-md rounded-xl bg-white shadow-md dark:bg-dark-700'>
                    <div className='mx-auto flex max-w-sm flex-col gap-8 p-8'>
                        <p className='text-center'>
                            Connect your TON wallet to view your <b className='font-bold'>staking rewards</b>.
                        </p>
                        <img src={stakingRewards} className='h-36 object-contain' />
                        <button
                            className='mx-auto block h-14 w-full rounded-2xl bg-orange text-lg font-medium text-white dark:text-dark-600 sm:w-80'
                            onClick={(e) => {
                                model.connect()
                                const target = e.target as HTMLInputElement
                                target.blur()
                            }}
                        >
                            {model.buttonLabel}
                        </button>
                    </div>
                </div>
            )}

            {model.isWalletConnected && (
                <>
                    <div className='mx-auto mb-4 flex max-w-md flex-col rounded-xl bg-white p-8 text-sm shadow-md dark:bg-dark-700'>
                        <h3 className='mb-2 font-bold'>Current Balance</h3>
                        <div className='flex flex-row gap-1'>
                            <p className=''>{model.htonBalanceFormatted}</p>
                            <p className='text-gray-400'>{model.htonBalanceInTon}</p>
                            <p>&nbsp;</p>
                        </div>
                        <hr className='my-4' />
                        <h3 className='mb-2 font-bold'>Balance After a Year</h3>
                        <div className='flex flex-row gap-1'>
                            <p className=''>{model.htonBalanceInTonAfterOneYear}</p>
                            <p>&nbsp;</p>
                        </div>
                        <hr className='my-4' />
                        <h3 className='mb-2 font-bold'>Total Profit</h3>
                        <div className='flex flex-row gap-1'>
                            <p className=''>{model.profitAfterOneYear}</p>
                            <p>&nbsp;</p>
                        </div>
                    </div>

                    {!(model.rewardsState.state === 'done' && model.rewardsState.rewards.length === 0) && (
                        <div className='mx-auto mb-4 flex max-w-md flex-col rounded-xl bg-white p-8 shadow-md dark:bg-dark-700'>
                            <h3 className='mb-4 font-bold'>Earned Rewards</h3>

                            {model.rewardsState.rewards.map((reward, i) => (
                                <>
                                    <div className='my-4 flex w-full flex-row items-center gap-4 text-sm' key={i}>
                                        <img src={ton} className='h-8' />
                                        <div className='flex flex-col items-start'>
                                            <p className=''>Rewards</p>
                                            <p
                                                className='text-gray-500 dark:text-gray-300'
                                                title={reward.time.toLocaleString(navigator.language, {
                                                    year: 'numeric',
                                                    month: 'numeric',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false,
                                                })}
                                            >
                                                {reward.time.toLocaleString(navigator.language, {
                                                    month: 'long',
                                                    day: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <div className='ml-auto flex flex-col items-end'>
                                            <p className='text-green-600'>+{reward.tonReward}</p>
                                            <p>TON</p>
                                        </div>
                                    </div>
                                    <hr className='ml-10' />
                                </>
                            ))}

                            <div className='mt-8 flex flex-row place-content-center items-center gap-1'>
                                {model.rewardsState.state === 'loading' && (
                                    <>
                                        <img src={loading} className='m-2 h-8 animate-spin dark:hidden' />
                                        <img src={loadingDark} className='m-2 hidden h-8 animate-spin dark:block' />
                                    </>
                                )}
                                {['error', 'more'].includes(model.rewardsState.state) && (
                                    <button
                                        onClick={model.loadMoreRewards}
                                        className='rounded-2xl bg-orange px-8 py-3 font-medium text-white dark:text-dark-600'
                                    >
                                        Load More
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {model.rewardsState.state === 'done' && model.rewardsState.rewards.length === 0 && (
                        <div className='mx-auto flex max-w-md flex-col gap-8 rounded-xl bg-white p-8 text-sm shadow-md dark:bg-dark-700'>
                            <p className='text-center'>
                                Your first reward will be credited within <b className='font-bold'>36 hours</b>.
                            </p>
                            <img src={stakingRewards} className='h-36 object-contain' />
                        </div>
                    )}
                </>
            )}
        </div>
    )
})

export default Referral
