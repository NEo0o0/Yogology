import { Hero } from '@/components/layout/Hero';
import { WhyAnnieBliss } from '@/components/about/WhyAnnieBliss';
import { StudioPreview } from '@/components/about/StudioPreview';
import { ClassRules } from '@/components/classes/ClassRules';
import { CancellationPolicy } from '@/components/classes/CancellationPolicy';
import { WorkshopsEvents } from '@/components/workshops/WorkshopsEvents';

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyAnnieBliss />
      <StudioPreview />
      <ClassRules />
      <CancellationPolicy />
      <WorkshopsEvents />
    </>
  );
}
