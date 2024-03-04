import { observer } from 'mobx-react-lite'
import { Model } from './Model'

interface Props {
    model: Model
}

const OldWalletUpgrade = observer(({ model }: Props) => {
    if (model.oldWalletTokens != null && model.oldWalletTokens > 0n) {
        return (
            <div className='mx-auto flex w-full max-w-screen-lg flex-col items-center font-body text-brown'>
                <div className='bg-attention dark:bg-attentiondark m-4 flex max-w-2xl flex-col items-center rounded-2xl p-4 shadow-sm'>
                    <h3 className='my-4 text-xl font-bold'>Upgrade to Hipo Version 2</h3>
                    <p className='max-w-xl px-4 py-2'>
                        Press the &quot;Upgrade&quot; button below to automatically unstake from the old version and
                        stake in the new version.
                    </p>
                    <p className='max-w-xl px-4 py-2'>
                        You have <b>{model.oldWalletTokensFormatted}</b> in the old version. After upgrading,
                        you&apos;ll receive <b>{model.newWalletTokensFormatted}</b> in the new version.
                    </p>
                    <button
                        className='my-4 rounded-2xl bg-orange px-16 py-2 text-lg font-medium text-white dark:text-dark-600'
                        onClick={model.upgradeOldWallet}
                    >
                        Upgrade
                    </button>
                </div>
            </div>
        )
    }
})

export default OldWalletUpgrade
