# Class Types Migration to Real Database

## Summary

Successfully refactored the Class Types feature from mock data in `AppContext` to real Supabase database integration. The `class_types` table already existed in the database schema with proper foreign key relationships to the `classes` table.

---

## What Was Done

### 1. Created `useClassTypes` Hook

**File:** `src/hooks/useClassTypes.ts`

A new custom React hook for managing class types with full CRUD operations:

```typescript
export function useClassTypes(options: UseClassTypesOptions = {}) {
  const { autoFetch = true } = options;
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoized with useCallback to prevent infinite loops
  const fetchClassTypes = useCallback(async () => { ... }, []);
  
  const createClassType = async (classTypeData: ClassTypeInsert) => { ... };
  const updateClassType = async (id: number, updates: ClassTypeUpdate) => { ... };
  const deleteClassType = async (id: number) => { ... };

  return {
    classTypes,
    loading,
    error,
    fetchClassTypes,
    createClassType,
    updateClassType,
    deleteClassType,
  };
}
```

**Features:**
- ✅ Fetches class types from Supabase `class_types` table
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Type-safe with TypeScript database types
- ✅ Memoized `fetchClassTypes` with `useCallback` to prevent infinite loops
- ✅ Loading and error states
- ✅ Auto-fetch on mount (configurable)

### 2. Created SQL Seed Script

**File:** `supabase/seed_class_types.sql`

Seed data for 4 initial class types:

| Title | Description | Level | Duration | Price | Color |
|-------|-------------|-------|----------|-------|-------|
| **Vinyasa** | Dynamic, flowing style synchronizing breath with movement | All Levels | 60 min | $25 | #8CA899 (Sage) |
| **Hatha** | Gentle, foundational practice with basic postures | Beginner | 75 min | $20 | #C18A7A (Clay) |
| **Iyengar** | Precise, alignment-focused practice using props | Intermediate | 90 min | $30 | #D4A574 (Terracotta) |
| **Pilates** | Low-impact core strength and flexibility training | All Levels | 60 min | $28 | #7A9FC1 (Blue) |

**To Run:**
```sql
-- In Supabase SQL Editor
INSERT INTO class_types (title, description, level, duration_minutes, default_price, color_code)
VALUES 
  ('Vinyasa', '...', 'All Levels', 60, 25.00, '#8CA899'),
  ('Hatha', '...', 'Beginner', 75, 20.00, '#C18A7A'),
  ('Iyengar', '...', 'Intermediate', 90, 30.00, '#D4A574'),
  ('Pilates', '...', 'All Levels', 60, 28.00, '#7A9FC1')
ON CONFLICT (id) DO NOTHING;
```

### 3. Refactored `ClassTypesTab` Component

**File:** `src/components/ClassTypesTab.tsx`

**Before:** Used mock data from `AppContext`
```typescript
const { classTypes, addClassType, updateClassType, deleteClassType } = useApp();
```

**After:** Uses real Supabase data via `useClassTypes` hook
```typescript
const { classTypes, loading, error, createClassType, updateClassType, deleteClassType } = useClassTypes();
```

**Key Changes:**
- ✅ Replaced `useApp()` with `useClassTypes()`
- ✅ Updated field names to match database schema:
  - `color` → `color_code`
  - `defaultDuration` → `duration_minutes`
  - Added `default_price` field
- ✅ Changed ID type from `string` to `number`
- ✅ Added async/await for all CRUD operations
- ✅ Added error handling with user feedback
- ✅ Added loading states during submissions
- ✅ Proper null-safe handling for optional fields

### 4. Updated Hook Exports

**File:** `src/hooks/index.ts`

Added `useClassTypes` to barrel exports:
```typescript
export { useAuth } from './useAuth';
export { useClasses } from './useClasses';
export { useClassTypes } from './useClassTypes';  // ← New
export { useBookings } from './useBookings';
export { usePackages, useUserPackages } from './usePackages';
export { usePayments } from './usePayments';
```

---

## Database Schema

The `class_types` table already exists with the following structure:

```sql
CREATE TABLE class_types (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT,
  duration_minutes INTEGER,
  default_price NUMERIC(10, 2),
  color_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Relationship with `classes` table:**
```sql
-- classes table has foreign key
class_type_id INTEGER REFERENCES class_types(id)
```

**Already Fetched in `useClasses` Hook:**
```typescript
.select('*, class_types(*)')  // Joins class_types data
```

---

## Frontend API Response

When fetching classes, the response now includes the nested `class_types` object:

```typescript
{
  id: 1,
  title: "Morning Vinyasa",
  starts_at: "2024-12-28T09:00:00Z",
  class_type_id: 1,
  class_types: {  // ← Nested relation
    id: 1,
    title: "Vinyasa",
    description: "Dynamic, flowing style...",
    level: "All Levels",
    duration_minutes: 60,
    default_price: 25.00,
    color_code: "#8CA899"
  }
}
```

---

## How to Use

### 1. Seed the Database

Run the SQL seed script in your Supabase SQL Editor:
```bash
# Navigate to Supabase Dashboard → SQL Editor
# Copy and paste contents of supabase/seed_class_types.sql
# Click "Run"
```

### 2. Use in Components

```typescript
import { useClassTypes } from '../hooks';

function MyComponent() {
  const { classTypes, loading, error, createClassType } = useClassTypes();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {classTypes.map(ct => (
        <div key={ct.id}>
          <h3>{ct.title}</h3>
          <p>{ct.description}</p>
          <span style={{ backgroundColor: ct.color_code }}>
            {ct.level} • {ct.duration_minutes} min
          </span>
        </div>
      ))}
    </div>
  );
}
```

### 3. Create New Class Type

```typescript
const handleCreate = async () => {
  const result = await createClassType({
    title: 'Restorative Yoga',
    description: 'Gentle, relaxing practice...',
    level: 'All Levels',
    duration_minutes: 90,
    default_price: 30.00,
    color_code: '#9C7AC1'
  });

  if (result.error) {
    console.error('Failed to create:', result.error);
  } else {
    console.log('Created:', result.data);
  }
};
```

---

## Testing Checklist

- [ ] Run seed script in Supabase SQL Editor
- [ ] Verify 4 class types appear in database
- [ ] Navigate to Admin → Class Types tab
- [ ] Verify class types load from database
- [ ] Create a new class type
- [ ] Edit an existing class type
- [ ] Delete a class type
- [ ] Verify color picker works
- [ ] Verify form validation
- [ ] Check error handling (disconnect internet, try to create)
- [ ] Verify loading states show properly

---

## Migration Status

### ✅ Completed
- `class_types` table exists in database
- Foreign key relationship with `classes` table
- `useClassTypes` hook created
- Seed script for initial data
- `ClassTypesTab` refactored to use real data
- `useClasses` already fetches `class_types` relation

### 📝 Notes
- The `AppContext` still contains mock `classTypes` state for backward compatibility
- Components should gradually migrate from `useApp()` to `useClassTypes()`
- The `WeeklySchedule` component already fetches the `class_types` relation via `useClasses`

---

## Related Files

**Hooks:**
- `src/hooks/useClassTypes.ts` - New hook for class types CRUD
- `src/hooks/useClasses.ts` - Already fetches `class_types` relation
- `src/hooks/index.ts` - Barrel exports

**Components:**
- `src/components/ClassTypesTab.tsx` - Refactored to use real data
- `src/components/WeeklySchedule.tsx` - Already displays class type data

**Database:**
- `src/types/database.types.ts` - TypeScript types for `class_types` table
- `supabase/seed_class_types.sql` - Seed script for initial data

**Documentation:**
- `Frontend/SUPABASE_INTEGRATION.md` - General Supabase integration guide
- `Frontend/MIGRATION_GUIDE.md` - Pattern for migrating from mock to real data

---

## Next Steps

1. **Run the seed script** to populate initial class types
2. **Test the Class Types tab** in the admin panel
3. **Consider migrating other components** that still use `AppContext` mock data
4. **Add RLS policies** for class_types table if needed (currently public read, admin write)
5. **Add validation** for duplicate class type titles
6. **Add soft delete** functionality instead of hard delete

---

## Questions?

If you encounter issues:
1. Check Supabase connection in browser console
2. Verify RLS policies allow reading `class_types`
3. Check network tab for failed API requests
4. Review error messages in component state

Happy coding! 🎉
