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
            <div className='mx-4 flex flex-row items-center pt-4'>
                <img src={logo} className='-ml-4 -mr-3 h-20 dark:hidden' />
                <img src={logoDark} className='-ml-4 -mr-3 hidden h-20 dark:block' />

                <TestnetBadge model={model} />

                <div className='ml-auto'>
                    <img
                        src={theme}
                        onClick={() => {
                            model.setDark(true)
                        }}
                        className='mr-3 block h-4 cursor-pointer dark:hidden'
                    />
                    <img
                        src={themeDark}
                        onClick={() => {
                            model.setDark(false)
                        }}
                        className='mr-2 hidden h-6 cursor-pointer dark:block'
                    />
                </div>
                <div id='ton-connect-button' className='min-w-max'></div>
            </div>

            <p className='pt-4 text-center text-3xl font-bold'>Hipo</p>
        </div>
    )
})

export default Header
