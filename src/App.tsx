import { observer } from 'mobx-react-lite'
import { Model } from './Model.ts'
import Header from './Header.tsx'
import OldWalletUpgrade from './OldWalletUpgrade.tsx'
import StakeUnstake from './StakeUnstake.tsx'
import Wait from './Wait.tsx'
import Stats from './Stats.tsx'
import Footer from './Footer.tsx'
import LoadingIndicator from './LoadingIndicator.tsx'
import ErrorDisplay from './ErrorDisplay.tsx'
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/700.css'
import '@fontsource/eczar/800.css'

interface Props {
    model: Model
}

const App = observer(({ model }: Props) => {
    return (
        <>
            <Header model={model} />
            <OldWalletUpgrade model={model} />
            <StakeUnstake model={model} />
            <Wait model={model} />
            <Stats model={model} />
            <Footer model={model} />
            <LoadingIndicator model={model} />
            <ErrorDisplay model={model} />
        </>
    )
})

export default App
