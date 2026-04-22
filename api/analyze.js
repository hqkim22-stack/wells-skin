/**
 * WELLS SKIN AI — Vercel Edge Function
 * ─────────────────────────────────────
 * 역할: Claude Vision API 프록시
 *   - ANTHROPIC_API_KEY를 서버에서 주입 (클라이언트 노출 없음)
 *   - CORS 헤더 자동 추가 → 브라우저에서 직접 호출 가능
 *
 * 배포 방법:
 *   1) GitHub 저장소에 아래 구조로 업로드:
 *        /index.html
 *        /api/analyze.js   ← 이 파일
 *        /vercel.json
 *   2) vercel.com → Import → 저장소 선택
 *   3) Settings → Environment Variables 에서 추가:
 *        Key:   ANTHROPIC_API_KEY
 *        Value: sk-ant-api03-xxxxxxxx  (Anthropic Console에서 발급)
 *   4) Redeploy → 완료
 *
 * 무료 플랜: Edge Function 100,000 실행/월 무료
 */

export const config = { runtime: 'edge' };

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  // API Key 확인
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY 환경변수를 Vercel 대시보드에서 설정하세요.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  try {
    const body = await req.json();

    // Claude API 호출
    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || '서버 내부 오류' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }
}
