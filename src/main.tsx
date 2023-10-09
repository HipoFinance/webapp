import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Model } from './Model.ts'
import '@twa-dev/sdk'
import './index.css'

const model = new Model('testnet')
model.init('ton-connect-button')

ReactDOM.createRoot(document.querySelector('#root') ?? document.body).render(
    <React.StrictMode>
        <App model={model} />
    </React.StrictMode>,
)
