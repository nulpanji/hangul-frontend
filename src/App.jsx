import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 한글 자모 분해/조합 유틸리티
const HANGUL = {
  CHO: ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'],
  JUNG: ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'],
  JONG: ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
};

// 한글 여부 체크
function isHangul(char) {
  const code = char.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
}

// 한글 분해
function disassemble(char) {
  if (!isHangul(char)) return [char];
  
  const code = char.charCodeAt(0) - 0xAC00;
  const cho = Math.floor(code / 588);
  const jung = Math.floor((code % 588) / 28);
  const jong = code % 28;
  
  return [
    HANGUL.CHO[cho],
    HANGUL.JUNG[jung],
    jong > 0 ? HANGUL.JONG[jong] : null
  ].filter(Boolean);
}

// 한글 조합
function assemble(cho, jung, jong = '') {
  const choIdx = HANGUL.CHO.indexOf(cho);
  const jungIdx = HANGUL.JUNG.indexOf(jung);
  const jongIdx = jong ? HANGUL.JONG.indexOf(jong) : 0;
  
  if (choIdx === -1 || jungIdx === -1 || jongIdx === -1) return '';
  
  const code = 0xAC00 + (choIdx * 588) + (jungIdx * 28) + jongIdx;
  return String.fromCharCode(code);
}

// 타이핑 단계 생성 (각 단계마다 누적된 완성 문자열)
function createTypingSteps(text) {
  const steps = [];
  let accumulated = '';
  
  for (let char of text) {
    if (isHangul(char)) {
      const jamos = disassemble(char);
      
      // 1단계: 초성만
      steps.push(accumulated + jamos[0]);
      
      // 2단계: 초성+중성
      if (jamos.length >= 2) {
        const partial = assemble(jamos[0], jamos[1]);
        steps.push(accumulated + partial);
      }
      
      // 3단계: 완성형 (초성+중성+종성)
      if (jamos.length === 3) {
        const complete = assemble(jamos[0], jamos[1], jamos[2]);
        steps.push(accumulated + complete);
        accumulated += complete;
      } else if (jamos.length === 2) {
        // 종성이 없으면 중성까지만
        accumulated += assemble(jamos[0], jamos[1]);
      }
    } else {
      // 공백, 특수문자 등
      accumulated += char;
      steps.push(accumulated);
    }
  }
  
  return steps;
}

function App() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayResults, setDisplayResults] = useState([]);
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const animationRef = useRef(null);

  // 변환 함수
  const handleConvert = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResults([]);
    setDisplayResults([]);
    setIsAnimating(false);
    setDetectedLanguage('');
    
    try {
      const response = await fetch(`${API_URL}/translate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('=== API Response ===');
      console.log('Full data:', data);
      console.log('Detected language:', data.detectedLanguage);
      console.log('All results:', data.results);
      
      if (data.success) {
        // 원본 언어 찾기
        const sourceResult = data.results.find(r => r.code === data.detectedLanguage);
        // 한국어 찾기
        const koreanResult = data.results.find(r => r.code === 'ko');
        
        console.log('Source result:', sourceResult);
        console.log('Korean result:', koreanResult);
        
        // 원본 언어 + 한국어 (한국어가 원본인 경우 한국어만)
        const filteredResults = [];
        if (sourceResult && sourceResult.code !== 'ko') {
          filteredResults.push(sourceResult);
        }
        if (koreanResult) {
          filteredResults.push(koreanResult);
        }
        
        console.log('Filtered results:', filteredResults);
        
        setResults(filteredResults);
        setDetectedLanguage(data.detectedLanguage);
        
        // 타이핑 단계 생성
        setDisplayResults(filteredResults.map(r => {
          const steps = createTypingSteps(r.pronunciation);
          console.log(`Steps for ${r.name}:`, steps);
          return {
            ...r,
            steps,
            displayPronunciation: '',
            currentStep: 0,
            totalSteps: steps.length
          };
        }));
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

  // 애니메이션 시작/정지
  const toggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    } else {
      setIsAnimating(true);
    }
  };

  // 애니메이션 리셋
  const resetAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    setDisplayResults(results.map(r => {
      const steps = createTypingSteps(r.pronunciation);
      return {
        ...r,
        steps,
        displayPronunciation: '',
        currentStep: 0,
        totalSteps: steps.length
      };
    }));
  };

  // 자모 단위 애니메이션
  useEffect(() => {
    if (isAnimating && displayResults.length > 0) {
      animationRef.current = setInterval(() => {
        setDisplayResults(prev => {
          const updated = prev.map(item => {
            if (item.currentStep < item.totalSteps) {
              return {
                ...item,
                displayPronunciation: item.steps[item.currentStep],
                currentStep: item.currentStep + 1
              };
            }
            return item;
          });
          
          // 모든 애니메이션 완료 확인
          const allComplete = updated.every(item => item.currentStep >= item.totalSteps);
          if (allComplete) {
            setIsAnimating(false);
            clearInterval(animationRef.current);
          }
          
          return updated;
        });
      }, 150); // 0.15초마다
      
      return () => {
        if (animationRef.current) {
          clearInterval(animationRef.current);
        }
      };
    }
  }, [isAnimating, displayResults.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col">
      {/* 헤더 */}
      <div className="w-full max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">👑 Descendants of King Sejong</h1>
        <p className="text-gray-400 text-sm">Type in any language, learn Hangul pronunciation!</p>
        
        {/* 국기 아이콘 일렬 */}
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

      {/* 입력 영역 */}
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

      {/* 결과 영역 */}
      {displayResults.length > 0 && (
        <div className="flex-1 w-full max-w-2xl mx-auto px-6 pb-6">
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
            {/* 언어 감지 표시 */}
            {detectedLanguage && (
              <div className="text-center text-sm text-gray-400 mb-4">
                Detected Language: <span className="text-blue-300 font-semibold">{detectedLanguage.toUpperCase()}</span>
              </div>
            )}
            
            {/* 컨트롤 버튼 */}
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

            {/* 입력 언어 + 한국어 2개 표시 */}
            <div className="grid grid-cols-1 gap-4">
              {displayResults.map((result, index) => (
                <div 
                  key={index} 
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  {/* 국기 + 언어명 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{result.flag}</span>
                    <span className="text-sm font-medium text-gray-300">{result.name}</span>
                  </div>
                  
                  {/* 번역문 */}
                  <div className="text-sm text-gray-300 mb-3 break-words">
                    {result.translation}
                  </div>
                  
                  {/* 한글 발음 (자모 단위 타이핑) */}
                  <div className="text-2xl font-bold text-blue-300 break-words min-h-[32px] font-mono">
                    {result.displayPronunciation || result.pronunciation}
                    {isAnimating && result.currentStep < result.totalSteps && (
                      <span className="animate-pulse">|</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;