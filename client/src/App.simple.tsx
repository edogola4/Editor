import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Collaborative Code Editor</h1>
        <p className="text-xl mb-8">🚧 Application Loading...</p>
        <button
          onClick={() => setCount(count + 1)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Count: {count}
        </button>
        <p className="mt-4 text-gray-400">
          If you see this, the basic React app is working!
        </p>
      </div>
    </div>
  )
}

export default App
