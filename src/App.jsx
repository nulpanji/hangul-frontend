import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayResults, setDisplayResults] = useState([]);
  const animationRef = useRef(null);

  // 변환 함수
  const handleConvert = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResults([]);
    setDisplayResults([]);
    setIsAnimating(false);
    
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
      
      if (data.success) {
        setResults(data.results);
        // 애니메이션 초기화 - 글자 단위로 누적
        setDisplayResults(data.results.map(r => ({
          ...r,
          displayPronunciation: '',
          currentStep: 0,
          totalLength: r.pronunciation.length
        })));
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
    setDisplayResults(results.map(r => ({
      ...r,
      displayPronunciation: '',
      currentStep: 0,
      totalLength: r.pronunciation.length
    })));
  };

  // 동시 애니메이션 효과
  useEffect(() => {
    if (isAnimating && displayResults.length > 0) {
      animationRef.current = setInterval(() => {
        setDisplayResults(prev => {
          const updated = prev.map(item => {
            if (item.currentStep < item.totalLength) {
              // 누적해서 표시
              return {
                ...item,
                displayPronunciation: item.pronunciation.substring(0, item.currentStep + 1),
                currentStep: item.currentStep + 1
              };
            }
            // 애니메이션 완료 - 전체 텍스트 표시
            return {
              ...item,
              displayPronunciation: item.pronunciation
            };
          });
          
          // 모든 애니메이션이 완료되면 중지
          const allComplete = updated.every(item => item.currentStep >= item.totalLength);
          if (allComplete) {
            setIsAnimating(false);
            clearInterval(animationRef.current);
          }
          
          return updated;
        });
      }, 100); // 0.1초마다 한 글자씩
      
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
        <p className="text-gray-400 text-sm">Type in English, see it in 8 languages with Hangul!</p>
        
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
            English Input
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your sentence in English..."
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

            {/* 8개 언어 2열 레이아웃 */}
            <div className="grid grid-cols-2 gap-3">
              {displayResults.map((result, index) => (
                <div 
                  key={index} 
                  className="bg-gray-700 rounded-lg p-3 border border-gray-600"
                >
                  {/* 국기 + 언어명 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{result.flag}</span>
                    <span className="text-xs font-medium text-gray-300">{result.name}</span>
                  </div>
                  
                  {/* 번역문 (작게) */}
                  <div className="text-xs text-gray-400 mb-2 break-words">
                    {result.translation}
                  </div>
                  
                  {/* 한글 발음 (크고 굵게) */}
                  <div className="text-lg font-bold text-blue-300 break-words min-h-[28px]">
                    {result.displayPronunciation || result.pronunciation}
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