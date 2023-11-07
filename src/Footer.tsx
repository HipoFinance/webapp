import { observer } from 'mobx-react-lite'
import { Model } from './Model'

interface Props {
    model: Model
}

const Footer = observer(({ model }: Props) => {
    return (
        <div className='mt-auto bg-brown font-body text-white dark:bg-dark-900 dark:text-dark-50'>
            <div className='mx-auto w-full max-w-screen-lg pb-16 pt-8'>
                <div className='grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4'>
                    <div className='m-8'>
                        <h3 className='text-lg font-bold'>Social</h3>
                        <a className='my-4 block' href='https://t.me/HipoFinance' target='hipo_telegram'>
                            Telegram
                        </a>
                        <a className='my-4 block' href='https://twitter.com/hipofinance' target='hipo_twitter'>
                            Twitter
                        </a>
                    </div>

                    <div className='m-8'>
                        <h3 className='text-lg font-bold'>Community</h3>
                        <a className='my-4 block' href='https://t.me/hipo_chat' target='hipo_chat'>
                            Hipo Chat
                        </a>
                        <a className='my-4 block' href='https://t.me/Hipo_hub' target='hipo_hub'>
                            Hipo Hub
                        </a>
                    </div>

                    <div className='m-8'>
                        <h3 className='text-lg font-bold'>Docs</h3>
                        <a className='my-4 block' href='https://github.com/HipoFinance' target='hipo_github'>
                            GitHub
                        </a>
                        <a className='my-4 block' href='https://docs.hipo.finance/' target='hipo_docs'>
                            Documentation
                        </a>
                    </div>

                    <div className='m-8'>
                        <h3 className='text-lg font-bold'>About</h3>
                        <a className='my-4 block' href='https://hipo.finance/#HowHipoWorks' target='hipo_how'>
                            How Hipo Works?
                        </a>
                        <a className='my-4 block' href='https://hipo.finance/#audit' target='hipo_audits'>
                            Audits
                        </a>
                        <a className='my-4 block' href='https://hipo.finance/#roadmap' target='hipo_roadmap'>
                            Roadmap
                        </a>
                        <a className='my-4 block' href='https://hipo.finance/#WhyHipo' target='hipo_why'>
                            Why Choose Hipo?
                        </a>
                    </div>
                </div>

                <p className='mx-8 mt-16 select-none font-logo text-4xl dark:text-orange' onClick={model.switchNetwork}>
                    Hipo
                </p>

                <div className='mx-8 my-4 h-1 rounded bg-orange'></div>

                <p className='text-center text-xs opacity-40'>Copyright 2023, All Rights Reserved</p>
            </div>
        </div>
    )
})

export default Footer
