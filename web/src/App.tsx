// App.tsx
import "./styles/globals.css";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MusicPlayPage from './pages/MusicPlayPage';
import SettingsPage from './pages/SettingsPage';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <nav className="bg-white dark:bg-gray-900 p-4">
                    <div className="container mx-auto flex justify-between">
                        <Link to="/" className="font-bold text-lg">音乐播放器</Link>
                        <div className="flex space-x-4">
                            <Link to="/" className="text-gray-900 dark:text-gray-100">首页</Link>
                            <Link to="/settings" className="text-gray-900 dark:text-gray-100">设置</Link>
                        </div>
                    </div>
                </nav>
                <div className="container mx-auto p-4">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/music/:id" element={<MusicPlayPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
