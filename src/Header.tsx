import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import TestnetBadge from './TestnetBadge.tsx'
import logo from './assets/logo.svg'
import logoDark from './assets/logo-dark.svg'
import theme from './assets/theme.svg'
import themeDark from './assets/theme-dark.svg'

interface Props {
    model: Model
}

const Header = observer(({ model }: Props) => {
    return (
        <div className='dark:text-dark-50 container mx-auto font-body text-brown'>
            <div className='mx-4 flex flex-row items-center gap-4 pt-4'>
                <img src={logo} className='-ml-4 -mr-3 h-20 dark:hidden' />
                <img src={logoDark} className='-ml-4 -mr-3 hidden h-20 dark:block' />

                <TestnetBadge model={model} />

                <div className='ml-auto'>
                    <img
                        src={themeDark}
                        onClick={() => {
                            model.setDark(false)
                        }}
                        className='hidden h-6 cursor-pointer dark:block'
                    />
                    <img
                        src={theme}
                        onClick={() => {
                            model.setDark(true)
                        }}
                        className='m-1 block h-4 cursor-pointer dark:hidden'
                    />
                </div>
                <div id='ton-connect-button' className='min-w-max'></div>
            </div>

            <p className='pt-4 text-center text-3xl font-bold'>Hipo</p>
        </div>
    )
})

export default Header
