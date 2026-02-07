import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { 
    packageId?: number;
    paymentMethod?: string;
    paymentNote?: string;
    paymentSlipUrl?: string;
  } | null;
  
  const packageId = Number(body?.packageId);
  const paymentMethod = body?.paymentMethod;
  const paymentNote = body?.paymentNote;
  const paymentSlipUrl = body?.paymentSlipUrl;

  if (!Number.isFinite(packageId)) {
    return NextResponse.json({ error: 'Invalid package id' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch package details
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('id, credits, duration_days, type, is_active, price')
    .eq('id', packageId)
    .single();

  if (pkgError || !pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  if (!pkg.is_active) {
    return NextResponse.json({ error: 'Package is not active' }, { status: 400 });
  }

  const now = new Date();
  const expire = new Date(now);
  expire.setDate(expire.getDate() + (pkg.duration_days ?? 0));

  // Determine payment status based on method and slip
  let paymentStatus = 'pending_verification';
  
  if (paymentMethod === 'cash') {
    paymentStatus = 'unpaid';
  } else if (paymentSlipUrl) {
    paymentStatus = 'partial'; // Has slip, awaiting verification
  }

  // Create user package with payment fields
  const { data: userPackage, error: createError } = await supabase
    .from('user_packages')
    .insert({
      user_id: user.id,
      package_id: pkg.id,
      credits_remaining: pkg.type === 'credit' ? pkg.credits : null,
      start_at: now.toISOString(),
      activated_at: null, // Not activated yet
      expire_at: expire.toISOString(),
      status: 'pending_activation', // Pending until admin verifies payment
      payment_method: paymentMethod || 'bank_transfer',
      payment_status: paymentStatus,
      payment_slip_url: paymentSlipUrl || null,
      payment_note: paymentNote || null,
      amount_due: pkg.price || 0,
      amount_paid: 0, // Will be set by admin during verification
    })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Also create payment record for history tracking
  const { error: paymentError } = await supabase.from('payments').insert({
    user_id: user.id,
    user_package_id: userPackage.id,
    amount: pkg.price || 0,
    method: (paymentMethod as 'cash' | 'bank_transfer' | 'promptpay' | 'card' | 'other') || 'bank_transfer',
    log_status: 'recorded',
    paid_at: now.toISOString(),
    note: paymentNote || null,
    evidence_url: paymentSlipUrl || null,
  });

  if (paymentError) {
    console.error('Payment record error:', paymentError);
    // Don't fail the request if payment record fails
  }

  return NextResponse.json({ ok: true, userPackageId: userPackage.id });
}
