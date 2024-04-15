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
            <div className='mx-auto w-full max-w-screen-lg justify-center px-8 py-8 sm:flex sm:flex-row-reverse sm:items-start sm:px-0'>
                <div className='grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4'>
                    <div className='mx-8 my-4'>
                        <h3 className='font-bold text-orange dark:text-brown'>Social</h3>
                        <a className='my-4 block text-sm' href='https://t.me/HipoFinance' target='hipo_telegram'>
                            Telegram
                        </a>
                        <a className='my-4 block text-sm' href='https://twitter.com/hipofinance' target='hipo_twitter'>
                            Twitter
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
                        <a className='my-4 block text-sm' href='https://hipo.finance/#audit' target='hipo_audits'>
                            Audits
                        </a>
                        <a className='my-4 block text-sm' href='https://github.com/HipoFinance' target='hipo_github'>
                            GitHub
                        </a>
                        <a className='my-4 block text-sm' href='https://docs.hipo.finance/' target='hipo_docs'>
                            Documentation
                        </a>
                    </div>

                    <div className='mx-8 my-4'>
                        <h3 className='font-bold text-orange dark:text-brown'>About</h3>
                        <a className='my-4 block text-sm' href='https://hipo.finance/#roadmap' target='hipo_roadmap'>
                            Roadmap
                        </a>
                        <a className='my-4 block text-sm' href='https://hipo.finance/#HowHipoWorks' target='hipo_how'>
                            How Hipo Works?
                        </a>
                        <a className='my-4 block text-sm' href='https://hipo.finance/#WhyHipo' target='hipo_why'>
                            Why Choose Hipo?
                        </a>
                    </div>
                </div>

                <div
                    className='mx-8 my-8 flex select-none flex-row items-center gap-4 pb-16 font-logo text-2xl dark:text-orange'
                    onClick={model.switchNetwork}
                >
                    <img src={logo} className='-ml-4 -mr-3 h-20 dark:hidden' />
                    <img src={logoDark} className='-ml-4 -mr-3 hidden h-20 dark:block' />
                    <p>Hipo</p>
                </div>
            </div>
        </div>
    )
})

export default Footer
