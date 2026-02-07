import { Hero } from '@/components/Hero';
import { WhyAnnieBliss } from '@/components/WhyAnnieBliss';
import { StudioPreview } from '@/components/StudioPreview';
import { ClassRules } from '@/components/ClassRules';
import { CancellationPolicy } from '@/components/CancellationPolicy';
import { WorkshopsEvents } from '@/components/WorkshopsEvents';

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
