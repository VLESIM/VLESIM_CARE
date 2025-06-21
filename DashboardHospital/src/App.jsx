
import { BrowserRouter as Router,Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.scss'
import Navbar from './components/Nabvar'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Dash from './pages/Dash'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
        
        <div className='flex'>
          <Sidebar />
          <div className='content'>
            {/* <Navbar /> */}
            <Routes>
              <Route path='/' exact={true} element={<Home />} />
              <Route path='/Dash' exact={true} element={<Dash />} />
            </Routes>
          </div>
        </div>
    </Router>
  )
}

export default App
