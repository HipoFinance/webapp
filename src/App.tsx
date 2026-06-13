import { observer } from 'mobx-react-lite'
import { Model } from './Model.ts'
import Home from './Home.tsx'
import Page404 from './Page404.tsx'
import { Routes, Route } from 'react-router-dom'
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
        <Routes>
            <Route path='/' element={<Home model={model} />} />
            <Route path='*' element={<Page404 />} />
        </Routes>
    )
})

export default App
