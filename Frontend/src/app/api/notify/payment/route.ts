import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userName, itemName, status, rejectionReason, paidAmount, remainingBalance } = body;

    // Validate required fields
    if (!userId || !userName || !itemName || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create admin client with service role key for auth.admin access
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

    // Fetch user email from auth.users using service role
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authUser?.user?.email) {
      console.log('Email not available for user:', userId);
      return NextResponse.json(
        { success: true, message: 'Notification skipped - user has no email' },
        { status: 200 }
      );
    }

    const email = authUser.user.email;

    // Prepare email content based on status
    let subject = '';
    let htmlContent = '';
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://annieblissyoga.com'}/profile`;

    if (status === 'approved') {
      subject = '✅ Payment Approved - Annie Bliss Yoga';
      htmlContent = generatePaymentApprovedEmail({
        userName,
        itemName,
        profileUrl,
      });
    } else if (status === 'partial') {
      subject = '✅ Partial Payment Received - Annie Bliss Yoga';
      htmlContent = generatePartialPaymentEmail({
        userName,
        itemName,
        paidAmount: paidAmount || 0,
        remainingBalance: remainingBalance || 0,
        profileUrl,
      });
    } else if (status === 'rejected') {
      subject = '❌ Payment Verification Required - Annie Bliss Yoga';
      htmlContent = generatePaymentRejectedEmail({
        userName,
        itemName,
        rejectionReason: rejectionReason || 'Payment slip could not be verified',
        profileUrl,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved", "partial", or "rejected"' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error: resendError } = await resend.emails.send({
      from: 'Annie Bliss Yoga <onboarding@resend.dev>',
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (resendError) {
      console.error('Resend error:', resendError);
      return NextResponse.json(
        { error: 'Failed to send email', details: resendError },
        { status: 500 }
      );
    }

    console.log('Email sent successfully to:', email);
    console.log('Resend response:', data);

    return NextResponse.json({
      success: true,
      message: 'Email notification sent successfully',
      emailId: data?.id,
    });
  } catch (error: any) {
    console.error('Error in payment notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}

function generatePaymentApprovedEmail(params: {
  userName: string;
  itemName: string;
  profileUrl: string;
}): string {
  const { userName, itemName, profileUrl } = params;

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
    .success-box { background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-left: 4px solid #4CAF50; padding: 25px; margin: 25px 0; border-radius: 8px; }
    .success-box h2 { margin: 0 0 15px 0; color: #2d5016; font-size: 20px; }
    .success-box p { margin: 0; color: #2d5016; font-size: 15px; line-height: 1.6; }
    .detail-box { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #8B9D83; }
    .detail-box h3 { margin: 0 0 15px 0; color: #8B9D83; font-size: 16px; }
    .detail-box p { margin: 8px 0; }
    .detail-box strong { color: #333; }
    .button { display: inline-block; padding: 14px 32px; background: #8B9D83; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #B88B7D; }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 14px; background: #f9f9f9; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Payment Approved!</h1>
      <p>Your payment has been verified</p>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      
      <div class="success-box">
        <h2>🎉 Great News!</h2>
        <p>
          Your payment has been approved and verified by our admin team.
          Your purchase of <strong>"${itemName}"</strong> is now active and ready to use!
        </p>
      </div>
      
      <div class="detail-box">
        <h3>✓ What's Next?</h3>
        <p>Your package/booking is now fully activated. You can:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>View your active packages in your profile</li>
          <li>Start booking classes with your credits</li>
          <li>Check your upcoming bookings</li>
        </ul>
      </div>
      
      <a href="${profileUrl}" class="button">Go to My Profile</a>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Thank you for choosing Annie Bliss Yoga! We look forward to seeing you in class. 🧘‍♀️
      </p>
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

function generatePartialPaymentEmail(params: {
  userName: string;
  itemName: string;
  paidAmount: number;
  remainingBalance: number;
  profileUrl: string;
}): string {
  const { userName, itemName, paidAmount, remainingBalance, profileUrl } = params;

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
    .partial-box { background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); border-left: 4px solid #FF9800; padding: 25px; margin: 25px 0; border-radius: 8px; }
    .partial-box h2 { margin: 0 0 15px 0; color: #E65100; font-size: 20px; }
    .partial-box p { margin: 0; color: #E65100; font-size: 15px; line-height: 1.6; }
    .detail-box { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #8B9D83; }
    .detail-box h3 { margin: 0 0 15px 0; color: #8B9D83; font-size: 16px; }
    .detail-box p { margin: 8px 0; }
    .detail-box strong { color: #333; }
    .amount-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
    .amount-row:last-child { border-bottom: none; font-weight: bold; color: #FF9800; }
    .button { display: inline-block; padding: 14px 32px; background: #FF9800; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #F57C00; }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 14px; background: #f9f9f9; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Partial Payment Received!</h1>
      <p>Thank you for your payment</p>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      
      <div class="partial-box">
        <h2>💰 Payment Verified</h2>
        <p>
          Thank you! We have received and verified your partial payment for <strong>"${itemName}"</strong>.
          Your payment slip has been approved.
        </p>
      </div>
      
      <div class="detail-box">
        <h3>💳 Payment Summary</h3>
        <div class="amount-row">
          <span>Amount Paid:</span>
          <span style="color: #4CAF50; font-weight: bold;">฿${paidAmount.toLocaleString()}</span>
        </div>
        <div class="amount-row">
          <span>Remaining Balance:</span>
          <span>฿${remainingBalance.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="detail-box">
        <h3>📝 Next Steps</h3>
        <p>To complete your purchase, please:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Make a payment for the remaining balance (฿${remainingBalance.toLocaleString()})</li>
          <li>Upload a new payment slip through your profile</li>
          <li>Wait for admin verification (usually within 24 hours)</li>
        </ul>
        <p style="margin-top: 15px; color: #666; font-size: 14px;">
          Your package will be activated once the full payment is received and verified.
        </p>
      </div>
      
      <a href="${profileUrl}" class="button">Upload Payment Slip</a>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Thank you for your payment! We appreciate your business. 🙏
      </p>
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

function generatePaymentRejectedEmail(params: {
  userName: string;
  itemName: string;
  rejectionReason: string;
  profileUrl: string;
}): string {
  const { userName, itemName, rejectionReason, profileUrl } = params;

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
    .warning-box { background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%); border-left: 4px solid #F44336; padding: 25px; margin: 25px 0; border-radius: 8px; }
    .warning-box h2 { margin: 0 0 15px 0; color: #C62828; font-size: 20px; }
    .warning-box p { margin: 0; color: #C62828; font-size: 15px; line-height: 1.6; }
    .detail-box { background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #8B9D83; }
    .detail-box h3 { margin: 0 0 15px 0; color: #8B9D83; font-size: 16px; }
    .detail-box p { margin: 8px 0; }
    .detail-box strong { color: #333; }
    .reason-box { background: #FFF9C4; border: 2px solid #FBC02D; padding: 15px; margin: 15px 0; border-radius: 8px; }
    .reason-box strong { color: #F57F17; }
    .button { display: inline-block; padding: 14px 32px; background: #F44336; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #D32F2F; }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 14px; background: #f9f9f9; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Payment Verification Required</h1>
      <p>Action needed for your payment</p>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      
      <div class="warning-box">
        <h2>⚠️ Payment Slip Could Not Be Verified</h2>
        <p>
          We were unable to verify your payment slip for <strong>"${itemName}"</strong>.
          Please review the reason below and re-upload a clear payment slip.
        </p>
      </div>
      
      <div class="reason-box">
        <p><strong>Reason:</strong> ${rejectionReason}</p>
      </div>
      
      <div class="detail-box">
        <h3>📝 What to Do Next</h3>
        <p>To complete your payment verification:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Take a clear photo of your payment slip</li>
          <li>Make sure all details are visible (date, amount, reference number)</li>
          <li>Upload the slip through your profile page</li>
          <li>Wait for admin verification (usually within 24 hours)</li>
        </ul>
      </div>
      
      <div class="detail-box">
        <h3>💡 Tips for a Clear Payment Slip</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Use good lighting when taking the photo</li>
          <li>Ensure the entire slip is visible in the frame</li>
          <li>Avoid blurry or cropped images</li>
          <li>Make sure the amount and date match your booking</li>
        </ul>
      </div>
      
      <a href="${profileUrl}" class="button">Re-upload Payment Slip</a>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        If you have any questions or need assistance, please don't hesitate to contact us. We're here to help! 🙏
      </p>
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
