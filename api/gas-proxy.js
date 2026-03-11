import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// [보안/환경] 환경 변수 값 정제 (따옴표 및 공백 제거)
const cleanEnv = (val) => (val ? val.replace(/['"]/g, "").trim() : "");

// 1. Upstash Redis 및 Ratelimit 초기화
const UPSTASH_URL = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
const UPSTASH_TOKEN = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = (UPSTASH_URL && UPSTASH_TOKEN) ? new Redis({
  url: UPSTASH_URL,
  token: UPSTASH_TOKEN,
}) : null;

const MAX_REQUESTS = parseInt(cleanEnv(process.env.RATE_LIMIT_MAX) || '50', 10);
const WINDOW_SECONDS = Math.floor(parseInt(cleanEnv(process.env.RATE_LIMIT_WINDOW_MS) || '60000', 10) / 1000);

const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(MAX_REQUESTS, `${WINDOW_SECONDS} s`),
  analytics: true,
}) : null;

export default async function handler(req, res) {
  // 1. 환경 변수 설정값 불러오기
  const allowedOrigin = cleanEnv(process.env.ALLOWED_ORIGIN) || 'https://www.xtronmap.kr';
  const GAS_URL = cleanEnv(process.env.GAS_URL);
  const API_TOKEN = cleanEnv(process.env.API_TOKEN);

  // 2. [보안] 출처(Origin) 및 직접 접속 검증
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const requestOrigin = origin || referer || "";
  
  const isAllowed = 
    requestOrigin.startsWith(allowedOrigin) || 
    requestOrigin.startsWith('http://localhost') || 
    requestOrigin.startsWith('http://127.0.0.1');

  if (!isAllowed) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[403 Forbidden] 허용되지 않은 접근: ${requestOrigin}`);
    }
    return res.status(403).json({ error: "Forbidden: 허용되지 않은 접근입니다." });
  }

  // 3. CORS 헤더 설정
  const actualOrigin = origin || (referer ? new URL(referer).origin : allowedOrigin);
  res.setHeader('Access-Control-Allow-Origin', actualOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 4. [보안] Upstash 기반 IP Rate Limiting
  if (ratelimit) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket?.remoteAddress || '127.0.0.1';
    
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', reset.toString());

      if (!success) {
        return res.status(429).json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
      }
    } catch (error) {
      console.error('Rate Limit Error:', error.message);
    }
  }

  // 5. GAS 통신 로직
  if (!GAS_URL) {
    return res.status(500).json({ error: "서버 설정 오류: GAS_URL이 설정되지 않았습니다." });
  }
 
  try {
    const url = new URL(GAS_URL);
    if (API_TOKEN) url.searchParams.append('key', API_TOKEN);
    
    // GET 요청 파라미터 전달
    if (req.method === 'GET') {
      for (const [key, value] of Object.entries(req.query)) {
        url.searchParams.append(key, value);
      }
    }

    const options = { method: req.method };

    // POST 요청 바디 전달
    if (req.method === 'POST') {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      options.headers = { 'Content-Type': 'application/json' };
    }

    const response = await fetch(url.toString(), options);
    const data = await response.json();

    return res.status(200).json(data);
    
  } catch (error) {
    console.error('GAS Connection Error:', error.message);
    return res.status(500).json({ error: "데이터 서버 통신 중 오류가 발생했습니다." }); 
  }
}