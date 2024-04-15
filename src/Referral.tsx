import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import invite from './assets/invite.png'
import inviteDark from './assets/invite-dark.png'
import reward from './assets/reward.png'
import rewardDark from './assets/reward-dark.png'
import copy from './assets/copy.svg'
import invites from './assets/invites.svg'
import invitesDark from './assets/invites-dark.svg'
import staked from './assets/staked.svg'
import stakedDark from './assets/staked-dark.svg'
import earned from './assets/earned.svg'
import earnedDark from './assets/earned-dark.svg'

interface Props {
    model: Model
}

const Referral = observer(({ model }: Props) => {
    return (
        <div className='mx-auto w-full max-w-screen-lg p-4 pb-32 font-body text-brown dark:text-dark-50'>
            <p className='pt-4 text-center text-3xl font-bold'>Hipo Referral Program</p>
            <p className='my-8 text-center text-xl'>Earn Rewards by Sharing Hipo</p>

            <div className='my-8 flex-row items-center sm:flex'>
                <img src={invite} className='w-full dark:hidden sm:flex-1' />
                <img src={inviteDark} className='hidden w-full dark:block sm:flex-1' />
                <div className='p-8 sm:flex-1'>
                    <h3 className='py-4 text-2xl font-bold'>1. Invite Others</h3>
                    <p className='text-lg'>
                        Share your unique referral link with friends, family, and community members.
                    </p>
                </div>
            </div>

            <div className='my-8 flex-row-reverse items-center sm:flex'>
                <img src={reward} className='w-full dark:hidden sm:flex-1' />
                <img src={rewardDark} className='hidden w-full dark:block sm:flex-1' />
                <div className='p-8 sm:flex-1'>
                    <h3 className='py-4 text-2xl font-bold'>2. Earn Rewards</h3>
                    <p className='text-lg'>Receive 50% of the Hipo protocol fee for every successful referral.</p>
                </div>
            </div>

            {model.isWalletConnected || (
                <div className='mt-16 px-8'>
                    <p className='p-8 sm:text-center'>
                        Connect your TON wallet to access your referral link and track progress.
                    </p>
                    <button
                        className='mx-auto block h-14 w-full rounded-2xl bg-orange text-lg font-medium text-white dark:text-dark-600 sm:w-80'
                        onClick={(e) => {
                            model.connect()
                            const target = e.target as HTMLInputElement
                            target.blur()
                        }}
                    >
                        {model.buttonLabel}
                    </button>
                </div>
            )}

            {model.isWalletConnected && (
                <>
                    <div className='mt-20 px-8'>
                        <h3 className='my-8 text-center text-2xl font-bold'>Your Referral Link</h3>
                        <div className='mx-auto flex w-full flex-col items-center justify-center gap-4 sm:w-2/3 sm:flex-row'>
                            <input
                                className='w-full grow overflow-hidden text-ellipsis whitespace-nowrap rounded-2xl bg-white p-4 text-xs font-light shadow-lg dark:text-dark-600'
                                readOnly
                                onClick={(e) => {
                                    const target = e.target as HTMLInputElement
                                    target.select()
                                    model.copyReferralUrl()
                                }}
                                value={model.referralUrl}
                            />
                            <button
                                className='w-24 rounded-2xl bg-orange p-4 text-lg text-white dark:text-dark-600'
                                onClick={() => {
                                    model.copyReferralUrl()
                                }}
                            >
                                <img src={copy} className='mx-auto' />
                            </button>
                        </div>
                    </div>

                    <div className='mt-20 px-8'>
                        <h3 className='my-8 text-center text-2xl font-bold'>Track Your Progress</h3>
                        <div className='flex flex-col items-center justify-center gap-8 sm:flex-row sm:items-start'>
                            <div className='flex w-52 flex-1 flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md blur-[2px] dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                                <img src={invites} className='h-10 dark:hidden' />
                                <img src={invitesDark} className='hidden h-10 dark:block' />
                                <p className='my-2'>Number of Invites</p>
                                <h4 className='text-lg font-bold'>0 Users</h4>
                            </div>
                            <div className='flex w-52 flex-1 flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md blur-[2px] dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                                <img src={staked} className='h-10 dark:hidden' />
                                <img src={stakedDark} className='hidden h-10 dark:block' />
                                <p className='my-2'>Total Staked Amount</p>
                                <h4 className='text-lg font-bold'>0 TON</h4>
                            </div>
                            <div className='flex w-52 flex-1 flex-col rounded-2xl border border-dark-600 border-opacity-50 bg-milky bg-opacity-50 p-4 text-center shadow-md blur-[2px] dark:border-milky dark:border-opacity-50 dark:bg-dark-700'>
                                <img src={earned} className='h-10 dark:hidden' />
                                <img src={earnedDark} className='hidden h-10 dark:block' />
                                <p className='my-2'>Earned Revenue</p>
                                <h4 className='text-lg font-bold'>0 TON</h4>
                            </div>
                        </div>
                        <p className='m-8 text-center'>Coming Soon</p>
                    </div>
                </>
            )}
        </div>
    )
})

export default Referral
