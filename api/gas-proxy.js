// [보안] 속도 제한(Rate Limiting)을 위한 간단한 변수 (Serverless 인스턴스 재사용 시 동작)
let requestCount = 0;
let lastReset = Date.now();
const MAX_REQUESTS_PER_WINDOW = 50; // 창당 최대 요청 수
const WINDOW_MS = 60000; // 1분

export default async function handler(req, res) {
  // 1. CORS 설정 강화
  const origin = req.headers.origin;
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://find-partner-1hyq.vercel.app';
  
  // 로컬 개발 환경 및 운영 도메인 허용
  if (origin && (origin === allowedOrigin || origin.startsWith('http://localhost:'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. 기본 Rate Limiting (Serverless 환경의 한계가 있지만 인스턴스 재사용 시 유효)
  const now = Date.now();
  if (now - lastReset > WINDOW_MS) {
    requestCount = 0;
    lastReset = now;
  }
  requestCount++;
  if (requestCount > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
  }

  // Vercel 환경 변수에서 숨겨둔 주소와 비밀 키를 가져옵니다.
  const GAS_URL = process.env.GAS_URL;
  const API_TOKEN = process.env.API_TOKEN; // Vercel 환경 변수에 설정 필요

  if (!GAS_URL) {
    return res.status(500).json({ error: "서버 설정 오류: GAS_URL이 설정되지 않았습니다." });
  }
 
  try {
    const url = new URL(GAS_URL);
    
    // GAS 보안을 위해 비밀 키를 쿼리 파라미터로 추가 (GAS의 e.parameter.key로 확인 가능)
    if (API_TOKEN) {
      url.searchParams.append('key', API_TOKEN);
    }
    
    // 프론트엔드에서 보낸 쿼리스트링(검색어 등)이 있다면 그대로 GAS로 전달
    if (req.method === 'GET') {
      for (const [key, value] of Object.entries(req.query)) {
        url.searchParams.append(key, value);
      }
    }

    const options = {
      method: req.method,
    };

    // POST 요청일 경우 데이터 처리
    if (req.method === 'POST') {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      options.headers = {
        'Content-Type': 'application/json',
      };
    }

    const response = await fetch(url.toString(), options);
    const data = await response.json();

    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: "서버 통신 중 오류가 발생했습니다." }); 
  }
}