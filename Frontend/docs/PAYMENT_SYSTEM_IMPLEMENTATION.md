# Advanced Booking and Payment System - Implementation Guide

## Overview
This document outlines the implementation of a comprehensive booking and payment system for Annie Bliss Yoga Studio.

## Database Schema (Already Exists)

### Bookings Table Columns:
- ✅ `payment_method` - enum: cash, bank_transfer, promptpay, card, other
- ✅ `payment_status` - enum: unpaid, partial, paid, waived, refunded
- ✅ `kind` - enum: package, dropin
- ✅ `guest_name`, `guest_contact` - for guest bookings
- ✅ `user_package_id` - links to package credit usage
- ✅ `amount_due`, `amount_paid` - financial tracking
- ✅ `paid_at`, `payment_note` - payment details

### Required SQL Migration:
Run `supabase/migrations/booking_payment_system.sql` to add:
- Helper functions for checking active packages
- Helper functions for today's class bookings
- RLS policies for payment updates

## Implementation Components

### 1. PaymentMethodSelector Component ✅
**File:** `src/components/PaymentMethodSelector.tsx`
**Status:** Created
**Features:**
- Package credit option (if user has active package)
- Bank transfer with account details
- PromptPay/QR code option
- Cash payment (regular classes only)
- Workshop restriction (transfer only)
- Payment note/reference field

### 2. ClassDetailsModal Updates
**File:** `src/components/ClassDetailsModal.tsx`
**Required Changes:**
- Check user's active package before booking
- Integrate PaymentMethodSelector
- Handle different payment flows:
  - Package: Deduct credit immediately
  - Transfer: Mark as pending, show confirmation
  - Cash: Mark as unpaid, allow booking
- Update booking creation to include payment info

### 3. EventDetailModal Updates
**File:** `src/components/EventDetailModal.tsx`
**Required Changes:**
- Restrict to transfer payment only
- Add "Manual Register" button for admins
- Guest booking form (name, contact, payment status)
- Admin can mark payment as received

### 4. User Profile - Payment Updates
**File:** `src/app/profile/page.tsx`
**Required Changes:**
- Display upcoming bookings with payment status
- "Update Payment" button for cash bookings
- Allow switching from cash to transfer
- Upload payment slip functionality

### 5. AdminDashboard Updates
**File:** `src/components/AdminDashboard.tsx`
**Required Changes:**
- Today's Classes section with payment badges:
  - 🟢 Green: Paid/Package
  - 🟡 Yellow: Cash Pending
  - 🔴 Red: Overdue
- Revenue calculation (paid bookings only)
- Filter by payment status

### 6. useBookings Hook Updates
**File:** `src/hooks/useBookings.ts`
**Required Changes:**
- `createBooking` - accept payment parameters
- `updateBookingPayment` - new function for payment updates
- `checkUserPackage` - new function to check active packages
- Handle package credit deduction
- Handle guest bookings

## Payment Flow Logic

### Regular Class Booking:
1. User clicks "Book This Class"
2. System checks for active package
3. Show PaymentMethodSelector with appropriate options
4. User selects payment method:
   - **Package:** Deduct credit, mark as paid, confirm immediately
   - **Transfer:** Show bank details, mark as pending, allow booking
   - **Cash:** Mark as unpaid, allow booking, remind to pay at studio
5. Create booking record with payment info
6. Show confirmation message

### Workshop Booking:
1. User clicks "Register"
2. Show transfer payment option only
3. Display bank details and QR code
4. Mark booking as pending until payment confirmed
5. Admin manually confirms payment

### Guest Booking (Admin):
1. Admin clicks "Manual Register"
2. Enter guest name and contact
3. Select payment method
4. Toggle "Payment Received" if already paid
5. Create booking with guest info

### Payment Update (User):
1. User views upcoming bookings in profile
2. Sees "Cash Pending" status
3. Clicks "Update Payment"
4. Switches to transfer method
5. Uploads payment slip
6. Admin confirms payment

## Payment Status Badge Colors

```typescript
const getPaymentStatusBadge = (booking) => {
  if (booking.payment_status === 'paid' || booking.kind === 'package') {
    return { color: 'green', label: 'Paid', icon: '✓' };
  }
  if (booking.payment_method === 'cash' && booking.payment_status === 'unpaid') {
    const isToday = isClassToday(booking.class.starts_at);
    return { 
      color: isToday ? 'yellow' : 'gray', 
      label: 'Cash Pending',
      icon: '💵'
    };
  }
  if (booking.payment_status === 'unpaid' && isPastDue(booking)) {
    return { color: 'red', label: 'Overdue', icon: '⚠️' };
  }
  return { color: 'gray', label: 'Pending', icon: '⏳' };
};
```

## Revenue Calculation

```typescript
const calculateRevenue = (bookings) => {
  return bookings
    .filter(b => b.payment_status === 'paid' || b.kind === 'package')
    .reduce((sum, b) => sum + b.amount_paid, 0);
};
```

## Implementation Priority

1. ✅ Database migration (SQL file created)
2. ✅ PaymentMethodSelector component (created)
3. 🔄 Update useBookings hook with payment logic
4. 🔄 Update ClassDetailsModal with payment selection
5. 🔄 Update EventDetailModal for workshops
6. 🔄 Update AdminDashboard with payment badges
7. 🔄 Update User Profile with payment updates

## Testing Checklist

- [ ] User with package can book using credits
- [ ] User without package sees transfer/cash options
- [ ] Workshop only shows transfer option
- [ ] Admin can create guest bookings
- [ ] User can update cash booking to transfer
- [ ] Admin sees correct payment badges
- [ ] Revenue calculation excludes unpaid bookings
- [ ] Payment slip upload works
- [ ] Email notifications include payment info

## Notes

- All payment amounts should be stored in the database
- Payment status should be updated atomically with booking creation
- Package credit deduction should be transactional
- Guest bookings should validate contact information
- Admin payment confirmation should log who confirmed and when
