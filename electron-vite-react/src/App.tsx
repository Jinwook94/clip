import { useState } from 'react'
import UpdateElectron from '@/components/update'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'

function App() {
    const [count, setCount] = useState(0)
    return (
        <div className='App'>
            <div className='logo-box'>
                <a href='https://github.com/Jinwook94/clip' target='_blank'>
                    <img src={logoVite} className='logo vite' alt='Clip logo' />
                    <img src={logoElectron} className='logo electron' alt='Clip logo' />
                </a>
            </div>
            <h1>Clip</h1>
            <div className='card'>
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <p className='read-the-docs'>
                Click on the Clip logo to learn more
            </p>
            <div className='flex-center'>
                Place static files into the<code>/public</code> folder <img style={{ width: '5em' }} src='./node.svg' alt='Node logo' />
            </div>

            <UpdateElectron />
        </div>
    )
}

export default App