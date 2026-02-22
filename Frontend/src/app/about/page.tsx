import { AboutHero } from '@/components/about/AboutHero';
import { InstructorProfile } from '@/components/about/InstructorProfile';
import { OurVision } from '@/components/about/OurVision';
import { Certifications } from '@/components/about/Certifications';

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
