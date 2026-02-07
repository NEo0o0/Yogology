# Supabase RPC Integration Guide

## Overview

This guide documents the complete integration of Supabase RPC (Remote Procedure Call) functions with the AnnieBliss React/Vite frontend. All stored procedures are now properly typed and integrated into custom React hooks for type-safe, server-side business logic execution.

---

## Table of Contents

1. [Database Types](#database-types)
2. [Booking RPCs](#booking-rpcs)
3. [Payment RPCs](#payment-rpcs)
4. [Authentication RPCs](#authentication-rpcs)
5. [Dashboard & Analytics RPCs](#dashboard--analytics-rpcs)
6. [Usage Examples](#usage-examples)
7. [Migration from Direct Table Access](#migration-from-direct-table-access)
8. [Testing & Verification](#testing--verification)

---

## Database Types

### Updated: `src/types/database.types.ts`

All RPC functions are now defined in `Database['public']['Functions']`:

```typescript
Functions: {
  // Booking Operations
  book_dropin: {
    Args: { p_class_id: number; p_amount_due: number }
    Returns: number  // booking_id
  }
  book_with_package: {
    Args: { p_class_id: number }
    Returns: number  // booking_id
  }
  cancel_booking: {
    Args: { p_booking_id: number }
    Returns: undefined
  }
  
  // Payment Operations
  record_dropin_payment: {
    Args: {
      p_booking_id: number
      p_amount: number
      p_method: Database['public']['Enums']['payment_method']
      p_evidence_url: string | null
      p_note: string | null
    }
    Returns: number  // payment_id
  }
  
  // Admin & Analytics
  get_dashboard_stats: {
    Args: Record<string, never>
    Returns: Json
  }
  get_monthly_financials: {
    Args: { year_input: number; month_input: number }
    Returns: Json
  }
  get_monthly_report_stats: {
    Args: { target_year: number; target_month: number }
    Returns: Json
  }
  get_yearly_report_stats: {
    Args: { target_year: number }
    Returns: Json
  }
  is_admin: {
    Args: Record<string, never>
    Returns: boolean
  }
  
  // Settings
  get_setting_bool: {
    Args: { key_name: string }
    Returns: boolean
  }
  get_setting_int: {
    Args: { key_name: string }
    Returns: number
  }
}
```

---

## Booking RPCs

### Hook: `useBookings.ts`

#### **1. Create Booking**

**Before (Direct Insert):**
```typescript
const { data, error } = await supabase
  .from('bookings')
  .insert(bookingData)
  .select()
  .single();
```

**After (Using RPCs):**
```typescript
const createBooking = async (bookingData: BookingInsert) => {
  let bookingId: number;

  if (bookingData.kind === 'package') {
    // Use book_with_package RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('book_with_package', {
      p_class_id: bookingData.class_id,
    });
    if (rpcError) throw rpcError;
    bookingId = rpcData;
  } else {
    // Use book_dropin RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('book_dropin', {
      p_class_id: bookingData.class_id,
      p_amount_due: bookingData.amount_due || 0,
    });
    if (rpcError) throw rpcError;
    bookingId = rpcData;
  }

  // Fetch the created booking with relations
  const { data, error: fetchError } = await supabase
    .from('bookings')
    .select('*, classes(*), user_packages(*)')
    .eq('id', bookingId)
    .single();

  return { data, error: null };
};
```

**Benefits:**
- ✅ Automatic package credit deduction
- ✅ Server-side validation
- ✅ Atomic transactions
- ✅ Consistent business logic

#### **2. Cancel Booking**

**Before (Manual Update + Credit Refund):**
```typescript
const { data, error } = await supabase
  .from('bookings')
  .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
  .eq('id', id)
  .select()
  .single();

// Manually refund credits
if (booking?.kind === 'package') {
  await supabase.rpc('increment_package_credits', { package_id });
}
```

**After (Using RPC):**
```typescript
const cancelBooking = async (id: number) => {
  // Use cancel_booking RPC which handles credit refunds automatically
  const { error: rpcError } = await supabase.rpc('cancel_booking', {
    p_booking_id: id,
  });

  if (rpcError) throw rpcError;

  // Fetch the updated booking
  const { data, error: fetchError } = await supabase
    .from('bookings')
    .select('*, classes(*), user_packages(*)')
    .eq('id', id)
    .single();

  return { data, error: null };
};
```

**Benefits:**
- ✅ Automatic credit refund for package bookings
- ✅ Single atomic operation
- ✅ No race conditions

---

## Payment RPCs

### Hook: `usePayments.ts`

#### **Record Drop-in Payment**

**Before (Manual Insert + Booking Update):**
```typescript
const { data, error } = await supabase
  .from('payments')
  .insert(paymentData)
  .select()
  .single();

// Manually update booking
await supabase
  .from('bookings')
  .update({
    payment_status: 'paid',
    amount_paid: paymentData.amount,
    paid_at: new Date().toISOString(),
  })
  .eq('id', paymentData.booking_id);
```

**After (Using RPC):**
```typescript
const recordPayment = async (paymentData: PaymentInsert) => {
  if (paymentData.booking_id) {
    // Use record_dropin_payment RPC
    const { data: paymentId, error: rpcError } = await supabase.rpc('record_dropin_payment', {
      p_booking_id: paymentData.booking_id,
      p_amount: paymentData.amount,
      p_method: paymentData.method,
      p_evidence_url: paymentData.evidence_url || null,
      p_note: paymentData.note || null,
    });

    if (rpcError) throw rpcError;

    // Fetch the created payment with relations
    const { data, error: fetchError } = await supabase
      .from('payments')
      .select('*, bookings(*), user_packages(*)')
      .eq('id', paymentId)
      .single();

    return { data, error: null };
  }
  // For package payments, use direct insert
};
```

**Benefits:**
- ✅ Automatic booking status update
- ✅ Payment log creation
- ✅ Atomic transaction
- ✅ Consistent payment processing

---

## Authentication RPCs

### Hook: `useAuth.ts`

#### **Admin Status Check**

**Added Function:**
```typescript
async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
```

**Usage:**
```typescript
const { checkIsAdmin, isAdmin } = useAuth();

// Client-side check (from profile)
if (isAdmin) {
  // Show admin UI
}

// Server-side verification
const isActuallyAdmin = await checkIsAdmin();
if (isActuallyAdmin) {
  // Perform admin action
}
```

**Benefits:**
- ✅ Server-side role verification
- ✅ Cannot be bypassed by client manipulation
- ✅ Secure admin operations

---

## Dashboard & Analytics RPCs

### Hook: `useDashboardStats.ts`

**New Hook for Dashboard Overview:**

```typescript
import { useDashboardStats } from '../hooks';

function AdminDashboard() {
  const { stats, loading, error, refetch } = useDashboardStats();

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <StatsCard title="Total Bookings" value={stats?.total_bookings} />
      <StatsCard title="Active Members" value={stats?.active_members} />
      <StatsCard title="Revenue" value={stats?.revenue} />
      <StatsCard title="Drop-ins" value={stats?.dropins} />
      
      <TodaySummary
        checkins={stats?.today_checkins}
        completed={stats?.today_classes_completed}
        revenue={stats?.today_revenue}
      />
    </div>
  );
}
```

**Stats Interface:**
```typescript
interface DashboardStats {
  total_bookings: number;
  active_members: number;
  revenue: number;
  dropins: number;
  today_checkins: number;
  today_classes_completed: number;
  today_revenue: number;
  bookings_trend?: number;
  members_trend?: number;
  revenue_trend?: number;
  dropins_trend?: number;
}
```

### Hook: `useReportStats.ts`

**New Hook for Reports & Analytics:**

```typescript
import { useReportStats } from '../hooks';

function ReportsAnalytics() {
  const {
    monthlyStats,
    monthlyFinancials,
    yearlyStats,
    loading,
    error,
    fetchMonthlyStats,
    fetchMonthlyFinancials,
    fetchYearlyStats,
  } = useReportStats();

  useEffect(() => {
    const now = new Date();
    fetchMonthlyStats(now.getFullYear(), now.getMonth() + 1);
    fetchMonthlyFinancials(now.getFullYear(), now.getMonth() + 1);
    fetchYearlyStats(now.getFullYear());
  }, []);

  return (
    <div>
      <MonthlyReport stats={monthlyStats} financials={monthlyFinancials} />
      <YearlyChart data={yearlyStats} />
    </div>
  );
}
```

**Interfaces:**
```typescript
interface MonthlyReportStats {
  total_bookings: number;
  total_revenue: number;
  total_dropins: number;
  total_package_bookings: number;
  unique_members: number;
  avg_attendance_rate?: number;
  top_class_type?: string;
}

interface MonthlyFinancials {
  total_revenue: number;
  dropin_revenue: number;
  package_revenue: number;
  total_expenses?: number;
  net_profit?: number;
  payment_breakdown?: {
    cash: number;
    bank_transfer: number;
    credit_card: number;
    promptpay: number;
  };
}

interface YearlyReportStats {
  total_bookings: number;
  total_revenue: number;
  total_members: number;
  monthly_breakdown?: Array<{
    month: number;
    bookings: number;
    revenue: number;
  }>;
}
```

---

## Usage Examples

### Example 1: Book a Drop-in Class

```typescript
import { useBookings } from '../hooks';

function ClassBookingButton({ classId, price }) {
  const { createBooking, loading } = useBookings({ autoFetch: false });

  const handleBookDropIn = async () => {
    const result = await createBooking({
      class_id: classId,
      kind: 'drop_in',
      amount_due: price,
      user_id: currentUser.id,
    });

    if (result.error) {
      toast.error('Booking failed: ' + result.error.message);
    } else {
      toast.success('Booking confirmed!');
    }
  };

  return (
    <button onClick={handleBookDropIn} disabled={loading}>
      {loading ? 'Booking...' : 'Book Drop-in'}
    </button>
  );
}
```

### Example 2: Book with Package

```typescript
const handleBookWithPackage = async () => {
  const result = await createBooking({
    class_id: classId,
    kind: 'package',
    user_id: currentUser.id,
    // RPC will automatically find and use active package
  });

  if (result.error) {
    toast.error('Booking failed: ' + result.error.message);
  } else {
    toast.success('Class booked! 1 credit deducted.');
  }
};
```

### Example 3: Record Payment

```typescript
import { usePayments } from '../hooks';

function PaymentForm({ bookingId, amount }) {
  const { recordPayment, loading } = usePayments({ autoFetch: false });

  const handleSubmit = async (formData) => {
    const result = await recordPayment({
      booking_id: bookingId,
      amount: amount,
      method: formData.method,
      evidence_url: formData.evidenceUrl,
      note: formData.note,
      user_id: currentUser.id,
    });

    if (result.error) {
      toast.error('Payment recording failed');
    } else {
      toast.success('Payment recorded successfully!');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Example 4: Admin Dashboard

```typescript
import { useDashboardStats } from '../hooks';

function AdminDashboard() {
  const { stats, loading, error, refetch } = useDashboardStats();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard
          title="Total Bookings"
          value={stats?.total_bookings}
          trend={stats?.bookings_trend}
          icon={<Calendar />}
        />
        <StatCard
          title="Active Members"
          value={stats?.active_members}
          trend={stats?.members_trend}
          icon={<Users />}
        />
        <StatCard
          title="Revenue"
          value={`฿${stats?.revenue.toLocaleString()}`}
          trend={stats?.revenue_trend}
          icon={<DollarSign />}
        />
        <StatCard
          title="Drop-ins"
          value={stats?.dropins}
          trend={stats?.dropins_trend}
          icon={<UserCheck />}
        />
      </div>

      <TodaySummary
        checkins={stats?.today_checkins}
        completed={stats?.today_classes_completed}
        revenue={stats?.today_revenue}
      />

      <button onClick={refetch}>Refresh Stats</button>
    </div>
  );
}
```

---

## Migration from Direct Table Access

### Checklist for Components

When migrating existing components to use RPCs:

- [ ] **Identify direct table operations** (`.insert()`, `.update()`, `.delete()`)
- [ ] **Check if RPC exists** for the operation
- [ ] **Update to use RPC** instead of direct access
- [ ] **Remove manual business logic** (credit deduction, status updates, etc.)
- [ ] **Update error handling** to handle RPC-specific errors
- [ ] **Test thoroughly** with real data

### Components to Update

1. **`ClassDetailModal.tsx`** - Already uses `createBooking` from `useBookings` ✅
2. **`AdminDashboard.tsx`** - Update to use `useDashboardStats` hook
3. **`ReportsAnalytics.tsx`** - Update to use `useReportStats` hook
4. **`PaymentsManagement.tsx`** - Verify uses `recordPayment` from `usePayments`
5. **`MembersManagement.tsx`** - Check for any direct booking operations

---

## Testing & Verification

### Unit Testing RPCs

```typescript
import { supabase } from '../utils/supabase/client';

describe('Booking RPCs', () => {
  it('should book a drop-in class', async () => {
    const { data, error } = await supabase.rpc('book_dropin', {
      p_class_id: 1,
      p_amount_due: 25.00,
    });

    expect(error).toBeNull();
    expect(typeof data).toBe('number');
  });

  it('should book with package', async () => {
    const { data, error } = await supabase.rpc('book_with_package', {
      p_class_id: 1,
    });

    expect(error).toBeNull();
    expect(typeof data).toBe('number');
  });

  it('should cancel booking and refund credits', async () => {
    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: 123,
    });

    expect(error).toBeNull();
  });
});
```

### Integration Testing

1. **Test Booking Flow:**
   - Create drop-in booking → Verify booking created
   - Create package booking → Verify credit deducted
   - Cancel package booking → Verify credit refunded

2. **Test Payment Flow:**
   - Record drop-in payment → Verify booking marked as paid
   - Verify payment log created

3. **Test Dashboard:**
   - Fetch dashboard stats → Verify all fields present
   - Verify stats match actual database counts

4. **Test Reports:**
   - Fetch monthly stats → Verify calculations
   - Fetch yearly stats → Verify monthly breakdown

---

## Error Handling

### Common RPC Errors

```typescript
// Insufficient package credits
{
  code: 'P0001',
  message: 'No active package with available credits'
}

// Class already full
{
  code: 'P0002',
  message: 'Class is full'
}

// Booking not found
{
  code: 'PGRST116',
  message: 'The result contains 0 rows'
}

// Permission denied
{
  code: '42501',
  message: 'permission denied for function is_admin'
}
```

### Handling in Components

```typescript
const handleBooking = async () => {
  const result = await createBooking(bookingData);

  if (result.error) {
    switch (result.error.code) {
      case 'P0001':
        toast.error('No package credits available. Please purchase a package.');
        break;
      case 'P0002':
        toast.error('This class is full. Please choose another time.');
        break;
      default:
        toast.error('Booking failed: ' + result.error.message);
    }
  } else {
    toast.success('Booking confirmed!');
  }
};
```

---

## Performance Considerations

### RPC vs Direct Access

**RPCs are better when:**
- ✅ Complex business logic required
- ✅ Multiple table operations needed
- ✅ Atomic transactions required
- ✅ Server-side validation needed

**Direct access is better when:**
- ✅ Simple CRUD operations
- ✅ No business logic required
- ✅ Read-only queries
- ✅ Performance-critical paths

### Caching Strategies

```typescript
// Cache dashboard stats for 5 minutes
const { stats, loading } = useDashboardStats();

useEffect(() => {
  const interval = setInterval(() => {
    refetch();
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(interval);
}, [refetch]);
```

---

## Security Notes

1. **RLS Policies:** All RPCs respect Row Level Security policies
2. **Admin Functions:** `is_admin` RPC cannot be bypassed client-side
3. **Input Validation:** All RPCs validate inputs server-side
4. **SQL Injection:** RPCs use parameterized queries (safe)

---

## Next Steps

1. **Update AdminDashboard.tsx** to use `useDashboardStats`
2. **Update ReportsAnalytics.tsx** to use `useReportStats`
3. **Add loading states** to all RPC calls
4. **Add error boundaries** for RPC failures
5. **Write integration tests** for critical flows
6. **Monitor RPC performance** in production

---

## Support & Resources

- **Supabase RPC Docs:** https://supabase.com/docs/guides/database/functions
- **TypeScript Types:** `src/types/database.types.ts`
- **Custom Hooks:** `src/hooks/`
- **Example Components:** `src/components/`

---

**Last Updated:** December 28, 2025  
**Version:** 1.0.0  
**Author:** AnnieBliss Development Team
