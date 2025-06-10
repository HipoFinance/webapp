;(() => {
    const TG_SQUARE_BTN_HTML = `<div><img src="https://wallet.tg/images/logo-288.png" alt="" draggable="false"></div><div><div fontsize="14px" fontweight="510" lineheight="130%" color="#0F0F0F" data-tc-text="true">Wallet On</div></div><div fontsize="14px" fontweight="510" lineheight="130%" color="#0F0F0F" data-tc-text="true">Telegram</div>`
    const TG_BADGE_FILENAME = 'tg.png'
    const TG_BADGE_STYLE =
        'position: absolute; right: 10px; top: 50px; width: 24px; height: 24px; border-radius: 6px; box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);'

    const MTW_ICON =
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="28" height="28" viewBox="0 0 480 480"><path fill="url(#a)" d="M240.002 480c132.548 0 240-107.452 240-240S372.55 0 240.002 0 .00201416 107.452.00201416 240 107.454 480 240.002 480Z"/><path fill="url(#b)" d="M442.771 154.651c-21.166-50.287-60.264-90.915-109.701-113.9959-49.438-23.0808-105.689-26.9679-157.831-10.9065C123.096 45.81 78.782 80.674 50.8999 127.571c-27.8824 46.898-37.3436 102.483-26.5468 155.964 10.7968 53.481 41.0809 101.043 84.9739 133.45 43.893 32.408 98.261 47.349 152.551 41.924 54.29-5.425 104.627-30.83 141.238-71.283 36.612-40.452 56.886-93.066 56.886-147.626.038-29.317-5.821-58.343-17.231-85.349Zm-18.63 174.801-9.757-25.667 24.008-12.852c-3.43 13.299-8.205 26.214-14.251 38.546v-.027ZM43.1904 291.299l23.7136 12.7-9.6225 25.346c-5.9606-12.178-10.6814-24.924-14.0911-38.046ZM36.6621 240c0-6.653.3151-13.226.9454-19.719l18.1668 20.147-18.0955 20.084c-.6659-6.748-1.0048-13.585-1.0167-20.512Zm20.45-89.015 9.8099 25.935-24.0794 12.878c3.423-13.389 8.2042-26.395 14.2695-38.813Zm381.4319 38.688-24.213-12.994 9.89-26.042c6.099 12.487 10.898 25.568 14.323 39.036ZM319.84 378.004l-19.086-12.914c6.039-2.916 11.855-6.272 17.4-10.042l1.686 22.956Zm-51.575 18.149-12.896-18.212c6.447-.671 12.84-1.795 19.13-3.362l-6.234 21.574Zm-54.956.66-6.421-22.207c6.717 1.669 13.55 2.831 20.441 3.478l-14.02 18.729Zm-12.396 11.745-28.646 17.623-10.007-30.733 29.146-19.719 9.507 32.829Zm-39.42-30.911 1.659-22.564c5.46 3.697 11.179 6.993 17.115 9.864l-18.774 12.7Zm0-274.928 18.363 12.485c-5.787 2.858-11.369 6.115-16.704 9.748l-1.659-22.233ZM213.3 83.437l13.744 18.488c-6.748.646-13.44 1.785-20.022 3.407l6.278-21.895Zm54.947.66 6.109 21.279c-6.16-1.527-12.418-2.63-18.729-3.299l12.62-17.98Zm12.102-12.825 28.655-17.7473 10.024 31.0273-29.145 19.888-9.534-33.168Zm39.419 31.117-1.649 22.501c-5.409-3.668-11.071-6.946-16.945-9.81l18.594-12.691Zm-79.124 261.158c-68.119 0-123.547-55.428-123.547-123.547-.004-17.79 3.841-35.371 11.272-51.535 7.431-16.164 18.271-30.529 31.778-42.108.478-.251.929-.55 1.346-.892.414-.344.788-.733 1.115-1.16 10.347-8.458 21.997-15.184 34.497-19.915.437-.072.867-.186 1.284-.338.412-.149.809-.337 1.186-.562 20.112-7.088 41.718-8.842 62.709-5.091 20.992 3.751 40.653 12.88 57.065 26.495.143.143.286.276.446.41.161.134.277.223.428.33 13.767 11.571 24.836 26.014 32.432 42.315 7.595 16.302 11.532 34.067 11.536 52.051 0 68.119-55.419 123.547-123.547 123.547ZM102.409 251.095l-22.154-10.622 22.038-10.586c-.244 3.353-.366 6.724-.366 10.113 0 3.728.146 7.426.437 11.095h.045Zm276.622-21.405 22.047 10.586-22.1 10.596c.273-3.568.413-7.192.419-10.872-.036-3.46-.16-6.912-.419-10.328l.053.018Zm-11.487-45.876 21.824 1.926-15.349 15.911c-1.742-6.089-3.905-12.049-6.475-17.837Zm-27.37-40.392 22.233-5.565-9.114 21.146c-3.988-5.517-8.373-10.736-13.119-15.616v.035Zm-98.727-47.535L220.399 67.58l19.621-26.0328L261.255 67.66l-19.808 28.227Zm-50.032 8.919L162.26 84.873l10.007-31.0094 28.664 17.7384-9.516 33.204Zm-63.473 54.348-9.061-21.047 22.073 5.521c-4.704 4.831-9.052 9.997-13.012 15.455v.071Zm-20.717 42.738-15.304-15.973 21.734-1.927c-2.55 5.788-4.698 11.745-6.43 17.828v.072ZM74.753 190.03l23.91 24.838-31.83 15.206-21.7876-24.205L74.753 190.03Zm-7.92 60.815 31.794 15.277-23.901 24.838-29.743-15.911 21.85-24.204Zm40.615 27.995c1.788 6.192 4.011 12.251 6.653 18.131L91.876 295l15.572-16.16Zm34.211 58.371-22.831 5.708 9.328-21.672c4.102 5.646 8.615 10.982 13.503 15.964Zm99.788 47.374 19.808 27.933-21.244 25.944-19.62-25.864 21.056-28.013Zm48.427-8.499 29.136 19.719-9.979 30.742-28.655-17.623 9.498-32.838Zm63.321-54.919 9.266 21.547-22.662-5.673c4.85-4.957 9.328-10.266 13.396-15.883v.009Zm20.726-42.452 15.5 16.115-22.117 1.954c2.627-5.873 4.838-11.922 6.617-18.105v.036Zm32.704 12.031-23.901-24.838 31.794-15.268 21.823 24.195-29.716 15.911Zm7.839-60.886-31.83-15.278 23.902-24.828 29.716 15.901-21.788 24.205Zm-14.358-58.443-34.336-3.032 13.948-32.401 32.356 3.925-11.968 31.508Zm-33.614-50.246-33.435 8.365 2.577-35.174 31.812-6.867-.954 33.676Zm-93.51-63.1693-17.533-21.5558c13.811.9787 27.486 3.3694 40.811 7.1347l-23.278 14.4211Zm-64.649.3389-23.598-14.6084c13.066-3.7371 26.476-6.1483 40.026-7.1971l-16.428 21.8055ZM148.276 129.75l-33.435-8.365-.999-33.685 31.857 6.876 2.577 35.174Zm-46.661 6.448 13.948 32.392-34.336 3.041-12.013-31.517 32.401-3.916ZM81.103 309.287l34.336 3.041-13.922 32.392-32.356-3.942 11.942-31.491Zm33.684 50.22 33.436-8.375-2.578 35.184-31.856 6.876.998-33.685Zm93.555 62.277 16.41 21.645c-13.52-1.038-26.902-3.428-39.946-7.134l23.536-14.511Zm64.64.339 23.188 14.27c-13.301 3.761-26.951 6.151-40.739 7.134l17.551-21.404Zm60.084-71.196 33.426 8.402.99 33.693-31.857-6.885-2.559-35.21Zm46.715-6.448-13.949-32.4 34.336-3.041 11.96 31.517-32.347 3.924Zm45.742-104.301 18.319-20.316c.648 6.618.975 13.318.981 20.102 0 6.915-.339 13.753-1.017 20.513l-18.283-20.299Zm-16.802-115.957-27.068-3.291.821-27.647c9.751 9.419 18.543 19.783 26.247 30.938Zm-49.703-50.452-25.729 5.566-8.107-25.1147c11.879 5.4168 23.21 11.9637 33.836 19.5487ZM156.196 54.2649l-8.161 25.2841-25.863-5.583c10.682-7.645 22.076-14.2429 34.024-19.7011ZM98.832 93.461l.821 27.647-27.032 3.282c7.698-11.147 16.477-21.507 26.211-30.929ZM73.326 356.555l26.273 3.184-.793 26.755c-9.429-9.132-17.961-19.145-25.48-29.903v-.036Zm49.845 50.22 25.061-5.414 7.919 24.401c-11.559-5.291-22.6-11.648-32.98-18.987Zm202.056 19.031 8.026-24.623 25.213 5.413c-10.453 7.42-21.582 13.837-33.239 19.166v.044Zm57.318-39.125-.802-27.121 26.639-3.228c-7.608 10.93-16.261 21.095-25.837 30.349Z"/><defs><linearGradient id="a" x1="240.002" x2="240.002" y1="0" y2="480" gradientUnits="userSpaceOnUse"><stop stop-color="#629CE6"/><stop offset=".5" stop-color="#3F79CF"/><stop offset="1" stop-color="#2E74B5"/></linearGradient><linearGradient id="b" x1="240.002" x2="240.002" y1="-40" y2="520" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset="1" stop-color="#E6EFF6"/></linearGradient></defs></svg>'
    const MTW_LARGE_BTN_MOBILE_HTML = `${MTW_ICON} MyTonWallet<div></div>`

    let isObservingTcWidget = false

    init()

    function init() {
        const tcWidget = document.getElementById('tc-widget-root')

        if (tcWidget) {
            patchAndObserveTcWidget(tcWidget)
        } else if (document.body) {
            observeBody()
        } else {
            document.addEventListener('DOMContentLoaded', init)
        }
    }

    function observeBody() {
        const bodyObserver = new MutationObserver(() => {
            const tcWidget = document.getElementById('tc-widget-root')

            if (tcWidget) {
                bodyObserver.disconnect()
                patchAndObserveTcWidget(tcWidget)
            }
        })

        bodyObserver.observe(document.body, { childList: true })
    }

    function patchAndObserveTcWidget(tcWidget) {
        if (isObservingTcWidget) return

        isObservingTcWidget = true

        let universalContainer = document.querySelector(
            '[data-tc-wallets-modal-universal-mobile=true], [data-tc-wallets-modal-universal-desktop=true]',
        )
        if (universalContainer) {
            applyFriendlyPatch(universalContainer)
        }

        new MutationObserver(() => {
            const newUniversalContainer = document.querySelector(
                '[data-tc-wallets-modal-universal-mobile=true], [data-tc-wallets-modal-universal-desktop=true]',
            )

            if (newUniversalContainer !== universalContainer) {
                universalContainer = newUniversalContainer

                if (newUniversalContainer) {
                    applyFriendlyPatch(newUniversalContainer)
                }
            }
        }).observe(tcWidget, {
            subtree: true,
            childList: true,
        })
    }

    function applyFriendlyPatch(container) {
        const ul = container.querySelector('ul')
        const mtwLi = Array.from(ul.children).find((i) => i.textContent.startsWith('MyTonWallet'))
        if (!mtwLi) return

        const isDesktop = Boolean(container.getAttribute('data-tc-wallets-modal-universal-desktop'))
        if (isDesktop) {
            if (ul.firstElementChild !== mtwLi) {
                ul.insertBefore(mtwLi, ul.firstElementChild)
            }
        } else {
            const mtwBtn = mtwLi.firstElementChild

            const tgBtn = container.querySelector('[data-tc-button=true]')
            const tgBtnOldClassName = tgBtn.className
            tgBtn.className = mtwBtn.className
            tgBtn.innerHTML = TG_SQUARE_BTN_HTML
            tgBtn.firstElementChild.className = mtwBtn.firstElementChild.className
            applyImgClassName(tgBtn, ul)
            applyBadgeStyle(tgBtn)
            const textClassName = mtwBtn.querySelector('[data-tc-text]').className
            Array.from(tgBtn.querySelectorAll('[data-tc-text]')).forEach((el) => {
                el.className = textClassName
            })

            mtwBtn.className = tgBtnOldClassName
            const themeTextColor = getComputedStyle(container.parentNode.parentNode).color
            mtwBtn.style.color = themeTextColor
            mtwBtn.style.backgroundColor =
                themeTextColor.replace(/\s/g, '').toLowerCase() === 'rgb(255,255,255)' ? '#1C1E24' : '#EDEFF4'
            mtwBtn.style.justifyContent = 'center'
            mtwBtn.style.fontWeight = '510'
            mtwBtn.innerHTML = MTW_LARGE_BTN_MOBILE_HTML
            tgBtn.parentNode.insertBefore(mtwBtn, tgBtn)
            mtwLi.remove()

            const subtitleEl = mtwBtn.previousSibling
            subtitleEl.innerHTML = subtitleEl.innerHTML.replace('Wallet in Telegram', 'MyTonWallet')

            const newLi = document.createElement('li')
            newLi.appendChild(tgBtn)
            ul.prepend(newLi)
        }
    }

    function applyImgClassName(tgBtn, ul) {
        const nonMtwLi = Array.from(ul.children).find((i) => !i.textContent.startsWith('MyTonWallet'))
        let img = nonMtwLi.querySelector('img')

        if (img) {
            tgBtn.querySelector('img').className = img.className
        } else {
            const liObserver = new MutationObserver(() => {
                img = nonMtwLi.querySelector('img')

                if (img) {
                    liObserver.disconnect()
                    tgBtn.querySelector('img').className = img.className
                }
            })

            liObserver.observe(nonMtwLi, {
                childList: true,
                subtree: true,
            })
        }
    }

    function applyBadgeStyle(tgBtn) {
        let tgBadge = Array.from(tgBtn.querySelectorAll('img')).find((img) => img.src.endsWith(TG_BADGE_FILENAME))

        if (tgBadge) {
            tgBadge.style.cssText = TG_BADGE_STYLE
        } else {
            const btnObserver = new MutationObserver(() => {
                tgBadge = Array.from(tgBtn.querySelectorAll('img')).find((img) => img.src.endsWith(TG_BADGE_FILENAME))

                if (tgBadge) {
                    btnObserver.disconnect()
                    tgBadge.style.cssText = TG_BADGE_STYLE
                }
            })

            btnObserver.observe(tgBtn, {
                childList: true,
                subtree: true,
            })
        }
    }
})()
