import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Loader, Info } from 'lucide-react';
import AboutModal from './AboutModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 한글 자모 상수
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

function isHangul(char) {
  const code = char.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
}

function disassemble(char) {
  if (!isHangul(char)) return [char];
  const code = char.charCodeAt(0) - 0xAC00;
  const cho = CHO[Math.floor(code / 588)];
  const jung = JUNG[Math.floor((code % 588) / 28)];
  const jong = JONG[code % 28];
  return jong ? [cho, jung, jong] : [cho, jung];
}

function assemble(cho, jung, jong = '') {
  const choIdx = CHO.indexOf(cho);
  const jungIdx = JUNG.indexOf(jung);
  const jongIdx = jong ? JONG.indexOf(jong) : 0;
  if (choIdx === -1 || jungIdx === -1) return '';
  const code = 0xAC00 + (choIdx * 588) + (jungIdx * 28) + jongIdx;
  return String.fromCharCode(code);
}

function createAnimationSteps(text) {
  const steps = [''];
  let result = '';
  
  for (const char of text) {
    if (isHangul(char)) {
      const parts = disassemble(char);
      steps.push(result + parts[0]);
      steps.push(result + assemble(parts[0], parts[1]));
      if (parts[2]) {
        steps.push(result + assemble(parts[0], parts[1], parts[2]));
      }
      result += char;
    } else {
      result += char;
      steps.push(result);
    }
  }
  
  steps.push(result);
  return steps;
}

function App() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const animationRef = useRef(null);

  const handleConvert = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResults([]);
    setIsAnimating(false);
    setAnimationStep(0);
    setDetectedLanguage('');
    
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    
    try {
      const response = await fetch(`${API_URL}/translate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      
      if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
      
      const data = await response.json();
      
      if (data.success) {
        const sourceResult = data.results.find(r => r.code === data.detectedLanguage);
        const koreanResult = data.results.find(r => r.code === 'ko');
        
        const filteredResults = [];
        if (sourceResult && sourceResult.code !== 'ko') {
          filteredResults.push(sourceResult);
        }
        if (koreanResult) {
          filteredResults.push(koreanResult);
        }
        
        const withSteps = filteredResults.map(r => ({
          ...r,
          steps: createAnimationSteps(r.pronunciation)
        }));
        
        setResults(withSteps);
        setDetectedLanguage(data.detectedLanguage);
      } else {
        alert(data.error || '변환에 실패했습니다.');
      }
    } catch (error) {
      console.error('변환 오류:', error);
      alert('서버 연결 실패. 백엔드를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      if (results.length > 0 && animationStep >= results[0].steps.length - 1) {
        setAnimationStep(0);
      }
      setIsAnimating(true);
    }
  };

  const resetAnimation = () => {
    console.log('🔄 Reset 버튼 클릭!');
    setIsAnimating(false);
    setAnimationStep(0);
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  };

  useEffect(() => {
    if (!isAnimating || results.length === 0) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    const maxSteps = Math.max(...results.map(r => r.steps.length));
    
    animationRef.current = setInterval(() => {
      setAnimationStep(prev => {
        if (prev >= maxSteps - 1) {
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 150);
    
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isAnimating, results]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col">
      {/* 헤더 */}
      <div className="w-full max-w-2xl mx-auto p-6 text-center relative">
        {/* About 버튼 - 오른쪽 상단 */}
        <button
          onClick={() => setIsAboutOpen(true)}
          className="absolute top-6 right-6 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors flex items-center gap-2"
          title="About"
        >
          <Info className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">About</span>
        </button>

        <h1 className="text-3xl font-bold mb-2">👑 Descendants of King Sejong</h1>
        <p className="text-gray-400 text-sm">Type in any language, learn Hangul pronunciation!</p>
        
        <div className="flex justify-center gap-3 mt-4 text-2xl">
          <span title="English">🇺🇸</span>
          <span title="日本語">🇯🇵</span>
          <span title="Tiếng Việt">🇻🇳</span>
          <span title="ภาษาไทย">🇹🇭</span>
          <span title="Español">🇪🇸</span>
          <span title="Français">🇫🇷</span>
          <span title="Italiano">🇮🇹</span>
          <span title="한국어">🇰🇷</span>
        </div>
      </div>

      {/* 입력 */}
      <div className="w-full max-w-2xl mx-auto px-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Multi-Language Input
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type in English, Japanese, Vietnamese, Thai, Spanish, French, or Italian..."
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            rows="3"
          />
          <button
            onClick={handleConvert}
            disabled={loading || !input.trim()}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Converting...
              </>
            ) : (
              'Convert to Hangul'
            )}
          </button>
        </div>
      </div>

      {/* 결과 */}
      {results.length > 0 && (
        <div className="flex-1 w-full max-w-2xl mx-auto px-6 pb-6">
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
            {detectedLanguage && (
              <div className="text-center text-sm text-gray-400 mb-4">
                Detected Language: <span className="text-blue-300 font-semibold">{detectedLanguage.toUpperCase()}</span>
              </div>
            )}
            
            <div className="flex gap-2 mb-4 justify-center">
              <button
                onClick={toggleAnimation}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                {isAnimating ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Animation
                  </>
                )}
              </button>
              <button
                onClick={resetAnimation}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {results.map((result, index) => {
                const displayText = animationStep >= result.steps.length 
                  ? result.steps[result.steps.length - 1]
                  : result.steps[animationStep];
                
                return (
                  <div 
                    key={index} 
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{result.flag}</span>
                      <span className="text-sm font-medium text-gray-300">{result.name}</span>
                    </div>
                    
                    <div className="text-sm text-gray-300 mb-3 break-words">
                      {result.translation}
                    </div>
                    
                    <div className="text-2xl font-bold text-blue-300 break-words min-h-[32px] font-mono">
                      {displayText}
                      {isAnimating && animationStep < result.steps.length - 1 && (
                        <span className="animate-pulse">|</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
      />
    </div>
  );
}

export default App;