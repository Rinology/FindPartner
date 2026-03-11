// [보안] 속도 제한(Rate Limiting)을 위한 전역 변수
// (주의: Vercel 환경에서는 인스턴스별로 작동하므로 완벽한 글로벌 제한은 아니지만, 1차적인 매크로 방어로는 유효합니다.)
let requestCount = 0;
let lastReset = Date.now();

export default async function handler(req, res) {
  // 1. 환경 변수에서 설정값 불러오기 (환경 변수가 없으면 기본값 사용)
  const MAX_REQUESTS_PER_WINDOW = parseInt(process.env.RATE_LIMIT_MAX || '50', 10); 
  const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); 
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://find-partner-1hyq.vercel.app';

  // 2. [가장 중요🚨] 강력한 출처(Origin) 검증 및 차단
  // 브라우저 주소창 직접 접속은 origin이 비어있으므로 referer도 함께 체크
  const requestOrigin = req.headers.origin || req.headers.referer || '';
  
  // 우리 사이트이거나 로컬 테스트 환경인지 확인
  const isAllowed = requestOrigin.startsWith(allowedOrigin) || requestOrigin.startsWith('http://localhost:');

  if (!isAllowed) {
    // ❌ 허락되지 않은 접근(브라우저 직접 접속, 해킹 툴 등)은 여기서 즉시 차단!
    return res.status(403).json({ error: "Forbidden: 허용되지 않은 접근입니다." });
  }

  // 3. 정상 접근일 경우 CORS 헤더 달아주기
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 4. Rate Limiting 검사
  const now = Date.now();
  if (now - lastReset > WINDOW_MS) {
    requestCount = 0;
    lastReset = now;
  }
  requestCount++;
  if (requestCount > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
  }

  // 5. GAS 통신 로직 (여기부터는 기존과 동일하게 안전하게 실행됨)
  const GAS_URL = process.env.GAS_URL;
  const API_TOKEN = process.env.API_TOKEN;

  if (!GAS_URL) {
    return res.status(500).json({ error: "서버 설정 오류: GAS_URL이 설정되지 않았습니다." });
  }
 
  try {
    const url = new URL(GAS_URL);
    
    // GAS 보안을 위해 비밀 키 추가
    if (API_TOKEN) {
      url.searchParams.append('key', API_TOKEN);
    }
    
    // GET 요청 파라미터 전달
    if (req.method === 'GET') {
      for (const [key, value] of Object.entries(req.query)) {
        url.searchParams.append(key, value);
      }
    }

    const options = {
      method: req.method,
    };

    // POST 요청 바디 전달
    if (req.method === 'POST') {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      options.headers = {
        'Content-Type': 'application/json',
      };
    }

    const response = await fetch(url.toString(), options);
    const data = await response.json();

    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: "서버 통신 중 오류가 발생했습니다." }); 
  }
}