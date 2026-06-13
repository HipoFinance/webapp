import { observer } from 'mobx-react-lite'

const Page404 = observer(() => {
    return (
        <div className='mx-auto min-w-[360px] max-w-md bg-fixed py-4 text-center md:py-8 lg:py-16'>
            <div className='mb-4 text-7xl font-bold'>404</div>

            <h1 className='mb-2 text-xl font-semibold'>Page not found</h1>

            <p className='mb-6 text-black/60'>The page you’re looking for doesn’t exist or has been moved.</p>

            <div className='border mx-auto rounded-2xl border-black/10 bg-black/5 p-4'>
                <p className='mb-2 text-sm text-black/70'>Need support?</p>
                <a
                    href='https://t.me/hipo_chat'
                    target='_blank'
                    rel='noreferrer'
                    className='text-sm text-[#818cf8] hover:text-[#a5b4fc]'
                >
                    Hipo Chat
                </a>
            </div>
        </div>
    )
})

export default Page404
