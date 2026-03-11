import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// 1. Upstash Redis 및 Ratelimit 초기화 (서버리스 인스턴스 밖에서 한 번만 실행)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 환경변수 기반으로 Rate Limit 설정 (예: 50 requests per 60s)
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '50', 10);
const WINDOW_SECONDS = Math.floor(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10) / 1000);

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(MAX_REQUESTS, `${WINDOW_SECONDS} s`),
  analytics: true,
});

export default async function handler(req, res) {
  // 1. 환경 변수에서 설정값 불러오기
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://find-partner-1hyq.vercel.app';

  // 2. [가장 중요🚨] 강력한 출처(Origin) 및 직접 접속 검증
  const requestOrigin = req.headers.origin || req.headers.referer || '';
  const isAllowed = requestOrigin.startsWith(allowedOrigin) || requestOrigin.startsWith('http://localhost:');

  if (!isAllowed) {
    // ❌ 허락되지 않은 접근(브라우저 직접 접속, 해킹 툴 등)즉시 차단
    return res.status(403).json({ error: "Forbidden: 허용되지 않은 접근입니다." });
  }

  // 3. 정상 접근일 경우 CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 4. [보안 고도화🔒] Upstash 기반 IP Rate Limiting
  // Vercel 환경에서는 x-forwarded-for 헤더에 실제 사용자 IP가 담깁니다.
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || '127.0.0.1';

  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);
    
    // 응답 헤더에 Rate Limit 정보 포함 (선택 사항)
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());

    if (!success) {
      return res.status(429).json({ 
        error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
        retryAfter: reset
      });
    }
  } catch (error) {
    console.error('Rate Limit Error:', error);
    // Redis 연결 오류 시에도 서비스는 작동하도록 (Fail-open) 로그만 남깁니다.
  }

  // 5. GAS 통신 로직
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