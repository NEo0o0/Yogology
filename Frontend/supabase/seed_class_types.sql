-- Seed script for class_types table
-- Run this in your Supabase SQL Editor to populate initial class types

INSERT INTO class_types (title, description, level, duration_minutes, default_price, color_code)
VALUES 
  (
    'Vinyasa',
    'A dynamic, flowing style of yoga that synchronizes breath with movement. Perfect for building strength, flexibility, and mindfulness through creative sequences.',
    'All Levels',
    60,
    25.00,
    '#8CA899'
  ),
  (
    'Hatha',
    'A gentle, foundational practice focusing on basic postures and breathing techniques. Ideal for beginners and those seeking a slower-paced, meditative experience.',
    'Beginner',
    75,
    20.00,
    '#C18A7A'
  ),
  (
    'Iyengar',
    'A precise, alignment-focused practice using props like blocks and straps. Emphasizes proper form and holding poses longer for therapeutic benefits.',
    'Intermediate',
    90,
    30.00,
    '#D4A574'
  ),
  (
    'Pilates',
    'A low-impact exercise method focusing on core strength, flexibility, and body awareness. Combines controlled movements with breath work for total body conditioning.',
    'All Levels',
    60,
    28.00,
    '#7A9FC1'
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the insert
SELECT * FROM class_types ORDER BY title;
