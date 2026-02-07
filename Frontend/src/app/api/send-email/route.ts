import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { Resend } from 'resend';

interface EmailRequest {
  type: 'booking_confirmation' | 'bundle_purchase' | 'payment_verified' | 'slip_uploaded';
  recipientEmail: string;
  recipientName: string;
  data: {
    className?: string;
    classDate?: string;
    classTime?: string;
    location?: string;
    instructor?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    amount?: number;
    bookingId?: number;
    packageName?: string;
    credits?: number;
    durationDays?: number;
    isPackageBooking?: boolean;
    creditsRemaining?: number;
    isUnlimited?: boolean;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EmailRequest;
    const { type, recipientEmail, recipientName, data } = body;

    if (!recipientEmail || !recipientName || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate email HTML based on type
    let subject = '';
    let htmlContent = '';
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://annieblissyoga.com'}/profile`;

    switch (type) {
      case 'booking_confirmation':
        subject = `ยืนยันการจองคลาส ${data.className} 🧘‍♀️ | Booking Confirmed: ${data.className}`;
        htmlContent = generateBookingConfirmationEmail({
          recipientName,
          className: data.className || '',
          classDate: data.classDate || '',
          classTime: data.classTime || '',
          location: data.location || '',
          instructor: data.instructor || '',
          paymentMethod: data.paymentMethod || '',
          paymentStatus: data.paymentStatus || '',
          amount: data.amount || 0,
          bookingId: data.bookingId || 0,
          profileUrl,
          isPackageBooking: data.isPackageBooking,
          packageName: data.packageName,
          creditsRemaining: data.creditsRemaining,
          isUnlimited: data.isUnlimited,
        });
        break;

      case 'slip_uploaded':
        subject = `เราได้รับสลิปการชำระเงินแล้ว 📄 | Payment Slip Received: ${data.className}`;
        htmlContent = generateSlipUploadedEmail({
          recipientName,
          className: data.className || '',
          classDate: data.classDate || '',
          classTime: data.classTime || '',
          bookingId: data.bookingId || 0,
          profileUrl,
        });
        break;

      case 'bundle_purchase':
        subject = `Package Purchase Confirmation: ${data.packageName}`;
        htmlContent = generateBundlePurchaseEmail({
          recipientName,
          packageName: data.packageName || '',
          credits: data.credits,
          durationDays: data.durationDays,
          amount: data.amount || 0,
          paymentMethod: data.paymentMethod || '',
          profileUrl,
        });
        break;

      case 'payment_verified':
        subject = `ยืนยันการชำระเงินคลาส ${data.className || 'Yoga Class'} 🙏✨ | Payment Confirmed: ${data.className || 'Yoga Class'}`;
        htmlContent = generatePaymentVerifiedEmail({
          recipientName,
          className: data.className,
          classDate: data.classDate,
          classTime: data.classTime,
          packageName: data.packageName,
          amount: data.amount || 0,
          profileUrl,
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured. Email not sent.');
      console.log('📧 Email would be sent:', {
        from: 'Annie Bliss Yoga <booking@annieblissyoga.com>',
        to: recipientEmail,
        subject,
      });
      return NextResponse.json({
        success: true,
        message: 'Email queued (API key not configured)',
      });
    }

    const resend = new Resend(resendApiKey);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Annie Bliss Yoga <booking@annieblissyoga.com>',
      to: recipientEmail,
      subject,
      html: htmlContent,
    });

    if (emailError) {
      console.error('❌ Email send failed:', emailError);
      throw new Error(emailError.message || 'Failed to send email');
    }

    console.log('✅ Email sent successfully:', {
      emailId: emailData?.id,
      to: recipientEmail,
      subject,
      type,
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: emailData?.id,
    });
  } catch (error: any) {
    console.error('❌ Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

function generateBookingConfirmationEmail(params: {
  recipientName: string;
  className: string;
  classDate: string;
  classTime: string;
  location: string;
  instructor: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  bookingId: number;
  profileUrl: string;
  isPackageBooking?: boolean;
  packageName?: string;
  creditsRemaining?: number;
  isUnlimited?: boolean;
}): string {
  const {
    recipientName,
    className,
    classDate,
    classTime,
    location,
    instructor,
    paymentMethod,
    paymentStatus,
    amount,
    bookingId,
    profileUrl,
    isPackageBooking,
    packageName,
    creditsRemaining,
    isUnlimited,
  } = params;

  const needsPayment = paymentStatus !== 'paid';
  const statusBadge = paymentStatus === 'paid' || isPackageBooking
    ? '<span style="background: #D1FAE5; color: #065F46; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">✓ Paid</span>'
    : paymentStatus === 'partial'
    ? '<span style="background: #DBEAFE; color: #1E40AF; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">⏳ Pending Verification</span>'
    : '<span style="background: #FEF3C7; color: #92400E; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">⚠️ Payment Required</span>';

  const packageInfoText = isPackageBooking && packageName
    ? `<p><strong>Package Used:</strong> ${packageName}${isUnlimited ? ' (Unlimited)' : creditsRemaining !== undefined ? ` (${creditsRemaining} credits remaining)` : ''}</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #8B9D83 0%, #B88B7D 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .content { padding: 30px; }
    .detail-box { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #8B9D83; }
    .detail-box h3 { margin: 0 0 15px 0; color: #8B9D83; font-size: 16px; }
    .detail-box p { margin: 8px 0; }
    .detail-box strong { color: #333; }
    .button { display: inline-block; padding: 14px 32px; background: #8B9D83; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #B88B7D; }
    .warning-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .warning-box h3 { margin: 0 0 10px 0; color: #92400E; }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 14px; background: #f9f9f9; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧘‍♀️ Booking Confirmed!</h1>
      <p>Thank you for booking with Annie Bliss Yoga Studio</p>
    </div>
    
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>Your booking has been confirmed! We're excited to see you in class.</p>
      
      <div class="detail-box">
        <h3>📅 Class Details</h3>
        <p><strong>Class:</strong> ${className}</p>
        <p><strong>Date:</strong> ${classDate}</p>
        <p><strong>Time:</strong> ${classTime}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Instructor:</strong> ${instructor}</p>
      </div>
      
      <div class="detail-box">
        <h3>💳 Payment Information</h3>
        <p><strong>Booking ID:</strong> #${bookingId}</p>
        <p><strong>Amount:</strong> ฿${amount.toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        ${packageInfoText}
        <p><strong>Status:</strong> ${statusBadge}</p>
      </div>
      
      ${needsPayment ? `
      <div class="warning-box">
        <h3>⚠️ Action Required</h3>
        <p>Please upload your payment slip to complete your booking:</p>
        <a href="${profileUrl}" class="button">Upload Payment Slip</a>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
          Or visit your profile at: ${profileUrl}
        </p>
      </div>
      ` : ''}
      
      <div class="detail-box">
        <h3>📝 What to Bring</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Yoga mat (or rent one at the studio)</li>
          <li>Water bottle</li>
          <li>Towel</li>
          <li>Comfortable workout clothes</li>
        </ul>
        <p style="font-style: italic; color: #666;">Please arrive 10 minutes early for check-in.</p>
      </div>
      
      <a href="${profileUrl}" class="button">View My Bookings</a>
    </div>
    
    <div class="footer">
      <p><strong>Annie Bliss Yoga Studio</strong></p>
      <p>Questions? Reply to this email or contact us at info@annieblissyoga.com</p>
      <p style="font-size: 12px; margin-top: 20px; color: #999;">
        This is an automated email. Please do not reply directly to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateSlipUploadedEmail(params: {
  recipientName: string;
  className: string;
  classDate: string;
  classTime: string;
  bookingId: number;
  profileUrl: string;
}): string {
  const { recipientName, className, classDate, classTime, bookingId, profileUrl } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #8B9D83 0%, #B88B7D 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .content { padding: 30px; }
    .detail-box { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #8B9D83; }
    .detail-box h3 { margin: 0 0 15px 0; color: #8B9D83; font-size: 16px; }
    .detail-box p { margin: 8px 0; }
    .info-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 14px; background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Payment Slip Received!</h1>
      <p>เราได้รับสลิปการชำระเงินแล้ว</p>
    </div>
    
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>สวัสดีค่ะ คุณ ${recipientName},</p>
      
      <div class="info-box">
        <h3 style="margin: 0 0 10px 0; color: #1E40AF;">✓ Payment Slip Received | ได้รับสลิปแล้ว</h3>
        <p style="color: #1E3A8A; margin: 0;">
          We have received your payment slip and are currently verifying it. 
          You'll receive a confirmation email once the payment is approved (usually within 24 hours).
        </p>
        <p style="color: #1E3A8A; margin: 10px 0 0 0;">
          เราได้รับสลิปการชำระเงินของคุณแล้ว และกำลังตรวจสอบอยู่ 
          คุณจะได้รับอีเมลยืนยันเมื่อการชำระเงินได้รับการอนุมัติ (โดยปกติภายใน 24 ชั่วโมง)
        </p>
      </div>
      
      <div class="detail-box">
        <h3>📅 Class Details | รายละเอียดคลาส</h3>
        <p><strong>Class:</strong> ${className}</p>
        <p><strong>Date:</strong> ${classDate}</p>
        <p><strong>Time:</strong> ${classTime}</p>
        <p><strong>Booking ID:</strong> #${bookingId}</p>
        <p><strong>Status:</strong> <span style="background: #DBEAFE; color: #1E40AF; padding: 4px 8px; border-radius: 12px; font-size: 12px;">⏳ Verifying</span></p>
      </div>
      
      <div class="detail-box">
        <h3>📝 Next Steps | ขั้นตอนถัดไป</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Our admin will verify your payment slip</li>
          <li>You'll receive a confirmation email once approved</li>
          <li>Your spot will be secured after verification</li>
        </ul>
        <p style="margin-top: 15px; color: #666; font-size: 14px;">
          แอดมินจะตรวจสอบสลิปของคุณและส่งอีเมลยืนยันเมื่อได้รับการอนุมัติ
        </p>
      </div>
      
      <a href="${profileUrl}" style="display: inline-block; padding: 14px 32px; background: #8B9D83; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">View My Bookings | ดูการจองของฉัน</a>
    </div>
    
    <div class="footer">
      <p><strong>Annie Bliss Yoga Studio</strong></p>
      <p>Questions? | มีคำถาม?</p>
      <p>Contact us at info@annieblissyoga.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateBundlePurchaseEmail(params: {
  recipientName: string;
  packageName: string;
  credits?: number;
  durationDays?: number;
  amount: number;
  paymentMethod: string;
  profileUrl: string;
}): string {
  const { recipientName, packageName, credits, durationDays, amount, paymentMethod, profileUrl } = params;

  const packageDetails = credits
    ? `${credits} class credits`
    : `Unlimited classes for ${durationDays} days`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #8B9D83 0%, #B88B7D 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .content { padding: 30px; }
    .detail-box { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #8B9D83; }
    .detail-box h3 { margin: 0 0 15px 0; color: #8B9D83; font-size: 16px; }
    .detail-box p { margin: 8px 0; }
    .info-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 14px; background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Package Purchase Received!</h1>
      <p>Thank you for your purchase</p>
    </div>
    
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>We've received your package purchase. Your package will be activated once we verify your payment.</p>
      
      <div class="detail-box">
        <h3>📦 Package Details</h3>
        <p><strong>Package:</strong> ${packageName}</p>
        <p><strong>Includes:</strong> ${packageDetails}</p>
        <p><strong>Amount:</strong> ฿${amount.toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      </div>
      
      <div class="info-box">
        <h3 style="margin: 0 0 10px 0; color: #1E40AF;">⏳ Pending Activation</h3>
        <p style="color: #1E3A8A; margin: 0;">
          Your package will be activated within 24 hours after we verify your payment. 
          You'll receive a confirmation email once it's ready to use.
        </p>
      </div>
      
      <div class="detail-box">
        <h3>📝 Next Steps</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Check your profile for package status updates</li>
          <li>Once activated, you can start booking classes</li>
          <li>Your credits/access will be available immediately after activation</li>
        </ul>
      </div>
      
      <a href="${profileUrl}" style="display: inline-block; padding: 14px 32px; background: #8B9D83; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">View My Packages</a>
    </div>
    
    <div class="footer">
      <p><strong>Annie Bliss Yoga Studio</strong></p>
      <p>Questions? Reply to this email or contact us at info@annieblissyoga.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePaymentVerifiedEmail(params: {
  recipientName: string;
  className?: string;
  classDate?: string;
  classTime?: string;
  packageName?: string;
  amount: number;
  profileUrl: string;
}): string {
  const { recipientName, className, classDate, classTime, packageName, amount, profileUrl } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #7D8B7E 0%, #5A6B5C 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; margin-bottom: 20px; color: #2d3748; }
    .success-box { background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-left: 4px solid #7D8B7E; padding: 25px; margin: 25px 0; border-radius: 8px; }
    .success-box h2 { margin: 0 0 15px 0; color: #2d5016; font-size: 20px; }
    .success-box p { margin: 0; color: #2d5016; font-size: 15px; line-height: 1.6; }
    .details-box { background: #f8f9fa; border: 2px solid #7D8B7E; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .details-box h3 { margin: 0 0 15px 0; color: #7D8B7E; font-size: 16px; font-weight: 600; }
    .details-box p { margin: 8px 0; color: #4a5568; }
    .details-box strong { color: #2d3748; }
    .divider { height: 2px; background: linear-gradient(to right, transparent, #7D8B7E, transparent); margin: 30px 0; }
    .button { display: inline-block; padding: 14px 32px; background: #7D8B7E; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; transition: background 0.3s; }
    .button:hover { background: #5A6B5C; }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 14px; background: #f8f9fa; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 5px 0; }
    .emoji { font-size: 24px; }
    @media only screen and (max-width: 600px) {
      .content { padding: 25px 20px; }
      .header { padding: 30px 20px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">🙏✨</div>
      <h1>ยืนยันการชำระเงิน | Payment Confirmed</h1>
      <p>การชำระเงินของคุณได้รับการยืนยันแล้ว</p>
    </div>
    
    <div class="content">
      <!-- Thai Version -->
      <div class="greeting">สวัสดีค่ะ คุณ ${recipientName},</div>
      
      <div class="success-box">
        <h2>🧘‍♀️ ข่าวดีค่ะ!</h2>
        <p>
          แอดมินตรวจสอบข้อมูลการชำระเงินสำหรับคลาส <strong>${className || packageName || 'Yoga Class'}</strong> เรียบร้อยแล้ว 
          ตอนนี้ที่นั่งของคุณถูกล็อคไว้แน่นอนแล้วค่ะ 🧘‍♀️✨
        </p>
      </div>
      
      ${className ? `
      <div class="details-box">
        <h3>📋 รายละเอียดคลาสของคุณ:</h3>
        <p><strong>คลาส:</strong> ${className}</p>
        ${classDate ? `<p><strong>วันที่:</strong> ${classDate}</p>` : ''}
        ${classTime ? `<p><strong>เวลา:</strong> ${classTime}</p>` : ''}
        <p><strong>สถานะ:</strong> <span style="color: #2d5016; font-weight: 600;">ชำระเงินเรียบร้อยแล้ว (Paid)</span></p>
      </div>
      
      <p style="background: #FFF9E6; padding: 15px; border-left: 4px solid #F59E0B; border-radius: 4px; margin: 20px 0;">
        <strong>💡 สิ่งที่ต้องเตรียมมา:</strong><br>
        ชุดที่ยืดหยุ่น, น้ำดื่มส่วนตัว และเตรียมใจให้สบาย แล้วมาผ่อนคลายด้วยกันนะคะ!
      </p>
      ` : ''}
      
      <div class="divider"></div>
      
      <!-- English Version -->
      <div class="greeting">Hi ${recipientName},</div>
      
      <div class="success-box">
        <h2>🧘‍♂️ Great News!</h2>
        <p>
          We have successfully verified your payment for <strong>${className || packageName || 'Yoga Class'}</strong>. 
          Your spot is now fully confirmed! 🧘‍♂️✨
        </p>
      </div>
      
      ${className ? `
      <div class="details-box">
        <h3>📋 Your Booking Details:</h3>
        <p><strong>Class:</strong> ${className}</p>
        ${classDate ? `<p><strong>Date:</strong> ${classDate}</p>` : ''}
        ${classTime ? `<p><strong>Time:</strong> ${classTime}</p>` : ''}
        <p><strong>Status:</strong> <span style="color: #2d5016; font-weight: 600;">Paid</span></p>
      </div>
      
      <p style="background: #FFF9E6; padding: 15px; border-left: 4px solid #F59E0B; border-radius: 4px; margin: 20px 0;">
        <strong>💡 What to Bring:</strong><br>
        Stretchy yoga wear, a water bottle, and get ready to relax!
      </p>
      ` : ''}
      
      <p style="text-align: center; margin: 30px 0 20px 0;">
        <strong>Amount Paid | จำนวนเงินที่ชำระ:</strong><br>
        <span style="font-size: 24px; color: #7D8B7E; font-weight: 600;">฿${amount.toLocaleString()}</span>
      </p>
      
      <div style="text-align: center;">
        <a href="${profileUrl}" class="button">View My Account | ดูบัญชีของฉัน</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Annie Bliss Yoga Studio</strong></p>
      <p>Questions? | มีคำถาม?</p>
      <p>Contact us at info@annieblissyoga.com</p>
    </div>
  </div>
</body>
</html>
  `;
}
