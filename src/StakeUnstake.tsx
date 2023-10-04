import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import tonLogo from './assets/ton.svg'
import htonLogo from './assets/hton.svg'
import clockLogo from './assets/clock.svg'
import questionLogo from './assets/question.svg'

interface Props {
    model: Model
}

const StakeUnstake = observer(({ model }: Props) => {
    let maxHeight = ' max-h-28'
    if (model.unstakingInProgressDetails != null || model.stakingInProgressDetails.length > 0) {
        maxHeight = ' max-h-32'
    }
    if (model.unstakingInProgressDetails != null && model.stakingInProgressDetails.length > 0) {
        maxHeight = ' max-h-36'
    }

    return (
        <div className='container mx-auto font-body text-brown'>
            <p className='my-8 text-center'>
                {model.isStakeTabActive
                    ? 'Stake TON and receive hTON while staking'
                    : 'Unstake hTON and receive TON and rewards'}
            </p>
            <div className='mx-auto my-8 w-max rounded-full bg-milky p-0.5'>
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
                        'transition-all motion-reduce:transition-none' +
                        (model.isWalletConnected ? maxHeight : ' max-h-0 overflow-hidden')
                    }
                >
                    <div className='mx-4 -mb-10 rounded-t-2xl bg-brown px-8 pb-10 pt-4 text-sm text-white'>
                        <div
                            className={
                                'relative flex flex-row flex-wrap' +
                                (model.unstakingInProgressDetails != null ? '' : ' hidden')
                            }
                        >
                            <p className='font-light opacity-70'>Unstaking in progress</p>
                            <img src={clockLogo} className='peer ml-1 w-4 opacity-70' />
                            <div className='absolute left-1/2 top-6 hidden -translate-x-1/2 rounded-lg bg-lightblue p-4 text-xs font-normal text-blue shadow-xl peer-hover:block'>
                                <p>
                                    {model.unstakingInProgressDetails?.estimated == null
                                        ? 'Expected in a moment'
                                        : 'Expected by ' + model.unstakingInProgressDetails.estimated}
                                </p>
                            </div>
                            <p className='ml-auto font-medium opacity-70'>{model.unstakingInProgressFormatted}</p>
                        </div>

                        <div className='flex flex-row flex-wrap'>
                            <p className='font-light'>TON balance</p>
                            <p className='ml-auto font-medium'>{model.tonBalanceFormatted}</p>
                        </div>

                        <div className='my-4 h-px bg-milky'></div>

                        <div
                            className={
                                'relative flex flex-row flex-wrap' +
                                (model.stakingInProgressDetails.length > 0 ? '' : ' hidden')
                            }
                        >
                            <p className='font-light opacity-70'>Staking in progress</p>
                            <img src={clockLogo} className='peer ml-1 w-4 opacity-70' />
                            <div className='absolute left-1/2 top-6 hidden -translate-x-1/2 rounded-lg bg-lightblue p-4 text-xs font-normal text-blue shadow-xl peer-hover:block'>
                                {model.stakingInProgressDetails.length === 1
                                    ? model.stakingInProgressDetails.map((value) => (
                                          <p key={'-' + value.estimated + value.amount}>
                                              {value.estimated == null
                                                  ? 'Expected in a moment'
                                                  : 'Expected by ' + value.estimated}
                                          </p>
                                      ))
                                    : model.stakingInProgressDetails.map((value) => (
                                          <p key={value.estimated + value.amount}>
                                              <b>{value.amount}</b>{' '}
                                              {value.estimated == null ? 'in a moment' : 'by' + value.estimated}
                                          </p>
                                      ))}
                            </div>
                            <p className='ml-auto font-medium opacity-70'>{model.stakingInProgressFormatted}</p>
                        </div>

                        <div className='flex flex-row flex-wrap pb-4'>
                            <p className='font-light'>hTON balance</p>
                            <p className='ml-auto font-medium'>{model.htonBalanceFormatted}</p>
                        </div>
                    </div>
                </div>

                <div className='mx-4 rounded-2xl bg-white p-8 shadow-sm'>
                    <p>{model.isStakeTabActive ? 'Stake' : 'Unstake'}</p>

                    <label>
                        <div
                            className={
                                'mb-8 mt-4 flex flex-row rounded-lg border border-milky p-4 focus-within:border-brown ' +
                                (model.isAmountValid ? '' : ' border-orange focus-within:border-orange')
                            }
                        >
                            <img src={model.isStakeTabActive ? tonLogo : htonLogo} className='w-7' />
                            <input
                                type='text'
                                inputMode='decimal'
                                placeholder='Amount'
                                size={1}
                                className={
                                    'h-full w-full flex-1 px-3 text-lg focus:outline-none' +
                                    (model.isAmountValid ? '' : ' text-orange')
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
                                    'rounded-lg bg-milky px-3 text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring focus:ring-blue active:bg-gray-300' +
                                    (model.isAmountValid
                                        ? ''
                                        : ' bg-orange text-white hover:bg-brown active:bg-gray-600')
                                }
                                onClick={() => {
                                    model.setAmountToMax()
                                }}
                            >
                                Max
                            </button>
                        </div>
                    </label>

                    <button
                        id='submit'
                        className='h-14 w-full rounded-2xl bg-orange text-lg font-medium text-white disabled:opacity-80'
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
                            <img src={questionLogo} className='peer ml-1 w-4' />
                            <p className='absolute left-1/2 top-6 hidden -translate-x-1/2 rounded-lg bg-lightblue p-4 text-xs font-normal text-blue shadow-xl peer-hover:block'>
                                This fee covers sending your transaction on TON network.
                            </p>
                            <p className='ml-auto'>{model.isStakeTabActive ? model.stakeFee : model.unstakeFee}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
})

export default StakeUnstake
