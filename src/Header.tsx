import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import TestnetBadge from './TestnetBadge.tsx'
import logoUrl from './assets/logo.svg'

interface Props {
    model: Model
}

const Header = observer(({ model }: Props) => {
    return (
        <div className='container mx-auto font-body text-brown'>
            <div className='mx-4 flex flex-row items-center gap-4 pt-4'>
                <img src={logoUrl} className='-ml-4 -mr-3 h-20' />

                <TestnetBadge model={model} />

                <div id='ton-connect-button' className='ml-auto min-w-max'></div>
            </div>

            <p className='pt-4 text-center text-3xl font-bold'>Hipo</p>
        </div>
    )
})

export default Header
