import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import loading from './assets/loading.svg'
import loadingDark from './assets/loading-dark.svg'

interface Props {
    model: Model
}

const LoadingIndicator = observer(({ model }: Props) => {
    return (
        <div
            className={
                'pointer-events-none fixed bottom-20 right-5 z-50 w-10 rounded-full bg-dark-950 bg-opacity-20 dark:bg-opacity-70 sm:bottom-2' +
                (model.ongoingRequests > 0 ? '' : ' hidden')
            }
        >
            <img src={loading} className='h-10 animate-spin dark:hidden' />
            <img src={loadingDark} className='hidden h-10 animate-spin dark:block' />
        </div>
    )
})

export default LoadingIndicator
