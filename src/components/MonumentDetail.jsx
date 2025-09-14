import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, getDoc, setDoc, getDocs } from 'firebase/firestore';

const MonumentDetail = ({ monument, goHome }) => {
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioPlayer, setAudioPlayer] = useState(null);
    const [isLoadingModel, setIsLoadingModel] = useState(false);
    const [isArSupported, setIsArSupported] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    
    // Firestore setup is now handled within MonumentDetail for simplicity, but could be a separate context or hook
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);

    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3000);
    };

    const pcmToWav = (pcmData, sampleRate = 16000) => {
        const buffer = new ArrayBuffer(44 + pcmData.byteLength);
        const view = new DataView(buffer);
        let offset = 0;
        function writeString(str) { for (let i = 0; i < str.length; i++) view.setUint8(offset++, str.charCodeAt(i)); }
        function writeUint32(val) { view.setUint32(offset, val, true); offset += 4; }
        function writeUint16(val) { view.setUint16(offset, val, true); offset += 2; }
        writeString('RIFF');
        writeUint32(36 + pcmData.byteLength);
        writeString('WAVE');
        writeString('fmt ');
        writeUint32(16);
        writeUint16(1);
        writeUint16(1);
        writeUint32(sampleRate);
        writeUint32(sampleRate * 2);
        writeUint16(2);
        writeUint16(16);
        writeString('data');
        writeUint32(pcmData.byteLength);
        const pcm16 = new Int16Array(pcmData);
        for (let i = 0; i < pcm16.length; i++) {
            view.setInt16(offset, pcm16[i], true);
            offset += 2;
        }
        return new Blob([view], { type: 'audio/wav' });
    };

    const playAudio = async (text) => {
        if (audioPlayer) {
            audioPlayer.pause();
        }
        setIsAudioLoading(true);
        const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=";
        const payload = {
            contents: [{ parts: [{ text: text }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
            },
        };
        const tryFetch = async (retries = 3, delay = 1000) => {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error(`API error: ${response.statusText}`);
                const result = await response.json();
                const audioData = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!audioData) throw new Error("No audio data received.");
                return audioData;
            } catch (error) {
                if (retries > 0) { await new Promise(res => setTimeout(res, delay)); return tryFetch(retries - 1, delay * 2); }
                throw error;
            }
        };

        try {
            const audioData = await tryFetch();
            const pcmData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0)).buffer;
            const wavBlob = pcmToWav(pcmData);
            const url = URL.createObjectURL(wavBlob);
            const newAudio = new Audio(url);
            setAudioPlayer(newAudio);
            newAudio.play();
            showMessage("Audio is playing.");
        } catch (error) {
            console.error("Failed to play audio:", error);
            showMessage("Failed to play audio. Please try again.", "error");
        } finally {
            setIsAudioLoading(false);
        }
    };

    useEffect(() => {
        const checkAR = async () => {
            try {
                if (navigator.xr) {
                    const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                    setIsArSupported(isSupported);
                } else {
                    setIsArSupported(false);
                }
            } catch (error) {
                console.error("AR check failed:", error);
                setIsArSupported(false);
            }
        };

        checkAR();
    }, []);

    // Placeholder for Firestore, not strictly necessary for this view's functionality
    useEffect(() => {
        const initializeFirebase = async () => {
            try {
                const app = initializeApp(firebaseConfig);
                const firestore = getFirestore(app);
                const authInstance = getAuth(app);
                setDb(firestore);
                setAuth(authInstance);

                const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                if (initialAuthToken) {
                    await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    await signInAnonymously(authInstance);
                }
                const currentUserId = authInstance.currentUser?.uid || crypto.randomUUID();
                setUserId(currentUserId);
            } catch (error) {
                console.error("Error initializing Firebase:", error);
                showMessage("Failed to connect to the database. Please check your connection.", "error");
            }
        };

        initializeFirebase();
    }, [appId, firebaseConfig]);

    return (
        <div className="container mx-auto px-4 py-8">
            <button
                onClick={goHome}
                className="flex items-center text-gray-600 hover:text-gray-900 font-semibold mb-6 transition-colors duration-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Back to Gallery
            </button>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    <div className="relative w-full h-[50vh] lg:h-[80vh] bg-gray-100 overflow-hidden rounded-l-xl">
                        {!isLoadingModel ? (
                            <img
                                src={monument.imageUrl}
                                alt={monument.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : null}
                        <model-viewer
                            src={isLoadingModel ? monument.modelUrl : null}
                            ar ar-modes="webxr scene-viewer quick-look"
                            alt={`A 3D model of ${monument.title}`}
                            auto-rotate
                            camera-controls
                            shadow-intensity="1"
                            xr-environment
                            className="w-full h-full"
                        >
                            <div className="flex justify-center items-center h-full w-full">
                                {!isLoadingModel && (
                                    <button
                                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                                        onClick={() => setIsLoadingModel(true)}
                                    >
                                        Load 3D Model
                                    </button>
                                )}
                            </div>
                            {isLoadingModel && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-sm px-4 py-2 rounded-lg hidden"
                                ref={el => {
                                    if (el && !isArSupported) {
                                        el.classList.remove('hidden');
                                    }
                                }}>
                                AR is not supported on this device.
                            </div>
                        </model-viewer>
                    </div>
                    <div className="p-6 md:p-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{monument.title}</h2>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {Object.keys(monument.history).map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => playAudio(monument.history[lang])}
                                    disabled={isAudioLoading}
                                    className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${isAudioLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                >
                                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'తెలుగు'}
                                </button>
                            ))}
                            {isAudioLoading && <span className="ml-2 text-sm text-gray-500">Loading Audio...</span>}
                        </div>
                        <p className="text-base text-gray-700 leading-relaxed mb-8">{monument.history.en}</p>
                        <div className="grid grid-cols-2 gap-4">
                            {monument.imageGallery.map((imgSrc, index) => (
                                <img
                                    key={index}
                                    src={imgSrc}
                                    className="rounded-lg shadow-sm w-full h-auto object-cover"
                                    alt={`Image of ${monument.title} ${index + 1}`}
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {message && (
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl text-white shadow-lg transition-opacity duration-300 ease-in-out z-50 ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default MonumentDetail;
