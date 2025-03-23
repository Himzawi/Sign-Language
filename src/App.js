import React from 'react';
import './App.css';
import HandDetection from './components/Handdetection';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-purple-100 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-2">Sign Language Learning App</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn sign language gestures through interactive practice with real-time feedback
          </p>
        </header>
        
        <HandDetection />
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Sign Language Learning App | Powered by MediaPipe | Hasan Himzawi</p>
        </footer>
      </div>
    </div>
  );
}

export default App;