import { observer } from 'mobx-react-lite'
import { Model } from './Model'
import Header from './Header.tsx'
import OldWalletUpgrade from './OldWalletUpgrade.tsx'
import StakeUnstake from './StakeUnstake.tsx'
import Defi from './Defi.tsx'
import Reward from './Reward.tsx'
import Wait from './Wait.tsx'
import Stats from './Stats.tsx'
import Footer from './Footer.tsx'
import LoadingIndicator from './LoadingIndicator.tsx'
import ErrorDisplay from './ErrorDisplay.tsx'

interface Props {
    model: Model
}

const Home = observer(({ model }: Props) => {
    let page = (
        <>
            <OldWalletUpgrade model={model} />
            <StakeUnstake model={model} />
            <Wait model={model} />
            <Stats model={model} />
        </>
    )
    if (model.activePage === 'defi') {
        page = <Defi model={model} />
    } else if (model.activePage === 'reward') {
        page = <Reward model={model} />
    }

    return (
        <>
            <Header model={model} />
            {page}
            <Footer model={model} />
            <LoadingIndicator model={model} />
            <ErrorDisplay model={model} />
        </>
    )
})

export default Home
