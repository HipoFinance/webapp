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
                'pointer-events-none fixed bottom-2 right-5 w-8 rounded-2xl bg-dark-950 bg-opacity-30' +
                (model.ongoingRequests > 0 ? '' : ' hidden')
            }
        >
            <img src={loading} className='animate-spin dark:hidden' />
            <img src={loadingDark} className='hidden animate-spin dark:block' />
        </div>
    )
})

export default LoadingIndicator
