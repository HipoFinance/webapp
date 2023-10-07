import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import logo from './assets/logo.svg'
import logoDark from './assets/logo-dark.svg'
import loading from './assets/loading.svg'
import loadingDark from './assets/loading-dark.svg'
import warning from './assets/warning.svg'
import warningDark from './assets/warning-dark.svg'

interface Props {
    model: Model
}

const Wait = observer(({ model }: Props) => {
    let img
    let heading
    let message
    let button
    if (model.waitForTransaction === 'wait') {
        img = (
            <div>
                <img src={loading} className='m-4 mx-auto animate-spin dark:hidden' />
                <img src={loadingDark} className='m-4 mx-auto hidden animate-spin dark:block' />
            </div>
        )
        heading = <h1 className='text-center text-xl font-bold'>Finalizing your transaction</h1>
        message = <p className='mt-4 text-center'>Awaiting the processing of your payment in the next block.</p>
    } else if (model.waitForTransaction === 'timeout') {
        img = (
            <div>
                <img src={warning} className='m-4 mx-auto h-16 dark:hidden' />
                <img src={warningDark} className='m-4 mx-auto hidden h-16 dark:block' />
            </div>
        )
        heading = <h1 className='text-center text-xl font-bold'>Cannot find your transaction</h1>
        message = <p className='mt-4 text-center'>Despite multiple attempts, we could not locate it.</p>
        button = (
            <button
                className='dark:text-dark-600 mt-4 h-14 w-full rounded-2xl bg-orange text-lg font-medium text-white'
                onClick={() => {
                    model.setWaitForTransaction('no')
                }}
            >
                Okay
            </button>
        )
    } else if (model.waitForTransaction === 'done') {
        img = (
            <div>
                <img src={logo} className='m-4 mx-auto h-32 dark:hidden' />
                <img src={logoDark} className='m-4 mx-auto hidden h-32 dark:block' />
            </div>
        )
        heading = (
            <h1 className='text-center text-xl font-bold'>
                Successfully {model.isStakeTabActive ? 'staked' : 'unstaked'}
            </h1>
        )
        button = (
            <button
                className='dark:text-dark-600 mt-4 h-14 w-full rounded-2xl bg-orange text-lg font-medium text-white'
                onClick={() => {
                    model.setWaitForTransaction('no')
                }}
                onKeyDown={(e) => {
                    if (e.key == 'Escape') {
                        const button = e.target as HTMLButtonElement
                        button.click()
                    }
                }}
                autoFocus
            >
                Okay
            </button>
        )
    }

    if (model.waitForTransaction !== 'no') {
        return (
            <div
                className={
                    'bg-black dark:text-dark-50 fixed left-0 top-0 z-[1000] flex h-full w-full overflow-y-auto bg-opacity-40 p-8 text-brown'
                }
            >
                <div className='dark:bg-dark-700 m-auto w-96 max-w-sm rounded-3xl bg-milky p-8 shadow-2xl'>
                    {img}
                    {heading}
                    {message}
                    {button}
                </div>
            </div>
        )
    }
})

export default Wait
