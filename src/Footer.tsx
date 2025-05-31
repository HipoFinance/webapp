import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import logo from './assets/logo.svg'
import logoDark from './assets/logo-dark.svg'

interface Props {
    model: Model
}

const Footer = observer(({ model }: Props) => {
    return (
        <div className='mt-auto bg-milky font-body text-brown dark:bg-dark-900 dark:text-dark-50'>
            <div className='mx-auto flex w-full max-w-screen-lg flex-col justify-center px-8 py-8 sm:flex sm:flex-row-reverse sm:items-start sm:px-0'>
                <div className='mx-auto flex flex-row sm:flex-wrap'>
                    <div className='mx-8 my-4'>
                        <h3 className='font-bold text-orange dark:text-brown'>Social</h3>
                        <a className='my-4 block text-sm' href='https://t.me/HipoFinance' target='hipo_telegram'>
                            Telegram
                        </a>
                        <a className='my-4 block text-sm' href='https://twitter.com/hipofinance' target='hipo_twitter'>
                            Twitter
                        </a>
                        <a
                            className='my-4 block text-sm'
                            href='https://www.youtube.com/@HipoFinance'
                            target='hipo_youtube'
                        >
                            YouTube
                        </a>
                        <a className='my-4 block text-sm' href='https://medium.com/@hipofinance' target='hipo_blog'>
                            Blog
                        </a>
                    </div>

                    <div className='mx-8 my-4'>
                        <h3 className='font-bold text-orange dark:text-brown'>Community</h3>
                        <a className='my-4 block text-sm' href='https://t.me/hipo_chat' target='hipo_chat'>
                            Hipo Chat
                        </a>
                        <a className='my-4 block text-sm' href='https://t.me/Hipo_hub' target='hipo_hub'>
                            Hipo Hub
                        </a>
                    </div>

                    <div className='mx-8 my-4'>
                        <h3 className='font-bold text-orange dark:text-brown'>Docs</h3>
                        <a className='my-4 block text-sm' href='https://github.com/HipoFinance' target='hipo_github'>
                            GitHub
                        </a>
                        <a className='my-4 block text-sm' href='https://docs.hipo.finance/' target='hipo_docs'>
                            Documentation
                        </a>
                        <a className='my-4 block text-sm' href='https://hpo.hipo.finance/' target='hipo_hpo'>
                            HPO
                        </a>
                    </div>
                </div>

                <div className='mx-auto flex max-w-96 flex-col gap-4 px-8 pb-16 sm:w-1/2'>
                    <div
                        className='flex select-none flex-row items-center gap-4 font-logo text-2xl dark:text-orange'
                        onClick={model.switchNetwork}
                    >
                        <img src={logo} className='-ml-4 -mr-3 h-20 dark:hidden' />
                        <img src={logoDark} className='-ml-4 -mr-3 hidden h-20 dark:block' />
                        <p>Hipo</p>
                    </div>
                    <p>
                        Hipo is an open-source liquid staking protocol with one of the most engaged communities on TON.
                    </p>
                </div>
            </div>
        </div>
    )
})

export default Footer
