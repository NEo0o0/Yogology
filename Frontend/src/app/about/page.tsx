import { AboutHero } from '@/components/AboutHero';
import { InstructorProfile } from '@/components/InstructorProfile';
import { OurVision } from '@/components/OurVision';
import { Certifications } from '@/components/Certifications';

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <InstructorProfile />
      <OurVision />
      <Certifications />
    </>
  );
}
