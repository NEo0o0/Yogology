"use client";

import { X, Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface PastEventModalProps {
  event: {
    id: number;
    title: string;
    image: string;
    date: string;
    time: string;
    location: string;
    excerpt: string;
    category: string;
  };
  onClose: () => void;
}

export function PastEventModal({ event, onClose }: PastEventModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Generate gallery images - using the main image + variations for demo
  const galleryImages = [
    event.image,
    event.image + '&blur=2',
    event.image + '&sat=-100',
    event.image + '&fm=jpg&q=60',
    event.image + '&crop=entropy',
    event.image + '&fit=crop&h=600',
  ];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] text-white p-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-300"
          >
            <X size={24} />
          </button>
          
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-2">
              {event.category}
            </div>
            <h2 className="text-white">{event.title}</h2>
            <p className="text-white/90">{event.date}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Event Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <Calendar className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Date Held</p>
                <p className="text-[var(--color-earth-dark)]">{event.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <Clock className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Time</p>
                <p className="text-[var(--color-earth-dark)]">{event.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
              <MapPin className="text-[var(--color-sage)]" size={20} />
              <div>
                <p className="text-xs text-[var(--color-stone)]">Location</p>
                <p className="text-[var(--color-earth-dark)]">{event.location}</p>
              </div>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-[var(--color-earth-dark)] mb-3">About This Event</h3>
            <p className="text-[var(--color-stone)] leading-relaxed">
              {event.excerpt}
            </p>
          </div>

          {/* Photo Gallery Carousel */}
          <div>
            <h3 className="text-[var(--color-earth-dark)] mb-4">Event Highlights</h3>
            
            {/* Main Image with Navigation */}
            <div className="relative bg-[var(--color-cream)] rounded-lg overflow-hidden group">
              <div className="aspect-video">
                <img
                  src={galleryImages[currentImageIndex]}
                  alt={`${event.title} photo ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Navigation Arrows */}
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={24} />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                {currentImageIndex + 1} / {galleryImages.length}
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-6 gap-2 mt-4">
              {galleryImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    currentImageIndex === index
                      ? 'border-[var(--color-sage)] scale-105 shadow-lg'
                      : 'border-transparent hover:border-[var(--color-sand)]'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Testimonial/Memory */}
          <div className="bg-gradient-to-r from-[var(--color-sage)]/10 to-[var(--color-clay)]/10 p-6 rounded-lg border-l-4 border-[var(--color-sage)]">
            <p className="text-[var(--color-stone)] italic mb-2">
              "This was such a transformative experience! The energy in the room was incredible, and I left feeling renewed and inspired. Can't wait for the next one!"
            </p>
            <p className="text-sm text-[var(--color-stone)]">— Sarah M., Participant</p>
          </div>

          {/* CTA for Future Events */}
          <div className="text-center pt-4 border-t border-[var(--color-sand)]">
            <p className="text-[var(--color-stone)] mb-4">
              Want to join us for our next event?
            </p>
            <button
              onClick={onClose}
              className="inline-block bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-8 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View Upcoming Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
