import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [input, setInput] = useState('');
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [displayTexts, setDisplayTexts] = useState([]);

  const languageOrder = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' }
  ];

  // 한글 자모 분해
  const decomposeHangul = (text) => {
    const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
    
    const result = [];
    let prefix = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);
      
      if (code >= 0xAC00 && code <= 0xD7A3) {
        const syllableIndex = code - 0xAC00;
        const choIndex = Math.floor(syllableIndex / 588);
        const jungIndex = Math.floor((syllableIndex % 588) / 28);
        const jongIndex = syllableIndex % 28;
        
        result.push(prefix + CHO[choIndex]);
        result.push(prefix + String.fromCharCode(0xAC00 + choIndex * 588 + jungIndex * 28));
        if (jongIndex > 0) {
          result.push(prefix + char);
        }
        
        prefix += char;
      } else {
        prefix += char;
        result.push(prefix);
      }
    }
    
    return result;
  };

  // API 호출
  const translateAll = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setTranslations([]);
    setDisplayTexts([]);
    setCurrentCharIndex(0);
    
    try {
      const response = await fetch(`${API_URL}/translate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });

      const data = await response.json();
      
      if (data.success) {
        setTranslations(data.translations);
        setDisplayTexts(new Array(data.translations.length).fill(''));
      } else {
        alert('변환 실패: ' + data.error);
      }
      
      setLoading(false);
    } catch (error) {
      alert('서버 연결 실패. 백엔드를 확인해주세요.');
      setLoading(false);
    }
  };

  // 동시 애니메이션
  useEffect(() => {
    if (!animating || translations.length === 0) return;
    
    const allDecomposed = translations.map(t => decomposeHangul(t.hangul));
    const maxLength = Math.max(...allDecomposed.map(d => d.length));
    
    if (currentCharIndex < maxLength) {
      const timer = setTimeout(() => {
        setDisplayTexts(prev => {
          return allDecomposed.map((decomposed, langIndex) => {
            return currentCharIndex < decomposed.length 
              ? decomposed[currentCharIndex] 
              : decomposed[decomposed.length - 1];
          });
        });
        setCurrentCharIndex(currentCharIndex + 1);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setAnimating(false);
    }
  }, [animating, currentCharIndex, translations]);

  const startAnimation = () => {
    setDisplayTexts(new Array(translations.length).fill(''));
    setCurrentCharIndex(0);
    setAnimating(true);
  };

  const resetAnimation = () => {
    setDisplayTexts(new Array(translations.length).fill(''));
    setCurrentCharIndex(0);
    setAnimating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black rounded-3xl shadow-2xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
        
        {translations.length === 0 && (
          <div className="h-full flex flex-col p-6">
            <h1 className="text-3xl font-bold text-white text-center mb-4">
              🌍 Learn Hangul
            </h1>
            <p className="text-gray-400 text-center text-sm mb-8">
              Type in English, see 9 languages in Hangul!
            </p>
            
            <div className="mb-6 flex-1">
              <label className="block text-white text-sm font-semibold mb-2">
                Enter English Text
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hello, how are you?"
                className="w-full h-40 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              onClick={translateAll}
              disabled={loading || !input.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold py-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={24} />
                  Converting...
                </>
              ) : (
                'Convert to Hangul'
              )}
            </button>
          </div>
        )}

        {translations.length > 0 && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {translations.map((trans, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg p-2 border border-gray-700">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-lg">{languageOrder[index].flag}</span>
                      <span className="text-gray-400 text-xs">{languageOrder[index].name}</span>
                    </div>
                    <div className="text-white text-sm mb-1 line-clamp-2">{trans.text}</div>
                    <div className="text-blue-400 text-lg font-bold leading-tight">
                      {displayTexts[index] || (animating ? '' : trans.hangul)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-2 border-t border-gray-700">
              {!animating ? (
                <button
                  onClick={startAnimation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Start Animation
                </button>
              ) : (
                <button
                  onClick={() => setAnimating(false)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Pause size={20} />
                  Pause
                </button>
              )}
              
              <button
                onClick={resetAnimation}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Restart
              </button>
              
              <button
                onClick={() => {
                  setTranslations([]);
                  setInput('');
                  resetAnimation();
                }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-colors duration-200"
              >
                New Sentence
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;