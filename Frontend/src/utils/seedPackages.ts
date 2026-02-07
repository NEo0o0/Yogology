// Helper script to seed package data into KV store
// This would typically be run once to populate initial data

export const samplePackages = [
  {
    id: 'pkg-1',
    name: 'Drop-In Class',
    price: 500,
    credits: 1,
    validityDays: 1,
    description: 'Perfect for trying out a single class',
    isActive: true,
    isBestSeller: false,
    features: [
      'Flexible scheduling',
      'No commitment required'
    ]
  },
  {
    id: 'pkg-2',
    name: '5-Class Pack',
    price: 2200,
    credits: 5,
    validityDays: 30,
    description: 'Great for regular practice',
    isActive: true,
    isBestSeller: false,
    features: [
      'Save 12% vs drop-in',
      'Valid for 1 month',
      'Priority booking'
    ]
  },
  {
    id: 'pkg-3',
    name: '10-Class Pack',
    price: 4000,
    credits: 10,
    validityDays: 60,
    description: 'Most popular choice for committed yogis',
    isActive: true,
    isBestSeller: true,
    features: [
      'Save 20% vs drop-in',
      'Valid for 2 months',
      'Priority booking',
      'Free yoga mat rental'
    ]
  },
  {
    id: 'pkg-4',
    name: '20-Class Pack',
    price: 7000,
    credits: 20,
    validityDays: 90,
    description: 'Best value for serious practitioners',
    isActive: true,
    isBestSeller: false,
    features: [
      'Save 30% vs drop-in',
      'Valid for 3 months',
      'Priority booking',
      'Free yoga mat rental',
      'One free private session'
    ]
  },
  {
    id: 'pkg-5',
    name: 'Unlimited Monthly',
    price: 8500,
    credits: 999,
    validityDays: 30,
    description: 'Unlimited classes for dedicated yogis',
    isActive: true,
    isBestSeller: false,
    features: [
      'Unlimited class access',
      'Valid for 1 month',
      'Priority booking',
      'Free yoga mat rental',
      'Complimentary workshop access',
      '10% discount on retail'
    ]
  }
];

// Function to seed packages via API
export async function seedPackages(projectId: string, publicAnonKey: string) {
  const promises = samplePackages.map(async (pkg) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-baa97425/seed-package`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(pkg),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to seed package ${pkg.name}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`Error seeding package ${pkg.name}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  console.log('Seeding completed:', results);
  return results;
}
