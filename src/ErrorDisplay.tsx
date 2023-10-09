import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import error from './assets/error.svg'
import errorDark from './assets/error-dark.svg'

interface Props {
    model: Model
}

const ErrorDisplay = observer(({ model }: Props) => {
    return (
        <div
            className={
                'fixed bottom-2 left-6 flex max-w-screen-sm rounded-2xl bg-orange p-2 text-white drop-shadow dark:text-dark-600' +
                (model.errorMessage === '' ? ' hidden' : '')
            }
        >
            <img src={error} className='h-6 dark:hidden' />
            <img src={errorDark} className='hidden h-6 dark:block' />
            <p className='mx-1'>{model.errorMessage}</p>
        </div>
    )
})

export default ErrorDisplay
