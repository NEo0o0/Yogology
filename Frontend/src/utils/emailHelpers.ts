export async function sendBookingConfirmationEmail(
  user: any,
  booking: any,
  classData: any,
  packageInfo?: { name: string; creditsRemaining?: number; isUnlimited?: boolean }
) {
  try {
    console.log('📧 Triggering booking confirmation email...', {
      to: user.email,
      class: classData.title,
      bookingId: booking.id,
      isPackage: booking.kind === 'package'
    });

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'booking_confirmation',
        recipientEmail: user.email,
        recipientName: user.user_metadata?.full_name || user.email,
        data: {
          className: classData.title,
          classDate: new Date(classData.starts_at).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          classTime: classData.time,
          location: classData.room || classData.location,
          instructor: classData.instructor,
          paymentMethod: booking.kind === 'package' ? 'Package Credit' :
                         booking.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                         booking.payment_method === 'promptpay' ? 'PromptPay' :
                         booking.payment_method === 'cash' ? 'Cash' : 'Other',
          paymentStatus: booking.payment_status,
          amount: booking.amount_due || 0,
          bookingId: booking.id,
          isPackageBooking: booking.kind === 'package',
          packageName: packageInfo?.name,
          creditsRemaining: packageInfo?.creditsRemaining,
          isUnlimited: packageInfo?.isUnlimited
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const result = await response.json();
    console.log('✅ Booking confirmation email triggered successfully!', result);

    return { success: true };
  } catch (error) {
    console.error('❌ Booking confirmation email failed:', error);
    return { success: false, error };
  }
}

export async function sendSlipUploadedEmail(
  userEmail: string,
  userName: string,
  classData: any,
  bookingId: number
) {
  try {
    console.log('📧 Triggering slip uploaded email...', {
      to: userEmail,
      class: classData.title,
      bookingId
    });

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'slip_uploaded',
        recipientEmail: userEmail,
        recipientName: userName,
        data: {
          className: classData.title,
          classDate: new Date(classData.starts_at).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          classTime: classData.time,
          bookingId
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const result = await response.json();
    console.log('✅ Slip uploaded email triggered successfully!', result);

    return { success: true };
  } catch (error) {
    console.error('❌ Slip uploaded email failed:', error);
    return { success: false, error };
  }
}

export async function sendBundlePurchaseEmail(
  userEmail: string,
  userName: string,
  packageData: any,
  paymentMethod: string
) {
  try {
    console.log('📧 Triggering bundle purchase email...', {
      to: userEmail,
      package: packageData.name,
      amount: packageData.price
    });

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'bundle_purchase',
        recipientEmail: userEmail,
        recipientName: userName,
        data: {
          packageName: packageData.name,
          credits: packageData.credits,
          durationDays: packageData.duration_days,
          amount: packageData.price || 0,
          paymentMethod: paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                        paymentMethod === 'promptpay' ? 'PromptPay' : 'Other'
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const result = await response.json();
    console.log('✅ Bundle purchase email triggered successfully!', result);

    return { success: true };
  } catch (error) {
    console.error('❌ Bundle purchase email failed:', error);
    return { success: false, error };
  }
}
