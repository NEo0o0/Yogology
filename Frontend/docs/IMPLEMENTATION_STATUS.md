# Booking & Payment System Implementation Status

## ✅ COMPLETED

### 1. Database & Backend ✅
- **File:** `supabase/migrations/booking_payment_system.sql`
- Created helper function `check_user_active_package()`
- Created helper function `get_todays_class_bookings()`
- Added RLS policies for payment updates
- Added indexes for performance

**Action Required:** Run this SQL migration in Supabase

### 2. useBookings Hook - Enhanced ✅
- **File:** `src/hooks/useBookings.ts`
- ✅ Added `checkUserPackage()` function
- ✅ Implemented **upsert logic** for re-booking (fixes 400 error)
- ✅ Added `updateBookingPayment()` function
- ✅ Enhanced `createBooking()` to support:
  - Package bookings
  - Drop-in bookings with payment methods
  - Guest bookings (name + contact)
  - Payment status tracking
- ✅ Checks for cancelled bookings and reactivates them instead of creating duplicates

### 3. PaymentMethodSelector Component ✅
- **File:** `src/components/PaymentMethodSelector.tsx`
- ✅ Package credit option (shows remaining credits)
- ✅ Bank transfer with account details modal
- ✅ PromptPay/QR code option
- ✅ Cash payment (regular classes only)
- ✅ Workshop restriction (transfer only)
- ✅ Payment note/reference field

### 4. ClassDetailsModal - Enhanced ✅
- **File:** `src/components/ClassDetailsModal.tsx`
- ✅ Fixed image rendering: `cover_image_url` → `class_types.cover_image_url` → gradient
- ✅ Integrated PaymentMethodSelector
- ✅ Checks user package on load
- ✅ Shows payment options before booking
- ✅ Handles all payment methods (package/cash/transfer/promptpay)
- ✅ Back button to return from payment selector

---

## 🔄 IN PROGRESS / PENDING

### 5. ScheduleCalendar - Image Fix 🔄
- **File:** `src/components/ScheduleCalendar.tsx`
- **Status:** Needs update
- **Required:** Ensure class cards pull `cover_image_url` with fallback to `class_types.cover_image_url`

### 6. EventDetailModal - Workshop Payments 🔄
- **File:** `src/components/EventDetailModal.tsx`
- **Status:** Needs update
- **Required:**
  - Restrict to transfer-only payments
  - Add "Manual Register" button for admins
  - Guest booking form (name, contact, payment received toggle)

### 7. User Profile - Payment Updates 🔄
- **File:** `src/app/profile/page.tsx`
- **Status:** Needs update
- **Required:**
  - Display upcoming bookings with payment status
  - "Update Payment" button for cash bookings
  - Allow switching from cash to transfer
  - Payment slip upload functionality

### 8. AdminDashboard - Payment Tracking 🔄
- **File:** `src/components/AdminDashboard.tsx`
- **Status:** Needs update
- **Required:**
  - Add payment status badges to Today's Classes:
    - 🟢 Green: Paid/Package
    - 🟡 Yellow: Cash Pending
    - 🔴 Red: Overdue
  - Update revenue calculation (paid bookings only)
  - Filter by payment status

---

## 📋 IMPLEMENTATION DETAILS

### Payment Status Badge Logic
```typescript
const getPaymentStatusBadge = (booking) => {
  if (booking.payment_status === 'paid' || booking.kind === 'package') {
    return { color: 'green', label: 'Paid', icon: '✓' };
  }
  if (booking.payment_method === 'cash' && booking.payment_status === 'unpaid') {
    return { color: 'yellow', label: 'Cash Pending', icon: '💵' };
  }
  if (booking.payment_status === 'unpaid' && isPastDue(booking)) {
    return { color: 'red', label: 'Overdue', icon: '⚠️' };
  }
  return { color: 'gray', label: 'Pending', icon: '⏳' };
};
```

### Booking Flow Summary

**Regular Class:**
1. User clicks "Book This Class"
2. System checks for active package
3. Shows PaymentMethodSelector with options:
   - Package (if available) → Immediate booking, credit deducted
   - Transfer → Shows bank details, marks as pending
   - Cash → Marks as unpaid, allows booking
4. Creates booking with payment info
5. Shows confirmation

**Workshop:**
1. User clicks "Register"
2. Shows transfer payment only
3. Displays bank details
4. Marks as pending until admin confirms

**Guest Booking (Admin):**
1. Admin clicks "Manual Register"
2. Enters guest name and contact
3. Selects payment method
4. Toggles "Payment Received" if paid
5. Creates guest booking

---

## 🚀 NEXT STEPS

### Priority 1: Complete Core Features
1. Update ScheduleCalendar image rendering
2. Update EventDetailModal for workshops
3. Update User Profile with payment updates

### Priority 2: Admin Features
4. Update AdminDashboard with payment badges
5. Add manual booking to detail modals

### Priority 3: Testing
6. Test package credit booking
7. Test drop-in with all payment methods
8. Test workshop transfer-only
9. Test guest booking
10. Test payment updates
11. Test re-booking (upsert logic)

---

## 🔧 TECHNICAL NOTES

### Database Schema (Already Exists)
- `bookings.payment_method` - cash, bank_transfer, promptpay, card, other
- `bookings.payment_status` - unpaid, partial, paid, waived, refunded
- `bookings.kind` - package, dropin
- `bookings.guest_name`, `bookings.guest_contact` - for guest bookings
- `bookings.user_package_id` - links to package
- `bookings.amount_due`, `bookings.amount_paid` - financial tracking

### Re-booking Fix (Upsert Logic)
The `createBooking` function now checks for existing cancelled bookings:
```typescript
const { data: existingBooking } = await supabase
  .from('bookings')
  .select('id, status')
  .eq('user_id', bookingData.user_id)
  .eq('class_id', bookingData.class_id)
  .eq('status', 'cancelled')
  .maybeSingle();

if (existingBooking) {
  // Re-activate instead of creating new
  return updateBooking(existingBooking.id, { status: 'booked', ... });
}
```

This prevents the 400 error from unique constraint violations.

---

## 📝 FILES MODIFIED

1. ✅ `supabase/migrations/booking_payment_system.sql` - Created
2. ✅ `src/components/PaymentMethodSelector.tsx` - Created
3. ✅ `src/hooks/useBookings.ts` - Enhanced
4. ✅ `src/components/ClassDetailsModal.tsx` - Enhanced
5. 🔄 `src/components/ScheduleCalendar.tsx` - Pending
6. 🔄 `src/components/EventDetailModal.tsx` - Pending
7. 🔄 `src/app/profile/page.tsx` - Pending
8. 🔄 `src/components/AdminDashboard.tsx` - Pending

---

## ⚠️ IMPORTANT REMINDERS

1. **Run SQL Migration:** Execute `booking_payment_system.sql` in Supabase
2. **Test Re-booking:** Verify cancelled bookings can be re-booked without errors
3. **Test Package Credits:** Ensure credits are deducted correctly
4. **Test Payment Flow:** Verify all payment methods work
5. **Admin Permissions:** Ensure RLS policies allow admin actions
