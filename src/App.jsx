import React, { useState } from 'react';
import Gallery from './components/Gallery.jsx';
import MonumentDetail from './components/MonumentDetail.jsx';
import { HERITAGE_SITES } from './data/monuments.js';

const App = () => {
    const [view, setView] = useState('home');
    const [selectedMonument, setSelectedMonument] = useState(null);

    const goHome = () => {
        setView('home');
        setSelectedMonument(null);
    };

    const showDetail = (monument) => {
        setSelectedMonument(monument);
        setView('detail');
    };

    return (
        <div className="min-h-screen bg-white font-sans antialiased text-gray-800 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            <a href="#" onClick={(e) => { e.preventDefault(); goHome(); }} className="hover:text-gray-600">Indian Heritage</a>
                        </h1>
                    </div>
                </div>
            </header>
            <main className="flex-grow p-4 sm:p-6 lg:p-8">
                {view === 'home' ? (
                    <Gallery monuments={HERITAGE_SITES} showDetail={showDetail} />
                ) : (
                    <MonumentDetail monument={selectedMonument} goHome={goHome} />
                )}
            </main>
        </div>
    );
};

export default App;
