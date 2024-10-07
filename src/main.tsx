import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Model } from './Model.ts'
import '@twa-dev/sdk'
import './index.css'

if (self === top) {
    const model = new Model()
    model.init()

    ReactDOM.createRoot(document.querySelector('#root') ?? document.body).render(
        <React.StrictMode>
            <App model={model} />
        </React.StrictMode>,
    )
} else {
    console.error('Inside a frame')
}
