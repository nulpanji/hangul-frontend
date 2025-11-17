import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [language, setLanguage] = useState('english');
  const [input, setInput] = useState('');
  const [hangul, setHangul] = useState('');
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const languages = [
    { code: 'english', name: '🇺🇸 English', sample: 'Hello, how are you?' },
    { code: 'spanish', name: '🇪🇸 Español', sample: 'Hola, ¿cómo estás?' },
    { code: 'french', name: '🇫🇷 Français', sample: 'Bonjour, comment allez-vous?' },
    { code: 'german', name: '🇩🇪 Deutsch', sample: 'Hallo, wie geht es dir?' },
    { code: 'italian', name: '🇮🇹 Italiano', sample: 'Ciao, come stai?' },
    { code: 'japanese', name: '🇯🇵 日本語', sample: 'こんにちは、元気ですか？' },
    { code: 'vietnamese', name: '🇻🇳 Tiếng Việt', sample: 'Xin chào, bạn khỏe không?' },
    { code: 'thai', name: '🇹🇭 ภาษาไทย', sample: 'สวัสดี คุณสบายดีไหม?' }
  ];

  // 언어별 UI 텍스트
  const translations = {
    english: {
      title: '🌍 Learn Hangul',
      selectLanguage: 'Select Language',
      enterText: 'Enter Text',
      convert: 'Convert to Hangul',
      converting: 'Converting...',
      startAnimation: 'Start Animation',
      pause: 'Pause',
      restart: 'Restart',
      newSentence: 'New Sentence',
      backendNote: 'Backend connection required'
    },
    spanish: {
      title: '🌍 Aprender Hangul',
      selectLanguage: 'Seleccionar Idioma',
      enterText: 'Ingresar Texto',
      convert: 'Convertir a Hangul',
      converting: 'Convirtiendo...',
      startAnimation: 'Iniciar Animación',
      pause: 'Pausar',
      restart: 'Reiniciar',
      newSentence: 'Nueva Oración',
      backendNote: 'Requiere conexión al servidor'
    },
    french: {
      title: '🌍 Apprendre le Hangul',
      selectLanguage: 'Sélectionner la Langue',
      enterText: 'Saisir le Texte',
      convert: 'Convertir en Hangul',
      converting: 'Conversion...',
      startAnimation: 'Démarrer l\'Animation',
      pause: 'Pause',
      restart: 'Recommencer',
      newSentence: 'Nouvelle Phrase',
      backendNote: 'Connexion au serveur requise'
    },
    german: {
      title: '🌍 Hangul Lernen',
      selectLanguage: 'Sprache Wählen',
      enterText: 'Text Eingeben',
      convert: 'In Hangul Konvertieren',
      converting: 'Konvertierung...',
      startAnimation: 'Animation Starten',
      pause: 'Pause',
      restart: 'Neu Starten',
      newSentence: 'Neuer Satz',
      backendNote: 'Serververbindung erforderlich'
    },
    italian: {
      title: '🌍 Impara l\'Hangul',
      selectLanguage: 'Seleziona Lingua',
      enterText: 'Inserisci Testo',
      convert: 'Converti in Hangul',
      converting: 'Conversione...',
      startAnimation: 'Avvia Animazione',
      pause: 'Pausa',
      restart: 'Riavvia',
      newSentence: 'Nuova Frase',
      backendNote: 'Richiede connessione al server'
    },
    japanese: {
      title: '🌍 ハングルを学ぶ',
      selectLanguage: '言語を選択',
      enterText: 'テキストを入力',
      convert: 'ハングルに変換',
      converting: '変換中...',
      startAnimation: 'アニメーション開始',
      pause: '一時停止',
      restart: '最初から',
      newSentence: '新しい文',
      backendNote: 'サーバー接続が必要'
    },
    vietnamese: {
      title: '🌍 Học Hangul',
      selectLanguage: 'Chọn Ngôn Ngữ',
      enterText: 'Nhập Văn Bản',
      convert: 'Chuyển Sang Hangul',
      converting: 'Đang Chuyển...',
      startAnimation: 'Bắt Đầu Hoạt Ảnh',
      pause: 'Tạm Dừng',
      restart: 'Khởi Động Lại',
      newSentence: 'Câu Mới',
      backendNote: 'Cần kết nối máy chủ'
    },
    thai: {
      title: '🌍 เรียนฮันกึล',
      selectLanguage: 'เลือกภาษา',
      enterText: 'ป้อนข้อความ',
      convert: 'แปลงเป็นฮันกึล',
      converting: 'กำลังแปลง...',
      startAnimation: 'เริ่มแอนิเมชัน',
      pause: 'หยุดชั่วคราว',
      restart: 'เริ่มใหม่',
      newSentence: 'ประโยคใหม่',
      backendNote: 'ต้องเชื่อมต่อเซิร์ฟเวอร์'
    }
  };

  const t = translations[language];

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

  // API로 변환
  const convertWithAPI = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setHangul('');
    setDisplayText('');
    setCurrentIndex(0);
    
    try {
      const response = await fetch(`${API_URL}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, language: language })
      });

      const data = await response.json();
      
      if (data.success) {
        setHangul(data.hangul);
      } else {
        setHangul('변환 실패: ' + data.error);
      }
      
      setLoading(false);
    } catch (error) {
      setHangul('서버 연결 실패. 백엔드가 실행 중인지 확인해주세요.');
      setLoading(false);
    }
  };

  // 타자기 애니메이션
  useEffect(() => {
    if (!animating || !hangul) return;
    
    const decomposed = decomposeHangul(hangul);
    
    if (currentIndex < decomposed.length) {
      const timer = setTimeout(() => {
        setDisplayText(decomposed[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, 400);
      
      return () => clearTimeout(timer);
    } else {
      setAnimating(false);
    }
  }, [animating, currentIndex, hangul]);

  const startAnimation = () => {
    setDisplayText('');
    setCurrentIndex(0);
    setAnimating(true);
  };

  const resetAnimation = () => {
    setDisplayText('');
    setCurrentIndex(0);
    setAnimating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black rounded-3xl shadow-2xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
        
        {!hangul && (
          <div className="h-full flex flex-col p-6">
            <h1 className="text-3xl font-bold text-white text-center mb-8">
              🌍 한글 배우기
            </h1>
            
            <div className="mb-6">
              <label className="block text-white text-sm font-semibold mb-2">
                언어 선택
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6 flex-1">
              <label className="block text-white text-sm font-semibold mb-2">
                문장 입력
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={languages.find(l => l.code === language)?.sample}
                className="w-full h-40 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              onClick={convertWithAPI}
              disabled={loading || !input.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold py-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={24} />
                  변환 중...
                </>
              ) : (
                '한글로 변환'
              )}
            </button>

            <div className="mt-4 text-center text-gray-400 text-xs">
              백엔드 서버 연결 필요
            </div>
          </div>
        )}

        {hangul && (
          <div className="h-full flex flex-col">
            <div className="bg-gray-900 p-6 border-b border-gray-700">
              <p className="text-white text-lg text-center leading-relaxed">
                {input}
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
              <p className="text-white text-2xl font-bold text-center leading-relaxed" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                {displayText || (animating ? '' : hangul)}
              </p>
            </div>

            <div className="p-6 space-y-3">
              {!animating ? (
                <button
                  onClick={startAnimation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Play size={24} />
                  애니메이션 시작
                </button>
              ) : (
                <button
                  onClick={() => setAnimating(false)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Pause size={24} />
                  일시정지
                </button>
              )}
              
              <button
                onClick={resetAnimation}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                처음부터
              </button>
              
              <button
                onClick={() => {
                  setHangul('');
                  setInput('');
                  resetAnimation();
                }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors duration-200"
              >
                새 문장
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;