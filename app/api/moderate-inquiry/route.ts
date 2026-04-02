import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { wechat_id, message, listing_id } = await req.json();
  const normalizedWechat = wechat_id.trim().toLowerCase();

  // ── Layer 2: Rate limiting ──────────────────────────────────────────────────
  // Uses service role key to bypass RLS so we can count by wechat_id globally.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Same wechat_id already messaged this listing
  console.log('Checking duplicate - wechat_id:', normalizedWechat, 'listing_id:', listing_id)
  const { count: dupCount, error: dupError } = await supabaseAdmin
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('wechat_id', normalizedWechat)
    .eq('listing_id', listing_id);
  console.log('Duplicate check result - count:', dupCount, 'error:', JSON.stringify(dupError))

  if ((dupCount ?? 0) > 0) {
    return NextResponse.json({ pass: false, errorKey: 'alreadyContacted' });
  }

  // Same wechat_id sent 10+ inquiries across all listings in the last 24 h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: dailyCount, error: dailyError } = await supabaseAdmin
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('wechat_id', normalizedWechat)
    .gte('created_at', since);

  console.log('[moderate-inquiry] daily check', { normalizedWechat, dailyCount, dailyError });

  if ((dailyCount ?? 0) >= 10) {
    return NextResponse.json({ pass: false, errorKey: 'dailyLimitReached' });
  }

  // ── Layer 3: Claude AI moderation ──────────────────────────────────────────
  // Only runs when the renter actually typed a message.
  if (message && message.trim().length > 0) {
    const anthropic = new Anthropic();

    try {
      console.log('Calling Claude API...')
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: `你是一个租房平台的内容审核员。判断租客留言是否和租房相关。
合规内容：询问房源、表达入住意向、介绍自己、问价格/时间/位置/设施等任何租房相关内容。空白留言（用户只留微信号不写留言）也视为合规。
不合规内容：广告推销、引流到其他平台、无关话题、纯粹的骚扰内容。
判断标准：内容是否有可能出现在一个真实租客和房东的对话中。
只返回JSON，不要加任何其他文字：{"pass": true/false, "reason": "一句话原因，15字以内"}`,
        messages: [{ role: 'user', content: message }],
      });

      console.log('Claude response:', JSON.stringify(response))
      const textBlock = response.content.find((b) => b.type === 'text');
      if (textBlock?.type === 'text') {
        try {
          const rawText = textBlock.text;
          const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const result = JSON.parse(cleanText);
          console.log('Claude parsed result:', JSON.stringify(result))
          if (result.pass === false) {
            // Record blocked inquiry for audit
            await supabaseAdmin.from('blocked_inquiries').insert([{
              wechat_id: normalizedWechat,
              message: message,
              listing_id: listing_id,
              reason: result.reason ?? null,
            }]);
            return NextResponse.json({ pass: false, errorKey: 'moderationFailed' });
          }
          return NextResponse.json({ pass: true, reason: result.reason ?? null });
        } catch {
          // Malformed JSON from model — default to pass
        }
      }
    } catch (e) {
      console.error('Claude API error:', JSON.stringify(e))
      // Claude API error — default to pass so legitimate users aren't blocked
    }
  }

  return NextResponse.json({ pass: true, reason: null });
}
