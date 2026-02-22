'use client';

import { MessageCircle, MapPin, Mail, Clock, Instagram } from 'lucide-react';
import { useAppSettings } from '@/hooks';

export function ContactBooking() {
  const { getSetting } = useAppSettings();
  
  // Fetch dynamic contact info from app_settings with defaults
  const whatsapp = getSetting('whatsapp_number', '66844207947');
  const email = getSetting('contact_email', 'annieblissonline.gmail.com');
  const instagram = getSetting('instagram_url', 'https://www.instagram.com/annie_bliss_yoga');
  
  // 3 ตัวนี้คือตัวใหม่ที่เราจะเอาไปแทนที่ Text เดิมครับ
  const address = getSetting('studio_address', 'Room906 PT Residece Bldg.\nSuthep, Muang-chiangmai\nCHIANGMAI\n50200');
  const mapUrl = getSetting('map_url', 'https://maps.app.goo.gl/your-location-link'); // ลิงก์ Google Map (กดแล้วไปหน้า Map)
  const businessHours = getSetting('business_hours', 'Mon-Sun: 6:00 AM - 9:00 PM');

  return (
    <section className="py-20 px-6 bg-[var(--color-cream)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="mb-4 text-[var(--color-earth-dark)]">Contact & Booking</h1>
          <p className="text-[var(--color-stone)] max-w-2xl mx-auto">
            We'd love to hear from you! Reach out to book a class, ask questions, or learn more about our programs.
          </p>
        </div>

        {/* Booking Note - Prominent */}
        <div className="bg-gradient-to-r from-[var(--color-sage)]/20 to-[var(--color-clay)]/20 border-l-4 border-[var(--color-sage)] rounded-lg p-6 mb-12 text-center">
          <p className="text-lg text-[var(--color-earth-dark)]">
            To book a class manually , please contact us via <span className="font-semibold">WhatsApp</span> or <span className="font-semibold">Instagram</span>
          </p>
        </div>

        {/* Contact Info Section */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-[var(--color-earth-dark)]">Get In Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366]/30 transition-colors">
                  <MessageCircle size={28} className="text-[#25D366]" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-[var(--color-earth-dark)]">WhatsApp</h3>
                  <p className="text-sm text-[var(--color-stone)]">Quick chat & booking</p>
                </div>
              </div>
              <div className="text-2xl text-[var(--color-earth-dark)] group-hover:text-[#25D366] transition-colors">
                Chat with us →
              </div>
            </a>

            {/* Instagram */}
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[#E4405F]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#E4405F]/30 transition-colors">
                  <Instagram size={28} className="text-[#E4405F]" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-[var(--color-earth-dark)]">Instagram</h3>
                  <p className="text-sm text-[var(--color-stone)]">DM us anytime</p>
                </div>
              </div>
              <div className="text-2xl text-[var(--color-earth-dark)] group-hover:text-[#E4405F] transition-colors">
                annie_bliss_yoga →
              </div>
            </a>
          </div>

          {/* Additional Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-6">
            {/* Email */}
            <div className="bg-white rounded-lg p-6 shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-clay)]/20 flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-[var(--color-clay)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--color-stone)] mb-1">Email</div>
                <a 
                  href={`mailto:${email}`}
                  className="text-[var(--color-earth-dark)] hover:text-[var(--color-sage)] transition-colors duration-300"
                >
                  {email}
                </a>
              </div>
            </div>

            {/* Business Hours (แก้ไขให้ดึงจาก DB) */}
            <div className="bg-white rounded-lg p-6 shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-clay)]/20 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-[var(--color-clay)]" />
              </div>
              <div>
                <div className="text-sm text-[var(--color-stone)] mb-1">Business Hours</div>
                {/* ใช้ตัวแปร businessHours แทน Text แข็งๆ */}
                <div className="text-[var(--color-earth-dark)]">{businessHours}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout for Map and Form */}
          <div>
            <h2 className="mb-6 text-center text-[var(--color-earth-dark)]">Visit Our Studio</h2>
            
            {/* Map Placeholder */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="bg-[var(--color-sand)] h-80 flex items-center justify-center relative">
                {/* iframe ยังคง Hardcode ไว้ก่อนเพราะปกติ URL embed กับ URL ปกติมันคนละตัวกัน */}
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3777.020139543604!2d98.97149379999999!3d18.7972558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30da3b10249c3b97%3A0x7b46f9fdc193c1df!2sAnnie%20Bliss%20Yoga!5e0!3m2!1sen!2sth!4v1766840151678!5m2!1sen!2sth" 
                  width="100%" 
                  height="100%" 
                  style={{border:0}}
                  allowFullScreen={true}
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-sage)]/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin size={20} className="text-[var(--color-sage)]" />
                </div>
                <div>
                  <h3 className="mb-2 text-[var(--color-earth-dark)]">Studio Address</h3>
                  {/* แก้ไขให้ดึง Address จาก DB และรองรับการขึ้นบรรทัดใหม่ด้วย whitespace-pre-line */}
                  <p className="text-[var(--color-stone)] leading-relaxed whitespace-pre-line">
                    {address}
                  </p>
                  
                  {/* แก้ไขลิงก์ Get Directions ให้ดึงจาก DB */}
                  <a 
                    href={mapUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-[var(--color-sage)] hover:text-[var(--color-clay)] transition-colors duration-300 text-sm"
                  >
                    Get Directions →
                  </a>
                </div>
              </div>
            </div>
      
          
        </div>

        {/* Social Media Section - Removed */}
      </div>
    </section>
  );
}