# Migration Guide: From Mock Data to Supabase Hooks

This guide shows you how to migrate components from using mock data (`AppContext`) to using the new type-safe Supabase hooks.

## ✅ Example: WeeklySchedule.tsx (COMPLETED)

### Before (Mock Data)
```tsx
import { useApp } from '../context/AppContext';

export function WeeklySchedule({ onNavigate }: WeeklyScheduleProps) {
  const { classes } = useApp(); // Mock data from context
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  // Direct use of mock data
  return (
    <div>
      {classes.map(cls => (
        <div key={cls.id}>{cls.title}</div>
      ))}
    </div>
  );
}
```

### After (Supabase Hooks)
```tsx
import { useClasses } from '../hooks';
import type { Tables } from '../types/database.types';

type DbClass = Tables<'classes'>;

export function WeeklySchedule({ onNavigate }: WeeklyScheduleProps) {
  // 1. Use the hook with options
  const { classes: dbClasses, loading, error } = useClasses({
    category: 'class',
    autoFetch: true,
  });

  const [selectedClass, setSelectedClass] = useState<DbClass | null>(null);

  // 2. Transform DB data to UI format with null-safe handling
  const classes = useMemo(() => {
    return dbClasses.map((cls) => ({
      id: cls.id.toString(),
      title: cls.title,
      time: new Date(cls.starts_at).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      level: cls.level || 'All Levels', // Null-safe with fallback
      description: cls.description || '', // Empty string fallback
      room: cls.location || 'Studio A', // Default value
      _dbClass: cls, // Keep reference to original
    }));
  }, [dbClasses]);

  // 3. Handle loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // 4. Handle error state
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // 5. Use transformed data
  return (
    <div>
      {classes.map(cls => (
        <div key={cls.id}>{cls.title}</div>
      ))}
    </div>
  );
}
```

## 🎯 Migration Pattern (5 Steps)

### Step 1: Import the Hook and Types
```tsx
// Remove AppContext import
- import { useApp } from '../context/AppContext';

// Add hook and types
+ import { useClasses } from '../hooks';
+ import type { Tables } from '../types/database.types';
+ 
+ type DbClass = Tables<'classes'>;
```

### Step 2: Replace Context with Hook
```tsx
// Old
- const { classes } = useApp();

// New
+ const { classes: dbClasses, loading, error } = useClasses({
+   category: 'class',
+   autoFetch: true,
+ });
```

### Step 3: Transform Data with Null Safety
```tsx
const classes = useMemo(() => {
  return dbClasses.map((cls) => ({
    // Required fields (always present)
    id: cls.id.toString(),
    title: cls.title,
    capacity: cls.capacity,
    
    // Nullable fields - use || for fallbacks
    level: cls.level || 'All Levels',
    description: cls.description || '',
    location: cls.location || 'Studio A',
    
    // Date transformations
    time: new Date(cls.starts_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }),
    
    // Calculated fields
    duration: cls.ends_at 
      ? `${Math.round((new Date(cls.ends_at).getTime() - new Date(cls.starts_at).getTime()) / 60000)} min`
      : '60 min',
    
    // Keep DB reference for modals/details
    _dbClass: cls,
  }));
}, [dbClasses]);
```

### Step 4: Add Loading & Error States
```tsx
if (loading) {
  return (
    <div className="text-center py-20">
      <p>Loading...</p>
    </div>
  );
}

if (error) {
  return (
    <div className="text-center py-20">
      <p className="text-red-600">Error: {error.message}</p>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
```

### Step 5: Update State Types
```tsx
// Old
- const [selectedClass, setSelectedClass] = useState<any>(null);

// New
+ const [selectedClass, setSelectedClass] = useState<DbClass | null>(null);
```

## 📋 Null Handling Patterns

### Pattern 1: Fallback Values
```tsx
// For strings
const description = cls.description || 'No description available';
const location = cls.location || 'TBD';

// For numbers
const price = cls.price ?? 0;

// For arrays
const images = cls.gallery_images || [];
```

### Pattern 2: Optional Chaining
```tsx
// Safe property access
const instructorName = cls.created_by?.full_name;

// Safe method calls
const formattedDate = cls.starts_at?.toLocaleDateString();
```

### Pattern 3: Conditional Rendering
```tsx
{cls.cover_image_url && (
  <img src={cls.cover_image_url} alt={cls.title} />
)}

{cls.is_cancelled && (
  <span className="text-red-500">CANCELLED</span>
)}
```

### Pattern 4: Type Guards
```tsx
if (cls.price !== null && cls.price !== undefined) {
  // Safe to use cls.price as number
  const formattedPrice = `฿${cls.price.toFixed(2)}`;
}
```

## 🔄 Hook Options Reference

### useClasses
```tsx
const { classes, loading, error, fetchClasses, createClass, updateClass } = useClasses({
  startDate: '2025-01-01',      // Filter by start date
  endDate: '2025-12-31',        // Filter by end date
  category: 'class',            // 'class' or 'training'
  classTypeId: 1,               // Filter by class type
  autoFetch: true,              // Auto-fetch on mount (default: true)
});
```

### useBookings
```tsx
const { bookings, loading, error, createBooking, cancelBooking } = useBookings({
  userId: user?.id,             // Filter by user
  classId: 123,                 // Filter by class
  status: 'booked',             // Filter by status
  autoFetch: true,
});
```

### usePackages
```tsx
const { packages, loading, error } = usePackages({
  activeOnly: true,             // Only active packages (default: true)
  autoFetch: true,
});
```

### useUserPackages
```tsx
const { userPackages, activePackage, purchasePackage } = useUserPackages(userId);
```

### useAuth
```tsx
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
```

## 📝 Components to Migrate

### Priority 1: Direct Supabase Users (7 components)
These components directly import and use Supabase - migrate these first:

1. ✅ **WeeklySchedule.tsx** - COMPLETED (use as reference)
2. ⏳ **LoginRegister.tsx** - Use `useAuth` hook
3. ⏳ **NewsletterSubscribers.tsx** - Direct Supabase query
4. ⏳ **PaymentVerificationModal.tsx** - Use `usePayments` hook
5. ⏳ **PaymentsManagement.tsx** - Use `usePayments` hook
6. ⏳ **Pricing.tsx** - Use `usePackages` hook
7. ⏳ **SeedPackagesButton.tsx** - Use `usePackages` hook
8. ⏳ **WorkshopsEvents.tsx** - Use `useClasses` hook

### Priority 2: AppContext Users
Components using `useApp()` - migrate after Priority 1:
- ClassTypes.tsx
- ClassManagement.tsx
- MemberDashboard.tsx
- AdminDashboard.tsx
- etc.

## 🎨 Common Transformations

### Date/Time Formatting
```tsx
// Database: ISO string "2025-01-15T07:00:00Z"
// UI: "7:00 AM"
const time = new Date(cls.starts_at).toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

// UI: "Monday"
const day = new Date(cls.starts_at).toLocaleDateString('en-US', { 
  weekday: 'long' 
});
```

### Price Formatting
```tsx
// Database: number | null
// UI: "฿500" or "Free"
const formattedPrice = cls.price 
  ? `฿${cls.price.toLocaleString()}` 
  : 'Free';
```

### Enum Handling
```tsx
import type { Enums } from '../types/database.types';

type BookingStatus = Enums<'booking_status'>;
// 'booked' | 'attended' | 'cancelled' | 'no_show'

const status: BookingStatus = 'booked'; // Type-safe!
```

## ⚠️ Common Pitfalls

### ❌ Don't Do This
```tsx
// Accessing nullable field without check
<p>{cls.description}</p> // Error if null!

// Using any type
const [data, setData] = useState<any>(null);

// Ignoring loading state
const { classes } = useClasses();
return <div>{classes.map(...)}</div>; // Empty on first render!
```

### ✅ Do This Instead
```tsx
// Safe null handling
<p>{cls.description || 'No description'}</p>

// Proper typing
const [data, setData] = useState<DbClass | null>(null);

// Handle loading
if (loading) return <Loading />;
return <div>{classes.map(...)}</div>;
```

## 🚀 Testing Checklist

After migrating a component:

- [ ] Component renders without errors
- [ ] Loading state displays correctly
- [ ] Error state displays correctly  
- [ ] Data displays correctly (no "undefined" or "null" text)
- [ ] Null fields have appropriate fallbacks
- [ ] Dates/times format correctly
- [ ] User interactions work (clicks, forms, etc.)
- [ ] No TypeScript errors
- [ ] No console errors/warnings

## 💡 Pro Tips

1. **Start with read-only components** - Migrate display components before forms
2. **Test incrementally** - Migrate one component at a time
3. **Keep mock data** - Don't delete AppContext until all components are migrated
4. **Use useMemo** - Transform data once, not on every render
5. **Add TODO comments** - Mark areas that need backend changes (e.g., instructor names)
6. **Check the network tab** - Verify Supabase queries are working
7. **Use React DevTools** - Inspect hook state and props

## 📚 Next Steps

1. Review the completed `WeeklySchedule.tsx` refactor
2. Pick the next component from Priority 1 list
3. Follow the 5-step migration pattern
4. Test thoroughly
5. Repeat for remaining components

## 🆘 Need Help?

- Check `SUPABASE_INTEGRATION.md` for hook API reference
- See `src/examples/ExampleUsage.tsx` for more examples
- Review `TYPE_MIGRATION_STATUS.md` for overall status
- The hooks handle most edge cases automatically!
