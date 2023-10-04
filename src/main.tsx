import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Model } from './Model.ts'

const model = new Model('testnet')
model.init('ton-connect-button')

document.onvisibilitychange = () => {
    if (document.hidden) {
        model.pause()
    } else {
        model.resume()
    }
}

ReactDOM.createRoot(document.querySelector('#root') ?? document.body).render(
    <React.StrictMode>
        <App model={model} />
    </React.StrictMode>,
)
