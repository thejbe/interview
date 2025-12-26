import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase Admin Client
// We need SERVICE_ROLE_KEY to bypass RLS when updating company subscription status from a webhook
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        return new NextResponse('Missing stripe-signature header', { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('STRIPE_WEBHOOK_SECRET is missing');
        return new NextResponse('Server Configuration Error', { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const session = event.data.object as any;
    const subscription = event.data.object as Stripe.Subscription;

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                // Retrieve the subscription details from Stripe
                if (session.subscription) {
                    const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
                    const sub = await stripe.subscriptions.retrieve(subId);

                    // The company_id should be passed in client_reference_id or metadata during checkout creation
                    const companyId = session.client_reference_id || session.metadata?.company_id;

                    if (companyId) {
                        await supabaseAdmin
                            .from('companies')
                            .update({
                                stripe_customer_id: sub.customer as string,
                                subscription_status: sub.status,
                                plan_tier: 'pro', // Simplifying for now, ideally map price ID to tier
                                current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
                            })
                            .eq('id', companyId);
                    }
                }
                break;

            case 'customer.subscription.updated':
                // Find company by stripe_customer_id
                await supabaseAdmin
                    .from('companies')
                    .update({
                        subscription_status: subscription.status,
                        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                        // Logic to update plan_tier if product changed would go here
                    })
                    .eq('stripe_customer_id', subscription.customer as string);
                break;

            case 'customer.subscription.deleted':
                await supabaseAdmin
                    .from('companies')
                    .update({
                        subscription_status: subscription.status,
                        plan_tier: 'free', // Revert to free on cancel
                        current_period_end: null,
                    })
                    .eq('stripe_customer_id', subscription.customer as string);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error('Error handling webhook event:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
