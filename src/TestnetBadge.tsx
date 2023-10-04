import { observer } from 'mobx-react-lite'
import { Model } from './Model'

interface Props {
    model: Model
}

const TestnetBadge = observer(({ model }: Props) => {
    return (
        <>
            <p className={'font-logo text-3xl text-orange' + (model.isMainnet ? '' : ' hidden min-[480px]:block')}>
                Hipo
            </p>
            <div
                className={
                    'h-fit rounded-full bg-orange px-3 py-1 text-sm capitalize text-white' +
                    (model.isMainnet ? ' hidden' : '')
                }
            >
                testnet
            </div>
        </>
    )
})

export default TestnetBadge
