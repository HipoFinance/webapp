import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import TestnetBadge from './TestnetBadge.tsx'
import logo from './assets/logo.svg'
import logoDark from './assets/logo-dark.svg'
import theme from './assets/theme.svg'
import themeDark from './assets/theme-dark.svg'
import pageStakeBrown from './assets/page-stake-brown.svg'
import pageStakeOrange from './assets/page-stake-orange.svg'
import pageStakeWhite from './assets/page-stake-white.svg'
import pageStakeBlack from './assets/page-stake-black.svg'
import pageDefiBrown from './assets/page-defi-brown.svg'
import pageDefiOrange from './assets/page-defi-orange.svg'
import pageDefiWhite from './assets/page-defi-white.svg'
import pageDefiBlack from './assets/page-defi-black.svg'
import pageReferralBrown from './assets/page-referral-brown.svg'
import pageReferralOrange from './assets/page-referral-orange.svg'
import pageReferralWhite from './assets/page-referral-white.svg'
import pageReferralBlack from './assets/page-referral-black.svg'

interface Props {
    model: Model
}

const Header = observer(({ model }: Props) => {
    return (
        <div className='mx-auto w-full max-w-screen-lg font-body text-brown dark:text-dark-50'>
            <div className='mx-4 flex flex-row items-center pt-4'>
                <img src={logo} className='-ml-4 -mr-3 h-20 dark:hidden' />
                <img src={logoDark} className='-ml-4 -mr-3 hidden h-20 dark:block' />

                <TestnetBadge model={model} />

                <ul className='fixed bottom-0 left-0 z-10 flex w-full select-none flex-row border-t border-c1 bg-milky text-sm font-thin dark:border-c2 dark:bg-choco sm:static sm:ml-2 sm:w-auto sm:border-0 sm:bg-transparent sm:dark:bg-transparent'>
                    <li
                        className={
                            'flex-1 cursor-pointer whitespace-nowrap pt-3 text-center sm:ml-4 sm:flex-none sm:pt-0' +
                            (model.activePage === 'stake' ? ' text-dark-600' : ' text-brown')
                        }
                        onClick={() => {
                            model.setActivePage('stake')
                        }}
                    >
                        <div className='flex flex-col items-center sm:flex-row sm:pl-2'>
                            <img
                                src={pageStakeBrown}
                                className={'h-4 dark:!hidden' + (model.activePage !== 'stake' ? ' block' : ' hidden')}
                            />
                            <img
                                src={pageStakeWhite}
                                className={
                                    'hidden h-4' + (model.activePage !== 'stake' ? ' dark:!block' : ' sm:dark:!block')
                                }
                            />
                            <img
                                src={pageStakeOrange}
                                className={'h-4 sm:hidden' + (model.activePage === 'stake' ? ' block' : ' hidden')}
                            />
                            <img
                                src={pageStakeBlack}
                                className={
                                    'hidden h-4' + (model.activePage === 'stake' ? ' dark:!hidden sm:block' : '')
                                }
                            />
                            <span className='p-2 dark:text-white'>Stake</span>
                        </div>
                        <div
                            className={
                                'mt-1 hidden h-1 rounded-full bg-orange' +
                                (model.activePage === 'stake' ? ' sm:!block' : '')
                            }
                        ></div>
                    </li>
                    <li
                        className={
                            'flex-1 cursor-pointer whitespace-nowrap pt-3 text-center sm:ml-4 sm:flex-none sm:pt-0' +
                            (model.activePage === 'defi' ? ' text-dark-600' : ' text-brown')
                        }
                        onClick={() => {
                            model.setActivePage('defi')
                        }}
                    >
                        <div className='flex flex-col items-center sm:flex-row sm:pl-2'>
                            <img
                                src={pageDefiBrown}
                                className={'h-4 dark:!hidden' + (model.activePage !== 'defi' ? ' block' : ' hidden')}
                            />
                            <img
                                src={pageDefiWhite}
                                className={
                                    'hidden h-4' + (model.activePage !== 'defi' ? ' dark:!block' : ' sm:dark:!block')
                                }
                            />
                            <img
                                src={pageDefiOrange}
                                className={'h-4 sm:hidden' + (model.activePage === 'defi' ? ' block' : ' hidden')}
                            />
                            <img
                                src={pageDefiBlack}
                                className={'hidden h-4' + (model.activePage === 'defi' ? ' dark:!hidden sm:block' : '')}
                            />
                            <span className='p-2 dark:text-white'>DeFi</span>
                        </div>
                        <div
                            className={
                                'mt-1 hidden h-1 rounded-full bg-orange' +
                                (model.activePage === 'defi' ? ' sm:!block' : '')
                            }
                        ></div>
                    </li>
                    <li
                        className={
                            'flex-1 cursor-pointer whitespace-nowrap pt-3 text-center sm:ml-4 sm:flex-none sm:pt-0' +
                            (model.activePage === 'referral' ? ' text-dark-600' : ' text-brown')
                        }
                        onClick={() => {
                            model.setActivePage('referral')
                        }}
                    >
                        <div className='flex flex-col items-center sm:flex-row sm:pl-2'>
                            <img
                                src={pageReferralBrown}
                                className={
                                    'h-4 dark:!hidden' + (model.activePage !== 'referral' ? ' block' : ' hidden')
                                }
                            />
                            <img
                                src={pageReferralWhite}
                                className={
                                    'hidden h-4' +
                                    (model.activePage !== 'referral' ? ' dark:!block' : ' sm:dark:!block')
                                }
                            />
                            <img
                                src={pageReferralOrange}
                                className={'h-4 sm:hidden' + (model.activePage === 'referral' ? ' block' : ' hidden')}
                            />
                            <img
                                src={pageReferralBlack}
                                className={
                                    'hidden h-4' + (model.activePage === 'referral' ? ' dark:!hidden sm:block' : '')
                                }
                            />
                            <span className='p-2 dark:text-white'>Referral</span>
                        </div>
                        <div
                            className={
                                'mt-1 hidden h-1 rounded-full bg-orange' +
                                (model.activePage === 'referral' ? ' sm:!block' : '')
                            }
                        ></div>
                    </li>
                </ul>

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
        </div>
    )
})

export default Header
