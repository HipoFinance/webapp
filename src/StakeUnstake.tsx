import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import ton from './assets/ton.svg'
import hton from './assets/hton.svg'
import question from './assets/question.svg'
import questionDark from './assets/question-dark.svg'

interface Props {
    model: Model
}

const StakeUnstake = observer(({ model }: Props) => {
    return (
        <div className='mx-auto w-full max-w-screen-lg font-body text-brown dark:text-dark-50'>
            <p className='pt-4 text-center text-3xl font-bold'>Hipo</p>
            <p className='my-8 text-center'>
                {model.isStakeTabActive
                    ? 'Stake TON and receive hTON while staking'
                    : 'Unstake hTON and receive TON and rewards'}
            </p>

            <div className='dark:bg-tabbar mx-auto my-8 w-max rounded-full bg-milky p-0.5 dark:bg-dark-400 dark:text-white'>
                <ul
                    className={
                        'tab-bar relative flex select-none flex-nowrap' +
                        (model.isStakeTabActive ? ' stake' : ' unstake')
                    }
                >
                    <li
                        className='z-[1] m-1 inline-block w-36 cursor-pointer rounded-full py-1 text-center'
                        onClick={() => {
                            model.setActiveTab('stake')
                        }}
                    >
                        Stake
                    </li>
                    <li
                        className='z-[1] m-1 inline-block w-36 cursor-pointer rounded-full py-1 text-center'
                        onClick={() => {
                            model.setActiveTab('unstake')
                        }}
                    >
                        Unstake
                    </li>
                </ul>
            </div>

            <div className='mx-auto mb-12 mt-8 max-w-lg'>
                <div
                    className={
                        'overflow-hidden transition-all duration-700 motion-reduce:transition-none' +
                        (model.isWalletConnected ? ' max-h-[100rem]' : ' max-h-0')
                    }
                >
                    <div className='mx-4 rounded-t-2xl bg-brown px-8 pb-12 pt-4 text-sm text-white dark:bg-dark-600 dark:text-dark-50'>
                        <div className='flex flex-row flex-wrap'>
                            <p className='font-light'>TON balance</p>
                            <p className='ml-auto font-medium'>{model.tonBalanceFormatted}</p>
                        </div>

                        {model.stakingInProgressDetails.map((value) => (
                            <div key={value.estimated + value.amount} className='flex flex-row flex-wrap'>
                                <p className='font-light opacity-70'>
                                    {value.estimated == null
                                        ? 'In progress'
                                        : 'In progress, done by ' + value.estimated}
                                </p>
                                <p className='ml-auto font-medium opacity-70'>{value.amount}</p>
                            </div>
                        ))}

                        <div className='my-4 h-px bg-white opacity-40'></div>

                        <div className='flex flex-row flex-wrap'>
                            <p className='font-light'>hTON balance</p>
                            <p className='ml-auto font-medium'>{model.htonBalanceFormatted}</p>
                        </div>

                        <div
                            className={
                                'flex flex-row flex-wrap' + (model.unstakingInProgressDetails != null ? '' : ' hidden')
                            }
                        >
                            <p className='font-light opacity-70'>
                                {model.unstakingInProgressDetails?.estimated == null
                                    ? 'In progress'
                                    : 'In progress, done by ' + model.unstakingInProgressDetails.estimated}
                            </p>
                            <p className='ml-auto font-medium opacity-70'>{model.unstakingInProgressFormatted}</p>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        'mx-4 rounded-2xl bg-white p-8 shadow-sm dark:bg-dark-700' +
                        (model.isWalletConnected ? ' -mt-8' : '')
                    }
                >
                    <p>{model.isStakeTabActive ? 'Stake' : 'Unstake'}</p>

                    <label>
                        <div
                            className={
                                'mb-8 mt-4 flex flex-row rounded-lg border border-milky p-4 focus-within:border-brown dark:border-dark-900 dark:bg-dark-900 ' +
                                (model.isAmountValid
                                    ? ''
                                    : ' border-orange focus-within:border-orange dark:border-orange dark:focus-within:border-orange')
                            }
                        >
                            <img src={ton} className={'w-7' + (model.isStakeTabActive ? '' : ' hidden')} />
                            <img src={hton} className={'w-7' + (model.isStakeTabActive ? ' hidden' : '')} />
                            <input
                                type='text'
                                inputMode='decimal'
                                placeholder='Amount'
                                size={1}
                                className={
                                    'h-full w-full flex-1 px-3 text-lg focus:outline-none dark:bg-dark-900 dark:text-dark-50' +
                                    (model.isAmountValid ? '' : ' text-orange dark:text-orange')
                                }
                                value={model.amount}
                                onInput={(e) => {
                                    const target = e.target as HTMLInputElement
                                    model.setAmount(target.value)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && model.isButtonEnabled) {
                                        const button = document.querySelector<HTMLInputElement>('#submit')
                                        if (button != null) {
                                            button.click()
                                            const target = e.target as HTMLInputElement
                                            target.blur()
                                        }
                                    }
                                }}
                            />
                            <button
                                className={
                                    'rounded-lg bg-milky px-3 text-xs hover:bg-gray-200 focus:outline-none active:bg-gray-300 dark:text-dark-600' +
                                    (model.isAmountValid
                                        ? ''
                                        : ' bg-orange text-white hover:!bg-brown active:!bg-dark-600 dark:hover:text-dark-50')
                                }
                                onClick={model.setAmountToMax}
                            >
                                Max
                            </button>
                        </div>
                    </label>

                    <button
                        id='submit'
                        className='h-14 w-full rounded-2xl bg-orange text-lg font-medium text-white disabled:opacity-80 dark:text-dark-600'
                        disabled={!model.isButtonEnabled}
                        onClick={(e) => {
                            if (model.isWalletConnected) {
                                model.send()
                            } else {
                                model.connect()
                            }
                            const target = e.target as HTMLInputElement
                            target.blur()
                        }}
                    >
                        {model.buttonLabel}
                    </button>

                    <div className='mt-12 text-sm font-medium'>
                        <div className='my-4 flex flex-row flex-wrap'>
                            <p>You will receive</p>
                            <p className='ml-auto'>{model.youWillReceive}</p>
                        </div>
                        <div className='my-4 flex flex-row flex-wrap'>
                            <p>Exchange rate</p>
                            <p className='ml-auto'>{model.exchangeRateFormatted}</p>
                        </div>
                        <div className='relative my-4 flex flex-row flex-wrap'>
                            <p>Transaction cost</p>
                            <img src={question} className='peer ml-1 w-4 dark:hidden' />
                            <img src={questionDark} className='peer ml-1 hidden w-4 dark:block' />
                            <p className='absolute left-1/3 top-6 z-10 hidden -translate-x-1/4 rounded-lg bg-lightblue p-4 text-xs font-normal text-blue shadow-xl peer-hover:block'>
                                This fee covers sending your transaction on TON network.
                            </p>
                            <p className='ml-auto'>
                                {model.isStakeTabActive
                                    ? model.averageStakeFeeFormatted
                                    : model.averageUnstakeFeeFormatted}
                            </p>
                        </div>
                        <div className='relative my-4 flex flex-row flex-wrap'>
                            <p>Estimated time</p>
                            <img src={question} className='peer ml-1 w-4 dark:hidden' />
                            <img src={questionDark} className='peer ml-1 hidden w-4 dark:block' />
                            <p className='absolute left-1/3 top-6 z-10 hidden -translate-x-1/4 rounded-lg bg-lightblue p-4 text-xs font-normal text-blue shadow-xl peer-hover:block'>
                                When you will receive your {model.isStakeTabActive ? 'hTON' : 'TON'} if you{' '}
                                {model.isStakeTabActive ? 'stake' : 'unstake'} now.
                            </p>
                            <p className='ml-auto'>{model.isStakeTabActive ? model.stakeEta : model.unstakeEta}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
})

export default StakeUnstake
