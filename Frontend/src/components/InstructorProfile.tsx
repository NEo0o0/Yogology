export function InstructorProfile() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Portrait */}
          <div className="order-2 md:order-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-[var(--color-sand)] rounded-lg -z-10"></div>
              <img
                src="/images/instructor/annie.jpg"
                alt="Annie Bliss - Yoga Instructor"
                className="w-full h-auto rounded-lg shadow-xl object-cover"
              />
            </div>
          </div>

          {/* Biography */}
          <div className="order-1 md:order-2">
            <h2 className="mb-6 text-[var(--color-earth-dark)]">
              Meet Annie Bliss
            </h2>
            <div className="space-y-4 text-[var(--color-stone)]">
              <p>
                Annie holds a Ph.D. in Educational Research and Development and
                has extensive experience working in education and research.
                Beyond the mat, she embraces a simple life close to nature,
                finding joy in simplicity, reading as a true book lover, and
                practicing moving meditation.
              </p>
              <p>
                Annie discovered yoga over 10 years ago during a transformative
                journey through Southeast Asia. What began as a simple physical
                practice soon unfolded into a profound spiritual awakening that
                reshaped the course of her life.
              </p>
              <p>
                After completing her 500-hour advanced teacher training in
                Mysore, India, Annie returned home with a deep commitment to
                sharing the healing power of yoga with her community. Her
                teaching style blends traditional Hatha and Vinyasa flows with
                mindfulness meditation and breathwork, creating classes that are
                both grounding and uplifting.
              </p>
              <p>
                Annie believes that yoga is not about perfection—it’s about
                presence. Her classes offer a safe, welcoming space where
                students of all levels can explore their practice without
                judgment, connecting to their inner wisdom and authentic self.
                Dedicated and passionate, yet friendly and approachable, Annie
                inspires her students to grow with confidence and joy.
              </p>
              <p>
                Beyond teaching, Annie loves dancing, singing, and spending time
                with her beloved cat named Fibonacci. She continues to deepen
                her studies in yoga philosophy and anatomy, nurturing both her
                personal journey and her teaching practice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
