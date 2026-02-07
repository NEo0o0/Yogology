# Newsletter, Manual Income, and Payment Configuration Implementation Guide

This guide documents the implementation of three major features for the Annie Bliss Yoga application.

## 🎯 Overview

1. **Newsletter System** - Email subscription management
2. **Manual Income Tracking** - Admin ability to add manual transactions
3. **Payment Method Configuration** - Flexible payment options per product type

---

## 📧 1. NEWSLETTER SYSTEM

### Database Setup

**Run this SQL in Supabase SQL Editor:**

```sql
-- File: database_migrations/001_create_subscribers_table.sql
-- Creates subscribers table with RLS policies
```

**Table Structure:**
- `id` (UUID, Primary Key)
- `email` (TEXT, Unique, Required)
- `is_active` (BOOLEAN, Default: true)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Frontend Components

**New Files Created:**
1. `src/hooks/useSubscribers.ts` - Hook for subscriber management
2. `src/components/Newsletter.tsx` - Newsletter subscription form
3. `src/app/admin/subscribers/page.tsx` - Admin page wrapper
4. `src/app/admin/subscribers/SubscribersClient.tsx` - Admin subscribers list

**Features:**
- ✅ Email validation
- ✅ Duplicate email prevention
- ✅ Real-time subscription
- ✅ Admin dashboard with search
- ✅ CSV export functionality
- ✅ Delete subscribers

**Usage:**

Add Newsletter component to any page:
```tsx
import { Newsletter } from '@/components/Newsletter';

<Newsletter />
```

Access admin panel at: `/admin/subscribers`

---

## 💰 2. MANUAL INCOME TRACKING

### Database Updates

**Run this SQL in Supabase SQL Editor:**

```sql
-- File: database_migrations/002_update_payments_for_manual_entries.sql
-- Updates payments table to support manual transactions
```

**New Columns Added to `payments` table:**
- `category` (TEXT) - class, workshop, product, package, other
- `payment_method` (TEXT) - cash, bank_transfer, promptpay, credit_card, other
- `description` (TEXT) - Additional notes
- `is_manual` (BOOLEAN) - Flag for manual entries
- `booking_id` - Now nullable

### Frontend Components

**New Files Created:**
1. `src/components/ManualTransactionModal.tsx` - Modal for adding transactions

**Features:**
- ✅ Date picker for transaction date
- ✅ Amount input with validation
- ✅ Category dropdown
- ✅ Payment method selection
- ✅ Description/notes field
- ✅ Automatic flagging as manual entry

**Integration Required:**

Add to your admin payments page:

```tsx
import { ManualTransactionModal } from '@/components/ManualTransactionModal';

const [showManualModal, setShowManualModal] = useState(false);

// Add button
<button onClick={() => setShowManualModal(true)}>
  + Add Transaction
</button>

// Add modal
<ManualTransactionModal
  isOpen={showManualModal}
  onClose={() => setShowManualModal(false)}
  onSuccess={() => {
    // Refresh payments list
    refetchPayments();
  }}
/>
```

**Financial Dashboard Updates:**

The dashboard will automatically include manual transactions since they're in the `payments` table. Ensure your queries don't filter out `is_manual = true` records.

---

## ⚙️ 3. PAYMENT METHOD CONFIGURATION

### Database Setup

**Run this SQL in Supabase SQL Editor:**

```sql
-- File: database_migrations/003_add_payment_config_to_settings.sql
-- Adds payment_config JSONB column to app_settings
```

**Default Configuration:**
```json
{
  "class_booking": {
    "bank_transfer": true,
    "promptpay": true,
    "credit_card": false,
    "contact_admin": false
  },
  "workshop": {
    "bank_transfer": true,
    "promptpay": true,
    "credit_card": false,
    "contact_admin": false
  },
  "teacher_training": {
    "bank_transfer": true,
    "promptpay": false,
    "credit_card": false,
    "contact_admin": true
  },
  "packages": {
    "bank_transfer": true,
    "promptpay": true,
    "credit_card": false,
    "contact_admin": false
  }
}
```

### Admin UI (To Be Implemented)

**Location:** `/admin/settings`

**Required Components:**

1. **Payment Methods Section** in Settings page
2. **Toggle switches** for each product type
3. **Save functionality** to update `app_settings.payment_config`

**Example Implementation:**

```tsx
// In your Settings component
const [paymentConfig, setPaymentConfig] = useState(defaultConfig);

const handleToggle = (productType, method) => {
  setPaymentConfig(prev => ({
    ...prev,
    [productType]: {
      ...prev[productType],
      [method]: !prev[productType][method]
    }
  }));
};

const saveConfig = async () => {
  await supabase
    .from('app_settings')
    .update({ payment_config: paymentConfig })
    .eq('id', settingsId);
};
```

### Frontend Checkout Integration (To Be Implemented)

**Update these components:**
1. `BuyPackage` modal/component
2. `BookClass` checkout flow
3. `WorkshopRegister` component
4. `TeacherTraining` registration

**Example Usage:**

```tsx
import { useAppSettings } from '@/hooks';

const { getSetting } = useAppSettings();
const paymentConfig = getSetting('payment_config', defaultConfig);

// In checkout component
const availableMethods = paymentConfig.class_booking;

// Show only enabled methods
{availableMethods.bank_transfer && (
  <PaymentOption method="bank_transfer" />
)}

{availableMethods.promptpay && (
  <PaymentOption method="promptpay" />
)}

{availableMethods.contact_admin && (
  <div className="text-center p-4">
    <p>Please contact us via WhatsApp or Line to complete your booking</p>
    <a href="https://wa.me/66844207947">Contact Admin</a>
  </div>
)}
```

---

## 📝 IMPLEMENTATION CHECKLIST

### Newsletter System ✅
- [x] Create subscribers table
- [x] Create useSubscribers hook
- [x] Create Newsletter component
- [x] Create admin subscribers page
- [x] Add CSV export functionality
- [ ] Add Newsletter component to Footer or Home page

### Manual Income ✅
- [x] Update payments table schema
- [x] Create ManualTransactionModal component
- [ ] Integrate modal into admin payments page
- [ ] Update financial dashboard queries (if needed)

### Payment Configuration ⚠️
- [x] Add payment_config to app_settings
- [ ] Create Payment Methods admin UI
- [ ] Update BuyPackage checkout flow
- [ ] Update BookClass checkout flow
- [ ] Update Workshop registration flow
- [ ] Update Teacher Training registration flow

---

## 🚀 DEPLOYMENT STEPS

1. **Run Database Migrations:**
   - Execute `001_create_subscribers_table.sql`
   - Execute `002_update_payments_for_manual_entries.sql`
   - Execute `003_add_payment_config_to_settings.sql`

2. **Verify Database:**
   - Check `subscribers` table exists
   - Check `payments` table has new columns
   - Check `app_settings` has `payment_config` column

3. **Test Newsletter:**
   - Add Newsletter component to a page
   - Test subscription
   - Verify email appears in `/admin/subscribers`
   - Test CSV export

4. **Test Manual Transactions:**
   - Add ManualTransactionModal to payments page
   - Create a test transaction
   - Verify it appears in payments list
   - Check financial dashboard includes it

5. **Configure Payment Methods:**
   - Create admin UI for payment configuration
   - Test toggling methods on/off
   - Update checkout flows to respect settings

---

## 🔧 TROUBLESHOOTING

### Subscribers Not Saving
- Check RLS policies are enabled
- Verify Supabase client is authenticated
- Check browser console for errors

### Manual Transactions Not Appearing
- Ensure `is_manual` flag is set
- Check `booking_id` is allowed to be null
- Verify payment queries include manual entries

### Payment Config Not Loading
- Check `app_settings` table has data
- Verify `payment_config` column exists
- Use default config as fallback

---

## 📚 NEXT STEPS

1. **Add Newsletter to Footer:**
   ```tsx
   // In Footer.tsx
   import { Newsletter } from '@/components/Newsletter';
   
   // Add before footer closing
   <Newsletter />
   ```

2. **Integrate Manual Transaction Button:**
   ```tsx
   // In admin/payments page
   import { ManualTransactionModal } from '@/components/ManualTransactionModal';
   
   // Add "+ Add Transaction" button
   ```

3. **Build Payment Config UI:**
   - Create toggles for each product type
   - Add save functionality
   - Test with checkout flows

4. **Update All Checkout Flows:**
   - Fetch payment config
   - Show/hide payment methods
   - Add "Contact Admin" option when enabled

---

## 📞 SUPPORT

For issues or questions:
- Check Supabase logs for database errors
- Review browser console for frontend errors
- Verify all migrations ran successfully
- Test with sample data first

---

**Implementation Date:** January 22, 2026
**Version:** 1.0.0
