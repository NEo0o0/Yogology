# 📧 Email Notification System - Implementation Guide

## OVERVIEW

This document outlines the email notification infrastructure for the Annie Bliss booking system. The system sends automated emails for booking confirmations, payment reminders, and class updates.

---

## ARCHITECTURE

### **Email Service Options**

#### Option 1: Supabase Edge Functions + Resend (Recommended)
- **Pros:** Native integration, serverless, scalable, affordable
- **Cons:** Requires Supabase project setup
- **Cost:** Resend free tier: 3,000 emails/month

#### Option 2: Next.js API Routes + SendGrid
- **Pros:** Full control, rich features, reliable
- **Cons:** More setup, higher cost
- **Cost:** SendGrid free tier: 100 emails/day

#### Option 3: Next.js API Routes + Nodemailer + Gmail
- **Pros:** Free, simple for small scale
- **Cons:** Gmail limits (500/day), less reliable
- **Cost:** Free

**Recommended:** Supabase Edge Functions + Resend

---

## IMPLEMENTATION STRUCTURE

### **1. Email Templates**

**File Structure:**
```
src/
├── emails/
│   ├── templates/
│   │   ├── BookingConfirmation.tsx
│   │   ├── PaymentReminder.tsx
│   │   ├── PaymentVerified.tsx
│   │   └── ClassCancellation.tsx
│   └── utils/
│       ├── sendEmail.ts
│       └── emailConfig.ts
```

### **2. Booking Confirmation Email Template**

**File:** `src/emails/templates/BookingConfirmation.tsx`

```tsx
import * as React from 'react';

interface BookingConfirmationProps {
  userName: string;
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
}

export const BookingConfirmationEmail = ({
  userName,
  className,
  classDate,
  classTime,
  location,
  instructor,
  paymentMethod,
  paymentStatus,
  amount,
  bookingId,
  profileUrl
}: BookingConfirmationProps) => (
  <html>
    <head>
      <style>{`
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B9D83 0%, #B88B7D 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .detail-box { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; 
                      border-left: 4px solid #8B9D83; }
        .button { display: inline-block; padding: 12px 30px; background: #8B9D83; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; 
                        font-size: 12px; font-weight: bold; }
        .status-pending { background: #FEF3C7; color: #92400E; }
        .status-paid { background: #D1FAE5; color: #065F46; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      `}</style>
    </head>
    <body>
      <div className="container">
        <div className="header">
          <h1>🧘‍♀️ Booking Confirmed!</h1>
          <p>Thank you for booking with Annie Bliss Yoga Studio</p>
        </div>
        
        <div className="content">
          <p>Hi {userName},</p>
          <p>Your booking has been confirmed! We're excited to see you in class.</p>
          
          <div className="detail-box">
            <h3>📅 Class Details</h3>
            <p><strong>Class:</strong> {className}</p>
            <p><strong>Date:</strong> {classDate}</p>
            <p><strong>Time:</strong> {classTime}</p>
            <p><strong>Location:</strong> {location}</p>
            <p><strong>Instructor:</strong> {instructor}</p>
          </div>
          
          <div className="detail-box">
            <h3>💳 Payment Information</h3>
            <p><strong>Booking ID:</strong> #{bookingId}</p>
            <p><strong>Amount:</strong> ฿{amount.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> {paymentMethod}</p>
            <p>
              <strong>Status:</strong> 
              <span className={`status-badge ${paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}`}>
                {paymentStatus === 'paid' ? '✓ Paid' : 
                 paymentStatus === 'pending_verification' ? '⏳ Pending Verification' : 
                 '⚠️ Payment Required'}
              </span>
            </p>
          </div>
          
          {paymentStatus !== 'paid' && (
            <div className="detail-box" style={{ background: '#FEF3C7', borderColor: '#F59E0B' }}>
              <h3>⚠️ Action Required</h3>
              <p>Please upload your payment slip to complete your booking:</p>
              <a href={profileUrl} className="button">Upload Payment Slip</a>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Or visit your profile at: {profileUrl}
              </p>
            </div>
          )}
          
          <div className="detail-box">
            <h3>📝 What to Bring</h3>
            <ul>
              <li>Yoga mat (or rent one at the studio)</li>
              <li>Water bottle</li>
              <li>Towel</li>
              <li>Comfortable workout clothes</li>
            </ul>
            <p><em>Please arrive 10 minutes early for check-in.</em></p>
          </div>
          
          <a href={profileUrl} className="button">View My Bookings</a>
        </div>
        
        <div className="footer">
          <p>Annie Bliss Yoga Studio</p>
          <p>Questions? Reply to this email or contact us at info@anniebliss.com</p>
          <p style={{ fontSize: '10px', marginTop: '20px' }}>
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    </body>
  </html>
);
```

### **3. Email Sending Service**

**File:** `src/emails/utils/sendEmail.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Annie Bliss Yoga <bookings@anniebliss.com>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error };
  }
}
```

### **4. Booking Confirmation Trigger**

**File:** `src/hooks/useBookings.ts` (Update createBooking function)

```typescript
const createBooking = async (bookingData: BookingWithPayment) => {
  try {
    setLoading(true);
    
    // ... existing booking logic ...
    
    const result = await createBooking(bookingData);

    if (result.error) {
      throw result.error;
    }

    // Send confirmation email
    if (result.data && user?.email) {
      await sendBookingConfirmationEmail({
        userEmail: user.email,
        userName: user.user_metadata?.full_name || user.email,
        booking: result.data,
        classData: classData
      });
    }

    await fetchBookings();
    return { data, error: null };
  } catch (err) {
    // ... error handling ...
  }
};
```

### **5. Email Helper Function**

**File:** `src/emails/utils/sendBookingConfirmation.ts`

```typescript
import { sendEmail } from './sendEmail';
import { BookingConfirmationEmail } from '../templates/BookingConfirmation';
import { renderToString } from 'react-dom/server';

interface SendBookingConfirmationParams {
  userEmail: string;
  userName: string;
  booking: any;
  classData: any;
}

export async function sendBookingConfirmationEmail({
  userEmail,
  userName,
  booking,
  classData
}: SendBookingConfirmationParams) {
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profile`;
  
  const emailHtml = renderToString(
    BookingConfirmationEmail({
      userName,
      className: classData.title,
      classDate: new Date(classData.starts_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      classTime: classData.time,
      location: classData.room,
      instructor: classData.instructor,
      paymentMethod: booking.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                     booking.payment_method === 'promptpay' ? 'PromptPay' :
                     booking.payment_method === 'cash' ? 'Cash' : 'Package Credit',
      paymentStatus: booking.payment_status,
      amount: booking.amount_due,
      bookingId: booking.id,
      profileUrl
    })
  );

  return sendEmail({
    to: userEmail,
    subject: `Booking Confirmed: ${classData.title}`,
    html: emailHtml
  });
}
```

---

## SETUP INSTRUCTIONS

### **Step 1: Install Dependencies**

```bash
npm install resend react-email @react-email/components
```

### **Step 2: Configure Environment Variables**

**File:** `.env.local`

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://anniebliss.com
```

### **Step 3: Setup Resend Account**

1. Sign up at https://resend.com
2. Verify your domain (or use resend.dev for testing)
3. Get API key from dashboard
4. Add API key to `.env.local`

### **Step 4: Create Supabase Edge Function (Optional)**

**File:** `supabase/functions/send-booking-email/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { bookingId, userEmail, userName, classData } = await req.json();
    
    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Annie Bliss Yoga <bookings@anniebliss.com>',
        to: [userEmail],
        subject: `Booking Confirmed: ${classData.title}`,
        html: generateEmailHtml({ userName, classData, bookingId })
      })
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

---

## EMAIL TRIGGERS

### **1. Booking Confirmation**
- **Trigger:** After successful booking creation
- **Recipients:** User who made the booking
- **Content:** Class details, payment status, upload slip link

### **2. Payment Verification**
- **Trigger:** After admin approves payment slip
- **Recipients:** User
- **Content:** Payment confirmed, booking secured

### **3. Payment Reminder**
- **Trigger:** 24 hours before class if payment still unpaid
- **Recipients:** Users with unpaid bookings
- **Content:** Reminder to upload slip or pay cash

### **4. Class Cancellation**
- **Trigger:** When class is cancelled by admin
- **Recipients:** All booked users
- **Content:** Cancellation notice, refund information

---

## TESTING

### **Test Email Sending**

```typescript
// Test in development
import { sendBookingConfirmationEmail } from '@/emails/utils/sendBookingConfirmation';

await sendBookingConfirmationEmail({
  userEmail: 'test@example.com',
  userName: 'Test User',
  booking: {
    id: 123,
    payment_method: 'bank_transfer',
    payment_status: 'pending_verification',
    amount_due: 500
  },
  classData: {
    title: 'Vinyasa Flow',
    starts_at: '2026-01-20T10:00:00',
    time: '10:00 AM',
    room: 'Studio A',
    instructor: 'Annie'
  }
});
```

---

## DEPLOYMENT CHECKLIST

- [ ] Install email dependencies
- [ ] Configure Resend API key
- [ ] Verify domain with Resend
- [ ] Create email templates
- [ ] Implement sendEmail utility
- [ ] Add email trigger to createBooking
- [ ] Test email sending in development
- [ ] Test email delivery in production
- [ ] Set up email monitoring/logging
- [ ] Configure email rate limits

---

## FUTURE ENHANCEMENTS

1. **Email Queue System**
   - Use BullMQ or similar for reliable delivery
   - Retry failed emails automatically

2. **Email Analytics**
   - Track open rates
   - Track click-through rates
   - Monitor delivery success

3. **Personalization**
   - User preferences for email frequency
   - Opt-in/opt-out management
   - Language preferences

4. **Additional Email Types**
   - Class reminder (1 hour before)
   - Feedback request (after class)
   - Package expiration warning
   - Birthday/anniversary greetings

---

## COST ESTIMATION

**Resend Pricing:**
- Free tier: 3,000 emails/month
- Pro: $20/month for 50,000 emails
- Enterprise: Custom pricing

**Expected Usage:**
- ~100 bookings/day = 3,000 emails/month (confirmation only)
- With reminders/updates: ~6,000 emails/month
- **Recommended Plan:** Pro ($20/month)

---

## SUPPORT & DOCUMENTATION

- **Resend Docs:** https://resend.com/docs
- **React Email:** https://react.email
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

---

**Status:** Ready for implementation
**Priority:** High (improves user experience significantly)
**Estimated Time:** 4-6 hours for full implementation
