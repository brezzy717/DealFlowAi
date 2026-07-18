import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";

/**
 * Stripe webhook — add this endpoint in the Stripe dashboard
 * (https://www.dealflowtech.io/api/stripe/webhook) and set
 * STRIPE_WEBHOOK_SECRET. Handles payment + subscription lifecycle.
 */
export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const stripe = new Stripe(key);
  const body = await req.text();

  let event: Stripe.Event;
  if (whSecret) {
    const sig = req.headers.get("stripe-signature");
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig!, whSecret);
    } catch {
      return NextResponse.json({ error: "bad signature" }, { status: 400 });
    }
  } else {
    // No signing secret configured yet — accept unverified (sandbox only).
    event = JSON.parse(body) as Stripe.Event;
  }

  if (!adminConfigured()) return NextResponse.json({ received: true });
  const admin = supabaseAdmin();

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.customer_email) {
        const { data: tu } = await admin.from("tenant_users").select("tenant_id").eq("email", s.customer_email).maybeSingle();
        if (tu) {
          await admin
            .from("tenants")
            .update({ stripe_customer_id: s.customer as string, stripe_subscription_id: s.subscription as string, status: "active" })
            .eq("id", tu.tenant_id);
          await admin.from("onboarding_progress").upsert({ tenant_id: tu.tenant_id, payment_complete: true });
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      await admin.from("tenants").update({ status: "past_due" }).eq("stripe_customer_id", inv.customer as string);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from("tenants").update({ status: "churned" }).eq("stripe_subscription_id", sub.id);
      break;
    }
  }
  await admin.from("audit_log").insert({ action: `stripe_${event.type}`, target_type: "stripe", detail: { id: event.id } });
  return NextResponse.json({ received: true });
}
