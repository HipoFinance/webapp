import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import logo from './assets/logo.svg'
import loading from './assets/loading.svg'
import warning from './assets/warning.svg'

interface Props {
    model: Model
}

const Wait = observer(({ model }: Props) => {
    let img
    let heading
    let message
    let button
    if (model.waitForTransaction === 'wait') {
        img = <img src={loading} className='m-4 mx-auto animate-spin' />
        heading = <h1 className='text-center text-xl font-bold'>Finalizing your transaction</h1>
        message = <p className='mt-4 text-center'>Waiting for your transaction to be included in the next block.</p>
    } else if (model.waitForTransaction === 'timeout') {
        img = <img src={warning} className='m-4 mx-auto h-16' />
        heading = <h1 className='text-center text-xl font-bold'>Unable to check your transaction</h1>
        message = <p className='mt-4 text-center'>After many attempts, we could not find your transaction.</p>
        button = (
            <button
                className='mt-4 h-14 w-full rounded-2xl bg-orange text-lg font-medium text-white'
                onClick={() => {
                    model.setWaitForTransaction('no')
                }}
            >
                Okay
            </button>
        )
    } else if (model.waitForTransaction === 'done') {
        img = <img src={logo} className='m-4 mx-auto h-32' />
        message = <p className='mt-4 text-center'>Successfully {model.isStakeTabActive ? 'staked' : 'unstaked'}.</p>
        button = (
            <button
                className='mt-4 h-14 w-full rounded-2xl bg-orange text-lg font-medium text-white'
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
                    'bg-black fixed left-0 top-0 z-[1000] flex h-full w-full overflow-y-auto bg-opacity-40 p-8 text-brown'
                }
            >
                <div className='m-auto max-w-sm rounded-3xl bg-milky p-8 shadow-2xl'>
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
