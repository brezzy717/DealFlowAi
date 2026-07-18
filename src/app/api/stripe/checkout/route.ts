import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";

/**
 * Creates a Stripe Checkout session for broker onboarding:
 * one-time setup fee + monthly subscription in a single session
 * (Tier 1: $6,500 + $2,400/mo · Tier 2: $8,500 + $5,500/mo).
 */
const PRICING = {
  1: { name: "DealFlow AI — Tier 1: Data Feed", setup: 6500_00, monthly: 2400_00 },
  2: { name: "DealFlow AI — Tier 2: Full Intelligence", setup: 8500_00, monthly: 5500_00 },
} as const;

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  let email: string | undefined;
  if (supabaseConfigured()) {
    const supa = await supabaseServer();
    const {
      data: { user },
    } = await supa.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    email = user.email ?? undefined;
  }

  const { tier } = (await req.json()) as { tier: 1 | 2 };
  const p = PRICING[tier] ?? PRICING[2];
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://www.dealflowtech.io";

  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${p.name} — Setup Fee` },
          unit_amount: p.setup,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${p.name} — Monthly` },
          unit_amount: p.monthly,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    subscription_data: { metadata: { tier: String(tier) } },
    success_url: `${origin}/onboarding?paid=1&cs={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/onboarding?canceled=1`,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
