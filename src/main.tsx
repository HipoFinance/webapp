import './polyfills.ts'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Model } from './Model.ts'
import { BrowserRouter } from 'react-router-dom'
import '@twa-dev/sdk'
import './lib/mtw-tonconnect-patch.js'
import './index.css'

if (self === top) {
    const model = new Model()
    model.init()

    // This is a workaround for customizing 404 page using typescript/tailwind.
    //
    // The problem:
    // GitHub Page service shows it's default 404 error page, or our custom page at
    // /public/404.html address. It does not redirect the unknown url to our app, so
    // the app cannot handle 404 itself.
    //
    // The solution:
    // A 404.html file is put in /public folder. So GitHub Pages will copy it in
    // 'dist' folder. In 404.html page, a session variable named 'redirect' keeps
    // the whole url and then replace the url by the service root ('/'). So the request
    // is received here below, and is sent to BrowserRouter element which handles the
    // 404 error by our custom page.

    const redirect = sessionStorage.getItem('redirect')

    if (redirect) {
        sessionStorage.removeItem('redirect')
        window.history.replaceState(null, '', redirect)
    }

    ReactDOM.createRoot(document.querySelector('#root') ?? document.body).render(
        <BrowserRouter basename='/'>
            <React.StrictMode>
                <App model={model} />
            </React.StrictMode>
        </BrowserRouter>,
    )
} else {
    console.error('Inside a frame')
}
