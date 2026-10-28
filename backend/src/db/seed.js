/**
 * Database Seeding Script (Node.js)
 * Executes seeding for Supabase or local persistent database store.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const dbService = require('../services/dbService');
const { isSupabaseConfigured, supabase } = require('../config/supabase');

async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');
  console.log(`[Seed] Target Engine: ${isSupabaseConfigured ? 'Supabase Cloud PostgreSQL' : 'Local Persistent Store'}`);

  const defaultPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  try {
    if (isSupabaseConfigured) {
      console.log('[Seed] Inserting users into Supabase...');
      const usersToInsert = [
        {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'admin@exam.com',
          password_hash: passwordHash,
          full_name: 'System Administrator',
          role: 'admin'
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          email: 'teacher@exam.com',
          password_hash: passwordHash,
          full_name: 'Prof. Sarah Jenkins',
          role: 'teacher'
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          email: 'student@exam.com',
          password_hash: passwordHash,
          full_name: 'Alex Rivera',
          role: 'student'
        },
        {
          id: '44444444-4444-4444-8444-444444444444',
          email: 'student2@exam.com',
          password_hash: passwordHash,
          full_name: 'Emily Zhang',
          role: 'student'
        }
      ];

      for (const u of usersToInsert) {
        await supabase.from('users').upsert(u, { onConflict: 'email' });
      }

      console.log('[Seed] Inserting sample exams into Supabase...');
      const examsToInsert = [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          title: 'Full Stack Web Development Certification Exam',
          description: 'Comprehensive examination covering modern client-server architecture, HTTP protocols, REST APIs, and database fundamentals.',
          subject: 'Computer Science',
          teacher_id: '22222222-2222-4222-8222-222222222222',
          duration_minutes: 45,
          total_marks: 50,
          passing_marks: 30,
          is_published: true
        },
        {
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          title: 'Data Structures & Algorithms Midterm',
          description: 'Rigorous assessment of computational complexity, tree traversal algorithms, and optimal data structure selection.',
          subject: 'Computer Science',
          teacher_id: '22222222-2222-4222-8222-222222222222',
          duration_minutes: 30,
          total_marks: 40,
          passing_marks: 24,
          is_published: true
        }
      ];

      for (const e of examsToInsert) {
        await supabase.from('exams').upsert(e, { onConflict: 'id' });
      }
    } else {
      console.log('[Seed] Local database store is pre-initialized with rich sample data.');
    }

    console.log('✅ Seeding completed successfully!');
    console.log('Demo Credentials:');
    console.log(' - Admin:   admin@exam.com   / Password123!');
    console.log(' - Teacher: teacher@exam.com / Password123!');
    console.log(' - Student: student@exam.com / Password123!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
