import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import question from './assets/question.svg'
import questionDark from './assets/question-dark.svg'

interface Props {
    model: Model
}

const Stats = observer(({ model }: Props) => {
    return (
        <div className='mx-auto mb-16 w-full max-w-screen-lg font-body text-brown dark:text-dark-50'>
            <div className='mx-auto flex max-w-lg flex-row items-center px-4'>
                <p className='text-lg font-bold'>Hipo statistics</p>
                <a href={model.explorerHref} target='hipo_explorer' className='ml-auto text-xs font-light text-blue'>
                    TON Explorer
                </a>
            </div>

            <div className='mx-auto max-w-lg text-sm font-medium'>
                <div className='m-4 rounded-2xl bg-white p-8 shadow-sm dark:bg-dark-800'>
                    <div className='relative my-4 flex flex-row'>
                        <p>APY</p>
                        <img src={question} className='peer ml-1 w-4 dark:hidden' />
                        <img src={questionDark} className='peer ml-1 hidden w-4 dark:block' />
                        <p className='absolute left-1/3 top-6 z-10 hidden -translate-x-1/4 rounded-lg bg-lightblue p-4 text-xs font-normal text-blue shadow-xl peer-hover:block'>
                            Your yearly earnings based on recent staking rewards.
                        </p>
                        <p className='ml-auto'>{model.apyFormatted}</p>
                    </div>
                    <div className='relative my-4 flex flex-row'>
                        <p>Protocol fee</p>
                        <img src={question} className='peer ml-1 w-4 dark:hidden' />
                        <img src={questionDark} className='peer ml-1 hidden w-4 dark:block' />
                        <p className='absolute left-1/3 top-6 z-10 hidden -translate-x-1/4 rounded-lg bg-lightblue p-4 text-xs font-normal text-blue shadow-xl peer-hover:block'>
                            This fee is subtracted from generated validator rewards, NOT your staked amount.
                        </p>
                        <p className='ml-auto'>{model.protocolFee}</p>
                    </div>
                    <div className='my-4 flex flex-row'>
                        <p>Currently staked</p>
                        <p className='ml-auto'>{model.currentlyStaked}</p>
                    </div>
                    <div className='my-4 flex flex-row justify-center'>
                        <p>
                            <a href='https://stats.hipo.finance' className='text-blue' target='hipo_stats'>
                                More Stats
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
})

export default Stats
