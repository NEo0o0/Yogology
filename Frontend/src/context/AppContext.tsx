"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

// UI-friendly interfaces for mock data (not using strict DB types yet)
interface ClassType {
  id: string;
  title: string;
  description: string;
  level: string;
  defaultDuration: number; // in minutes
  color: string;
}

interface WeeklySlot {
  id: string;
  classTypeId: string;
  day: string; // Monday, Tuesday, etc.
  time: string; // e.g., "09:00 AM"
  instructorId: string;
  instructorName?: string; // For guest/external instructors
  room: string;
  capacity?: number;
}

// UI-friendly class interface for mock data
interface Class {
  id: string;
  title: string;
  time: string;
  instructor: string;
  level: string;
  capacity: number;
  enrolled: number;
  day: string;
  duration: string;
  description: string;
  room: string;
  category?: string; // 'class' or 'training'
  season?: string; // For training sessions
  startDate?: string; // For training sessions
  endDate?: string; // For training sessions
  status?: string; // For training sessions
  earlyBirdPrice?: string; // For training sessions
  regularPrice?: string; // For training sessions
  location?: string; // For training sessions
}

interface AppContextType {
  classes: Class[];
  addClass: (classData: Omit<Class, 'id'>) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  bookClass: (classId: string) => void;
  classTypes: ClassType[];
  addClassType: (classType: Omit<ClassType, 'id'>) => void;
  updateClassType: (id: string, classType: Partial<ClassType>) => void;
  deleteClassType: (id: string) => void;
  weeklySlots: WeeklySlot[];
  addWeeklySlot: (slot: Omit<WeeklySlot, 'id'>) => void;
  updateWeeklySlot: (id: string, slot: Partial<WeeklySlot>) => void;
  deleteWeeklySlot: (id: string) => void;
  generateMonthlySchedule: (year: number, month: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial mock classes data
const initialClasses: Class[] = [
  {
    id: '1',
    title: 'Morning Flow',
    time: '07:00 AM',
    instructor: 'Annie Bliss',
    level: 'All Levels',
    capacity: 20,
    enrolled: 15,
    day: 'Monday',
    duration: '60 min',
    description: 'Start your day with an energizing vinyasa flow. Perfect for all levels, this class focuses on building strength, flexibility, and mindfulness through fluid movement and breath work.',
    room: 'Studio A'
  },
  {
    id: '2',
    title: 'Gentle Yoga',
    time: '10:00 AM',
    instructor: 'Sarah Chen',
    level: 'Beginner',
    capacity: 15,
    enrolled: 12,
    day: 'Monday',
    duration: '75 min',
    description: 'A slow-paced practice focusing on gentle stretches and relaxation. Ideal for beginners or those looking for a more meditative practice.',
    room: 'Studio B'
  },
  {
    id: '3',
    title: 'Power Yoga',
    time: '06:00 PM',
    instructor: 'Mike Johnson',
    level: 'Intermediate',
    capacity: 20,
    enrolled: 18,
    day: 'Monday',
    duration: '60 min',
    description: 'A dynamic, challenging practice that builds strength and stamina. Expect to work up a sweat with strong flows and sustained poses.',
    room: 'Studio A'
  },
  {
    id: '4',
    title: 'Sunrise Flow',
    time: '06:30 AM',
    instructor: 'Annie Bliss',
    level: 'All Levels',
    capacity: 20,
    enrolled: 10,
    day: 'Tuesday',
    duration: '60 min',
    description: 'Greet the morning sun with gentle flows and energizing breathwork. Set positive intentions for the day ahead.',
    room: 'Studio A'
  },
  {
    id: '5',
    title: 'Yin Yoga',
    time: '07:30 PM',
    instructor: 'Sarah Chen',
    level: 'All Levels',
    capacity: 15,
    enrolled: 13,
    day: 'Tuesday',
    duration: '90 min',
    description: 'A slow, meditative practice holding poses for 3-5 minutes. Perfect for deep stretching and releasing tension.',
    room: 'Studio B'
  },
  {
    id: '6',
    title: 'Vinyasa Flow',
    time: '09:00 AM',
    instructor: 'Annie Bliss',
    level: 'Intermediate',
    capacity: 20,
    enrolled: 16,
    day: 'Wednesday',
    duration: '75 min',
    description: 'Connect movement with breath in this dynamic flow class. Build heat and explore creative sequences.',
    room: 'Studio A'
  },
  {
    id: '7',
    title: 'Restorative Yoga',
    time: '06:00 PM',
    instructor: 'Sarah Chen',
    level: 'All Levels',
    capacity: 12,
    enrolled: 8,
    day: 'Wednesday',
    duration: '60 min',
    description: 'Deeply relaxing practice using props to support the body. Calm the nervous system and restore energy.',
    room: 'Studio B'
  },
  {
    id: '8',
    title: 'Core Power',
    time: '12:00 PM',
    instructor: 'Mike Johnson',
    level: 'Intermediate',
    capacity: 20,
    enrolled: 14,
    day: 'Thursday',
    duration: '45 min',
    description: 'Focused core strengthening class combining yoga and pilates-inspired movements. Build stability and strength.',
    room: 'Studio A'
  },
  {
    id: '9',
    title: 'Hatha Yoga',
    time: '10:00 AM',
    instructor: 'Annie Bliss',
    level: 'Beginner',
    capacity: 15,
    enrolled: 11,
    day: 'Friday',
    duration: '60 min',
    description: 'Traditional yoga practice focusing on foundational poses and alignment. Great for beginners.',
    room: 'Studio A'
  },
  {
    id: '10',
    title: 'Evening Flow',
    time: '05:30 PM',
    instructor: 'Sarah Chen',
    level: 'All Levels',
    capacity: 20,
    enrolled: 17,
    day: 'Friday',
    duration: '60 min',
    description: 'Unwind from your week with gentle flows and deep stretches. Release stress and tension.',
    room: 'Studio B'
  },
  {
    id: '11',
    title: 'Weekend Warrior',
    time: '09:00 AM',
    instructor: 'Mike Johnson',
    level: 'Advanced',
    capacity: 15,
    enrolled: 12,
    day: 'Saturday',
    duration: '90 min',
    description: 'Challenge yourself with advanced poses, arm balances, and inversions. Requires solid foundation.',
    room: 'Studio A'
  },
  {
    id: '12',
    title: 'Yoga Nidra',
    time: '04:00 PM',
    instructor: 'Sarah Chen',
    level: 'All Levels',
    capacity: 20,
    enrolled: 15,
    day: 'Saturday',
    duration: '75 min',
    description: 'Guided meditation and deep relaxation practice. Experience profound rest and rejuvenation.',
    room: 'Studio B'
  },
  {
    id: '13',
    title: 'Sunday Flow',
    time: '10:00 AM',
    instructor: 'Annie Bliss',
    level: 'All Levels',
    capacity: 20,
    enrolled: 18,
    day: 'Sunday',
    duration: '75 min',
    description: 'A balanced practice to prepare for the week ahead. Combine strength, flexibility, and mindfulness.',
    room: 'Studio A'
  },
  {
    id: '14',
    title: 'Meditation & Breathwork',
    time: '05:00 PM',
    instructor: 'Annie Bliss',
    level: 'All Levels',
    capacity: 15,
    enrolled: 10,
    day: 'Sunday',
    duration: '45 min',
    description: 'Explore pranayama techniques and guided meditation. Cultivate inner peace and mental clarity.',
    room: 'Studio B'
  },
  // Teacher Training Sessions
  {
    id: 'training-1',
    title: '200-Hour Yoga Teacher Training',
    time: '09:00 AM - 05:00 PM',
    instructor: 'Annie Bliss',
    level: 'All Levels',
    capacity: 15,
    enrolled: 7,
    day: 'Saturday',
    duration: '12 weeks',
    description: 'Modules: Yoga Philosophy & History | Anatomy & Physiology | Teaching Methodology | Asana Practice & Alignment | Pranayama & Meditation | Chakras & Energy Systems | Ethics & Business of Yoga | Practicum & Teaching Practice',
    room: 'Studio A',
    category: 'training',
    season: 'Spring 2025',
    startDate: 'April 5, 2025',
    endDate: 'June 28, 2025',
    status: 'Enrolling Now',
    earlyBirdPrice: '$2,800',
    regularPrice: '$3,200',
    location: 'Annie Bliss Yoga Studio, Downtown Location'
  },
  {
    id: 'training-2',
    title: '200-Hour Yoga Teacher Training',
    time: '09:00 AM - 05:00 PM',
    instructor: 'Annie Bliss',
    level: 'All Levels',
    capacity: 15,
    enrolled: 3,
    day: 'Saturday',
    duration: '12 weeks',
    description: 'Modules: Yoga Philosophy & History | Anatomy & Physiology | Teaching Methodology | Asana Practice & Alignment | Pranayama & Meditation | Chakras & Energy Systems | Ethics & Business of Yoga | Practicum & Teaching Practice',
    room: 'Studio A',
    category: 'training',
    season: 'Summer 2025',
    startDate: 'July 12, 2025',
    endDate: 'October 4, 2025',
    status: 'Early Bird Open',
    earlyBirdPrice: '$2,800',
    regularPrice: '$3,200',
    location: 'Annie Bliss Yoga Studio, Downtown Location'
  },
  {
    id: 'training-3',
    title: '200-Hour Yoga Teacher Training',
    time: '09:00 AM - 05:00 PM',
    instructor: 'Annie Bliss',
    level: 'All Levels',
    capacity: 15,
    enrolled: 0,
    day: 'Saturday',
    duration: '12 weeks',
    description: 'Modules: Yoga Philosophy & History | Anatomy & Physiology | Teaching Methodology | Asana Practice & Alignment | Pranayama & Meditation | Chakras & Energy Systems | Ethics & Business of Yoga | Practicum & Teaching Practice',
    room: 'Studio A',
    category: 'training',
    season: 'Fall 2025',
    startDate: 'October 18, 2025',
    endDate: 'January 10, 2026',
    status: 'Coming Soon',
    earlyBirdPrice: '$2,800',
    regularPrice: '$3,200',
    location: 'Annie Bliss Yoga Studio, Downtown Location'
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<Class[]>(initialClasses);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([]);

  const addClass = (classData: Omit<Class, 'id'>) => {
    const newClass: Class = {
      ...classData,
      id: Date.now().toString(),
    };
    setClasses((prev) => [...prev, newClass]);
  };

  const bookClass = (classId: string) => {
    setClasses((prev) => prev.map((cls) => {
      if (cls.id === classId && cls.enrolled < cls.capacity) {
        return { ...cls, enrolled: cls.enrolled + 1 };
      }
      return cls;
    }));
  };

  const addClassType = (classType: Omit<ClassType, 'id'>) => {
    const newClassType: ClassType = {
      ...classType,
      id: Date.now().toString(),
    };
    setClassTypes((prev) => [...prev, newClassType]);
  };

  const updateClassType = (id: string, classType: Partial<ClassType>) => {
    setClassTypes((prev) => prev.map((ct) => {
      if (ct.id === id) {
        return { ...ct, ...classType };
      }
      return ct;
    }));
  };

  const deleteClassType = (id: string) => {
    setClassTypes((prev) => prev.filter((ct) => ct.id !== id));
  };

  const addWeeklySlot = (slot: Omit<WeeklySlot, 'id'>) => {
    const newSlot: WeeklySlot = {
      ...slot,
      id: Date.now().toString(),
    };
    setWeeklySlots((prev) => [...prev, newSlot]);
  };

  const updateWeeklySlot = (id: string, slot: Partial<WeeklySlot>) => {
    setWeeklySlots((prev) => prev.map((ws) => {
      if (ws.id === id) {
        return { ...ws, ...slot };
      }
      return ws;
    }));
  };

  const deleteWeeklySlot = (id: string) => {
    setWeeklySlots((prev) => prev.filter((ws) => ws.id !== id));
  };

  const generateMonthlySchedule = (year: number, month: number) => {
    // Logic to generate a monthly schedule based on class types and weekly slots
    // This is a placeholder for the actual implementation
    console.log(`Generating schedule for ${month}/${year}`);
  };

  return (
    <AppContext.Provider value={{ classes, addClass, isLoggedIn, setIsLoggedIn, bookClass, classTypes, addClassType, updateClassType, deleteClassType, weeklySlots, addWeeklySlot, updateWeeklySlot, deleteWeeklySlot, generateMonthlySchedule }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}