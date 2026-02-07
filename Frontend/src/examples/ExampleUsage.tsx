import { useAuth, useClasses, useBookings, usePackages, useUserPackages } from '../hooks';

/**
 * Example 1: Complete Authentication Flow
 */
export function AuthExample() {
  const { 
    user, 
    profile, 
    loading, 
    isAuthenticated,
    isAdmin,
    signIn, 
    signUp, 
    signOut,
    updateProfile 
  } = useAuth();

  const handleSignUp = async () => {
    const { data, error } = await signUp({
      email: 'newuser@example.com',
      password: 'securePassword123',
      fullName: 'John Doe',
      phone: '',
      contactInfo: '',
      contactPlatform: 'whatsapp'
    });
    
    if (error) {
      console.error('Sign up failed:', error.message);
    } else {
      console.log('User created:', data);
    }
  };

  const handleSignIn = async () => {
    const { data, error } = await signIn('user@example.com', 'password123');
    
    if (error) {
      console.error('Login failed:', error.message);
    } else {
      console.log('Logged in:', data);
    }
  };

  const handleUpdateProfile = async () => {
    const { data, error } = await updateProfile({
      full_name: 'Updated Name',
      phone: '+66123456789',
      bio: 'Yoga enthusiast',
    });
    
    if (error) {
      console.error('Update failed:', error);
    } else {
      console.log('Profile updated:', data);
    }
  };

  if (loading) return <div>Loading authentication...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h2>Welcome, {profile?.full_name || user?.email}!</h2>
          <p>Email: {user?.email}</p>
          <p>Role: {profile?.role}</p>
          {isAdmin && <p>⭐ Admin Access</p>}
          <button onClick={handleUpdateProfile}>Update Profile</button>
          <button onClick={signOut}>Logout</button>
        </div>
      ) : (
        <div>
          <button onClick={handleSignIn}>Login</button>
          <button onClick={handleSignUp}>Sign Up</button>
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Display Weekly Class Schedule
 */
export function WeeklyScheduleExample() {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const { classes, loading, error, createClass, cancelClass } = useClasses({
    startDate: today.toISOString(),
    endDate: nextWeek.toISOString(),
    category: 'class',
  });

  const handleCreateClass = async () => {
    const { data, error } = await createClass({
      title: 'Morning Vinyasa Flow',
      starts_at: new Date('2025-01-15T07:00:00').toISOString(),
      ends_at: new Date('2025-01-15T08:00:00').toISOString(),
      capacity: 20,
      booked_count: 0,
      location: 'Studio A',
      description: 'Energizing morning flow class',
      level: 'All Levels',
      category: 'class',
      price: 500,
      class_type_id: 1,
    });

    if (error) {
      console.error('Failed to create class:', error);
    } else {
      console.log('Class created:', data);
    }
  };

  if (loading) return <div>Loading schedule...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>This Week's Classes</h2>
      <button onClick={handleCreateClass}>Add New Class</button>
      
      {classes.map(cls => (
        <div key={cls.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <h3>{cls.title}</h3>
          <p>{cls.description}</p>
          <p>📅 {new Date(cls.starts_at).toLocaleString()}</p>
          <p>📍 {cls.location}</p>
          <p>👥 {cls.booked_count}/{cls.capacity} spots filled</p>
          <p>💰 ฿{cls.price}</p>
          <p>Level: {cls.level}</p>
          {cls.is_cancelled && <p style={{ color: 'red' }}>❌ CANCELLED</p>}
          <button onClick={() => cancelClass(cls.id)}>Cancel Class</button>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 3: User Booking Flow with Package Credits
 */
export function BookingFlowExample({ classId }: { classId: number }) {
  const { user, isAuthenticated } = useAuth();
  const { userPackages, activePackage, purchasePackage } = useUserPackages(user?.id);
  const { createBooking, bookings, loading } = useBookings({
    userId: user?.id,
    autoFetch: true,
  });

  const handleBookClass = async () => {
    if (!user || !isAuthenticated) {
      alert('Please login to book a class');
      return;
    }

    if (!activePackage) {
      alert('Please purchase a package first');
      return;
    }

    if (activePackage.credits_remaining !== null && activePackage.credits_remaining <= 0) {
      alert('No credits remaining. Please purchase a new package.');
      return;
    }

    const { data, error } = await createBooking({
      user_id: user.id,
      class_id: classId,
      kind: 'package',
      status: 'booked',
      user_package_id: activePackage.id,
      payment_status: 'paid',
      amount_due: 0,
      amount_paid: 0,
    });

    if (error) {
      console.error('Booking failed:', error);
      alert('Failed to book class: ' + error.message);
    } else {
      console.log('Booking successful:', data);
      alert('Class booked successfully!');
    }
  };

  const handleDropInBooking = async () => {
    if (!user || !isAuthenticated) {
      alert('Please login to book a class');
      return;
    }

    const dropInPrice = 600;

    const { data, error } = await createBooking({
      user_id: user.id,
      class_id: classId,
      kind: 'dropin',
      status: 'booked',
      payment_status: 'unpaid',
      amount_due: dropInPrice,
      amount_paid: 0,
    });

    if (error) {
      console.error('Drop-in booking failed:', error);
    } else {
      console.log('Drop-in booking created:', data);
      alert(`Please pay ฿${dropInPrice} for your drop-in class`);
    }
  };

  return (
    <div>
      <h2>Book This Class</h2>
      
      {activePackage ? (
        <div>
          <p>Active Package: {activePackage.credits_remaining} credits remaining</p>
          <p>Expires: {new Date(activePackage.expire_at).toLocaleDateString()}</p>
          <button onClick={handleBookClass} disabled={loading}>
            Book with Package
          </button>
        </div>
      ) : (
        <p>No active package. Purchase one below or book as drop-in.</p>
      )}

      <button onClick={handleDropInBooking} disabled={loading}>
        Book as Drop-in (฿600)
      </button>

      <h3>Your Bookings</h3>
      {bookings.map(booking => (
        <div key={booking.id}>
          <p>Status: {booking.status}</p>
          <p>Payment: {booking.payment_status}</p>
          <p>Booked: {new Date(booking.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 4: Package Purchase and Management
 */
export function PackageManagementExample() {
  const { user } = useAuth();
  const { packages, loading: packagesLoading } = usePackages({ activeOnly: true });
  const { 
    userPackages, 
    activePackage, 
    purchasePackage,
    loading: userPackagesLoading 
  } = useUserPackages(user?.id);

  const handlePurchase = async (packageId: number) => {
    if (!user) {
      alert('Please login first');
      return;
    }

    const { data, error } = await purchasePackage(packageId, user.id);
    
    if (error) {
      console.error('Purchase failed:', error);
      alert('Failed to purchase package');
    } else {
      console.log('Package purchased:', data);
      alert('Package purchased successfully!');
    }
  };

  if (packagesLoading || userPackagesLoading) {
    return <div>Loading packages...</div>;
  }

  return (
    <div>
      <h2>Your Active Package</h2>
      {activePackage ? (
        <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px' }}>
          <h3>Current Package</h3>
          <p>Credits: {activePackage.credits_remaining || 'Unlimited'}</p>
          <p>Expires: {new Date(activePackage.expire_at).toLocaleDateString()}</p>
          <p>Status: {activePackage.status}</p>
        </div>
      ) : (
        <p>No active package. Purchase one below!</p>
      )}

      <h2>Available Packages</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {packages.map(pkg => (
          <div key={pkg.id} style={{ border: '2px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <h3>{pkg.name}</h3>
            <p>Type: {pkg.type === 'credit' ? '📊 Credit-based' : '♾️ Unlimited'}</p>
            {pkg.credits && <p>Credits: {pkg.credits}</p>}
            <p>Duration: {pkg.duration_days} days</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>฿{pkg.price}</p>
            <button 
              onClick={() => handlePurchase(pkg.id)}
              style={{ width: '100%', padding: '10px', fontSize: '16px' }}
            >
              Purchase
            </button>
          </div>
        ))}
      </div>

      <h2>Purchase History</h2>
      {userPackages.map(up => (
        <div key={up.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
          <p>Package ID: {up.package_id}</p>
          <p>Status: {up.status}</p>
          <p>Credits: {up.credits_remaining || 'Unlimited'}</p>
          <p>Purchased: {new Date(up.created_at).toLocaleDateString()}</p>
          <p>Expires: {new Date(up.expire_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 5: Admin Dashboard - View All Bookings
 */
export function AdminBookingsExample() {
  const { isAdmin } = useAuth();
  const { 
    bookings, 
    loading, 
    markAsAttended, 
    markAsNoShow, 
    cancelBooking 
  } = useBookings({ autoFetch: true });

  if (!isAdmin) {
    return <div>Access denied. Admin only.</div>;
  }

  if (loading) return <div>Loading bookings...</div>;

  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.created_at);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  return (
    <div>
      <h2>Today's Bookings ({todayBookings.length})</h2>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>User</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Class</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Payment</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {todayBookings.map(booking => (
            <tr key={booking.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{booking.id}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {booking.guest_name || booking.user_id}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{booking.class_id}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{booking.status}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{booking.payment_status}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <button onClick={() => markAsAttended(booking.id)}>✓ Attended</button>
                <button onClick={() => markAsNoShow(booking.id)}>✗ No Show</button>
                <button onClick={() => cancelBooking(booking.id)}>Cancel</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Example 6: Real-time Class Updates
 */
export function RealtimeClassUpdates() {
  const { classes } = useClasses({ autoFetch: true });
  
  // The useClasses hook automatically fetches classes
  // For real-time updates, you can add a subscription in the component

  return (
    <div>
      <h2>Live Class Updates</h2>
      <p>Total classes: {classes.length}</p>
      
      {classes.map(cls => (
        <div key={cls.id}>
          <h3>{cls.title}</h3>
          <div style={{ 
            width: '100%', 
            background: '#f0f0f0', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(cls.booked_count / cls.capacity) * 100}%`,
              background: cls.booked_count >= cls.capacity ? '#f44336' : '#4caf50',
              padding: '5px',
              color: 'white',
              textAlign: 'center'
            }}>
              {cls.booked_count}/{cls.capacity}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
