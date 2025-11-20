// api/translate-all.js
// Vercel Serverless Function with automatic language detection
import Anthropic from '@anthropic-ai/sdk';

// 언어 정보
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  try {
    const { text } = req.body;

    // 입력 검증
    if (!text) {
      return res.status(400).json({ 
        error: '텍스트를 입력해주세요.' 
      });
    }

    // Claude API 클라이언트 초기화
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Claude API 호출
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `다음 텍스트를 분석하고 처리해주세요:

텍스트: ${text}

작업:
1. 입력 텍스트의 언어를 감지하세요 (en, ja, vi, th, es, fr, it, ko 중 하나)
2. 감지된 언어의 원문과 한글 발음을 제공하세요
3. 한국어로 정확하고 자연스럽게 번역하고 영어 발음을 한글로 표기하세요

중요한 규칙:
- 국제적으로 잘 알려진 고유명사는 원어 그대로 유지
- 한국어 번역은 자연스러운 한국어로 (발음이 아닌 실제 번역)
- 한글 발음은 실제 발음에 최대한 가깝게
- JSON 형식으로만 답변

응답 형식:
{
  "detectedLanguage": "언어코드 (en, ja, vi, th, es, fr, it, ko 중 하나)",
  "source": {
    "translation": "감지된 언어의 원문",
    "pronunciation": "원문의 한글 발음"
  },
  "ko": {
    "translation": "정확하고 자연스러운 한국어 번역",
    "pronunciation": "원문의 한글 발음 (영어 기준)"
  }
}`
        }
      ]
    });

    // 응답 추출
    let responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')
      .trim();

    // JSON 파싱 (마크다운 코드 블록 제거)
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(responseText);

    // 언어 정보 가져오기
    const detectedLangCode = data.detectedLanguage;
    const sourceLangInfo = languages.find(l => l.code === detectedLangCode);
    const koLangInfo = languages.find(l => l.code === 'ko');

    // 결과 구성
    const results = [
      {
        code: detectedLangCode,
        name: sourceLangInfo?.name || 'Unknown',
        flag: sourceLangInfo?.flag || '🏳️',
        translation: data.source.translation,
        pronunciation: data.source.pronunciation
      },
      {
        code: 'ko',
        name: koLangInfo.name,
        flag: koLangInfo.flag,
        translation: data.ko.translation,
        pronunciation: data.ko.pronunciation
      }
    ];

    // 성공 응답
    res.status(200).json({
      success: true,
      original: text,
      detectedLanguage: detectedLangCode,
      results: results
    });

  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({
      success: false,
      error: 'AI 변환 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}