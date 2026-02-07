# Supabase Integration Guide - AnnieBliss/YOGOLOGY

This guide explains how to use the Supabase backend integration in your React/Vite/TypeScript frontend.

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── types/
│   │   └── database.types.ts          # Auto-generated TypeScript types from DB schema
│   ├── utils/
│   │   └── supabase/
│   │       ├── client.ts              # Typed Supabase client instance
│   │       └── info.tsx               # Supabase credentials
│   └── hooks/
│       ├── useAuth.ts                 # Authentication hook
│       ├── useClasses.ts              # Classes management hook
│       ├── useBookings.ts             # Bookings management hook
│       ├── usePackages.ts             # Packages & user packages hooks
│       ├── usePayments.ts             # Payments management hook
│       └── index.ts                   # Barrel export
```

## 🚀 Quick Start

### 1. Authentication

```tsx
import { useAuth } from '@/hooks';

function LoginComponent() {
  const { 
    user, 
    profile, 
    loading, 
    isAuthenticated,
    isAdmin,
    signIn, 
    signUp, 
    signOut 
  } = useAuth();

  const handleLogin = async () => {
    const { data, error } = await signIn('user@example.com', 'password123');
    if (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {profile?.full_name}!</p>
          <p>Role: {profile?.role}</p>
          <button onClick={signOut}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### 2. Fetching Classes

```tsx
import { useClasses } from '@/hooks';

function ClassSchedule() {
  const { classes, loading, error, fetchClasses } = useClasses({
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    category: 'class', // or 'training'
  });

  if (loading) return <div>Loading classes...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {classes.map(cls => (
        <div key={cls.id}>
          <h3>{cls.title}</h3>
          <p>{cls.description}</p>
          <p>Capacity: {cls.booked_count}/{cls.capacity}</p>
          <p>Starts: {new Date(cls.starts_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Creating a Booking

```tsx
import { useBookings, useAuth } from '@/hooks';

function BookClassButton({ classId }: { classId: number }) {
  const { user } = useAuth();
  const { createBooking, loading } = useBookings({ autoFetch: false });

  const handleBook = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    const { data, error } = await createBooking({
      user_id: user.id,
      class_id: classId,
      kind: 'package', // or 'drop_in'
      status: 'booked',
      user_package_id: 1, // Get from active package
      payment_status: 'unpaid',
      amount_due: 0,
      amount_paid: 0,
    });

    if (error) {
      console.error('Booking failed:', error);
    } else {
      alert('Booking successful!');
    }
  };

  return (
    <button onClick={handleBook} disabled={loading}>
      {loading ? 'Booking...' : 'Book Class'}
    </button>
  );
}
```

### 4. Managing Packages

```tsx
import { usePackages, useUserPackages, useAuth } from '@/hooks';

function PackagePurchase() {
  const { user } = useAuth();
  const { packages, loading } = usePackages({ activeOnly: true });
  const { purchasePackage, activePackage } = useUserPackages(user?.id);

  const handlePurchase = async (packageId: number) => {
    if (!user) return;

    const { data, error } = await purchasePackage(packageId, user.id);
    if (error) {
      console.error('Purchase failed:', error);
    } else {
      alert('Package purchased successfully!');
    }
  };

  return (
    <div>
      {activePackage && (
        <div>
          <h3>Active Package</h3>
          <p>Credits remaining: {activePackage.credits_remaining}</p>
          <p>Expires: {new Date(activePackage.expire_at).toLocaleDateString()}</p>
        </div>
      )}

      <h3>Available Packages</h3>
      {packages.map(pkg => (
        <div key={pkg.id}>
          <h4>{pkg.name}</h4>
          <p>Type: {pkg.type}</p>
          <p>Credits: {pkg.credits || 'Unlimited'}</p>
          <p>Duration: {pkg.duration_days} days</p>
          <p>Price: ฿{pkg.price}</p>
          <button onClick={() => handlePurchase(pkg.id)}>
            Purchase
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 5. Recording Payments

```tsx
import { usePayments, useAuth } from '@/hooks';

function PaymentForm({ bookingId, amount }: { bookingId: number; amount: number }) {
  const { user } = useAuth();
  const { recordPayment, loading } = usePayments({ autoFetch: false });

  const handlePayment = async (method: 'cash' | 'bank_transfer' | 'credit_card' | 'promptpay') => {
    if (!user) return;

    const { data, error } = await recordPayment({
      booking_id: bookingId,
      user_id: user.id,
      method: method,
      amount: amount,
      currency: 'THB',
      log_status: 'recorded',
      paid_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Payment recording failed:', error);
    } else {
      alert('Payment recorded successfully!');
    }
  };

  return (
    <div>
      <h3>Record Payment</h3>
      <button onClick={() => handlePayment('cash')}>Cash</button>
      <button onClick={() => handlePayment('bank_transfer')}>Bank Transfer</button>
      <button onClick={() => handlePayment('promptpay')}>PromptPay</button>
    </div>
  );
}
```

## 🎯 Hook API Reference

### `useAuth()`

**Returns:**
- `user`: Current authenticated user
- `profile`: User profile from `profiles` table
- `session`: Current session
- `loading`: Loading state
- `error`: Authentication error
- `isAuthenticated`: Boolean flag
- `isAdmin`: Boolean flag (role === 'admin')
- `isInstructor`: Boolean flag (role === 'instructor')
- `isMember`: Boolean flag (role === 'member')
- `signUp(email, password, fullName?)`: Sign up new user
- `signIn(email, password)`: Sign in existing user
- `signOut()`: Sign out current user
- `updateProfile(updates)`: Update user profile

### `useClasses(options?)`

**Options:**
- `startDate?: string` - Filter classes starting from this date
- `endDate?: string` - Filter classes ending before this date
- `category?: string` - Filter by category ('class' or 'training')
- `classTypeId?: number` - Filter by class type
- `autoFetch?: boolean` - Auto-fetch on mount (default: true)

**Returns:**
- `classes`: Array of classes
- `loading`: Loading state
- `error`: Error object
- `fetchClasses()`: Manually fetch classes
- `createClass(data)`: Create new class
- `updateClass(id, updates)`: Update existing class
- `deleteClass(id)`: Delete class
- `cancelClass(id)`: Mark class as cancelled

### `useBookings(options?)`

**Options:**
- `userId?: string` - Filter by user ID
- `classId?: number` - Filter by class ID
- `status?: BookingStatus` - Filter by status
- `autoFetch?: boolean` - Auto-fetch on mount (default: true)

**Returns:**
- `bookings`: Array of bookings
- `loading`: Loading state
- `error`: Error object
- `fetchBookings()`: Manually fetch bookings
- `createBooking(data)`: Create new booking
- `updateBooking(id, updates)`: Update booking
- `cancelBooking(id)`: Cancel booking (refunds credits)
- `markAsAttended(id)`: Mark booking as attended
- `markAsNoShow(id)`: Mark booking as no-show

### `usePackages(options?)`

**Options:**
- `activeOnly?: boolean` - Only fetch active packages (default: true)
- `autoFetch?: boolean` - Auto-fetch on mount (default: true)

**Returns:**
- `packages`: Array of packages
- `loading`: Loading state
- `error`: Error object
- `fetchPackages()`: Manually fetch packages
- `createPackage(data)`: Create new package
- `updatePackage(id, updates)`: Update package
- `deletePackage(id)`: Delete package

### `useUserPackages(userId?)`

**Returns:**
- `userPackages`: Array of user's packages
- `loading`: Loading state
- `error`: Error object
- `fetchUserPackages()`: Manually fetch user packages
- `purchasePackage(packageId, userId)`: Purchase a package
- `activePackage`: Currently active package (if any)

### `usePayments(options?)`

**Options:**
- `userId?: string` - Filter by user ID
- `bookingId?: number` - Filter by booking ID
- `userPackageId?: number` - Filter by user package ID
- `autoFetch?: boolean` - Auto-fetch on mount (default: true)

**Returns:**
- `payments`: Array of payments
- `loading`: Loading state
- `error`: Error object
- `fetchPayments()`: Manually fetch payments
- `recordPayment(data)`: Record new payment
- `updatePayment(id, updates)`: Update payment
- `verifyPayment(id)`: Mark payment as verified
- `disputePayment(id)`: Mark payment as disputed

## 🔐 Database Types

All database types are automatically generated in `src/types/database.types.ts`:

```typescript
import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/types/database.types';

// Row types (for reading)
type Class = Tables<'classes'>;
type Booking = Tables<'bookings'>;
type Profile = Tables<'profiles'>;

// Insert types (for creating)
type ClassInsert = TablesInsert<'classes'>;
type BookingInsert = TablesInsert<'bookings'>;

// Update types (for updating)
type ClassUpdate = TablesUpdate<'classes'>;
type BookingUpdate = TablesUpdate<'bookings'>;

// Enum types
type BookingStatus = Enums<'booking_status'>; // 'booked' | 'attended' | 'cancelled' | 'no_show'
type PaymentMethod = Enums<'payment_method'>; // 'cash' | 'bank_transfer' | 'credit_card' | 'promptpay'
type RoleType = Enums<'role_type'>; // 'member' | 'instructor' | 'admin'
```

## 🔄 Real-time Subscriptions

To listen for real-time changes:

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { Tables } from '@/types/database.types';

function RealtimeClasses() {
  const [classes, setClasses] = useState<Tables<'classes'>[]>([]);

  useEffect(() => {
    // Subscribe to INSERT events
    const subscription = supabase
      .channel('classes-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'classes',
        },
        (payload) => {
          console.log('New class added:', payload.new);
          setClasses(prev => [...prev, payload.new as Tables<'classes'>]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <div>{/* Render classes */}</div>;
}
```

## 🛡️ Row Level Security (RLS)

Make sure your Supabase database has appropriate RLS policies set up:

```sql
-- Example: Allow users to read their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Example: Allow admins to manage all classes
CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

## 📝 Best Practices

1. **Error Handling**: Always check for errors in hook responses
2. **Loading States**: Show loading indicators during async operations
3. **Type Safety**: Use the generated types for all database operations
4. **Optimistic Updates**: Update local state before server confirmation for better UX
5. **Cleanup**: Unsubscribe from real-time channels in useEffect cleanup
6. **Security**: Never expose sensitive data in client-side code
7. **Validation**: Validate user input before sending to Supabase

## 🐛 Troubleshooting

### TypeScript errors about missing modules
These are false positives. The packages are installed. Run `npm install` if needed.

### Authentication not persisting
Check that `persistSession: true` is set in the Supabase client config.

### RLS policy errors
Ensure your database policies allow the operation you're attempting.

### CORS errors
Verify your Supabase project URL and anon key are correct in `src/utils/supabase/info.tsx`.

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [React Hooks Best Practices](https://react.dev/reference/react)
