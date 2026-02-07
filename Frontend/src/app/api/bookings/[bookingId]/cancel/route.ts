import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(
  _request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await context.params;
  const id = Number(bookingId);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, class_id, status')
    .eq('id', id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ ok: true });
  }

  // Update booking status
  const { error: updateBookingError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', id);

  if (updateBookingError) {
    return NextResponse.json({ error: updateBookingError.message }, { status: 400 });
  }

  // Decrement class booked_count
  const { data: cls, error: classFetchError } = await supabase
    .from('classes')
    .select('id, booked_count')
    .eq('id', booking.class_id)
    .single();

  if (classFetchError || !cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const nextBookedCount = Math.max(0, (cls.booked_count ?? 0) - 1);

  const { error: classUpdateError } = await supabase
    .from('classes')
    .update({ booked_count: nextBookedCount })
    .eq('id', cls.id);

  if (classUpdateError) {
    return NextResponse.json({ error: classUpdateError.message }, { status: 400 });
  }

  // TODO: If this booking used a credit package, refund 1 credit to the user's package.

  return NextResponse.json({ ok: true });
}
