/**
 * Database Service Layer
 * Supports Supabase PostgreSQL natively, with an automatic persistent JSON file fallback
 * to allow immediate local testing out-of-the-box before cloud credentials are setup.
 */
const fs = require('fs');
const path = require('path');
const { supabase, isSupabaseConfigured } = require('../config/supabase');
const crypto = require('crypto');

// Local storage path for fallback
const LOCAL_STORE_PATH = path.join(__dirname, '..', 'db', 'local_store.json');

// Default initial state for local fallback mode
const INITIAL_LOCAL_DATA = {
  users: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'admin@exam.com',
      password_hash: '$2b$10$cVgh0AXO7GvFtcR6KOFadukzwbwU0bpxKuWWPQeC/SD0VoObH7v9.',
      full_name: 'System Administrator',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      email: 'teacher@exam.com',
      password_hash: '$2b$10$cVgh0AXO7GvFtcR6KOFadukzwbwU0bpxKuWWPQeC/SD0VoObH7v9.',
      full_name: 'Prof. Sarah Jenkins',
      role: 'teacher',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      email: 'student@exam.com',
      password_hash: '$2b$10$cVgh0AXO7GvFtcR6KOFadukzwbwU0bpxKuWWPQeC/SD0VoObH7v9.',
      full_name: 'Alex Rivera',
      role: 'student',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      email: 'student2@exam.com',
      password_hash: '$2b$10$cVgh0AXO7GvFtcR6KOFadukzwbwU0bpxKuWWPQeC/SD0VoObH7v9.',
      full_name: 'Emily Zhang',
      role: 'student',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  exams: [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      title: 'Full Stack Web Development Certification Exam',
      description: 'Comprehensive examination covering modern client-server architecture, HTTP protocols, REST APIs, and database fundamentals.',
      subject: 'Computer Science',
      teacher_id: '22222222-2222-4222-8222-222222222222',
      duration_minutes: 45,
      total_marks: 50,
      passing_marks: 30,
      is_published: true,
      start_date: new Date(Date.now() - 86400000).toISOString(),
      end_date: new Date(Date.now() + 2592000000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      is_published: true,
      start_date: new Date(Date.now() - 172800000).toISOString(),
      end_date: new Date(Date.now() + 1296000000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      title: 'Database Management Systems & SQL Fundamentals',
      description: 'Core test on relational database modeling, normalization, SQL queries, and ACID properties.',
      subject: 'Information Technology',
      teacher_id: '22222222-2222-4222-8222-222222222222',
      duration_minutes: 20,
      total_marks: 30,
      passing_marks: 18,
      is_published: true,
      start_date: new Date(Date.now() - 259200000).toISOString(),
      end_date: new Date(Date.now() + 1728000000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      title: 'Advanced Cloud Architecture & Microservices',
      description: 'Draft exam covering containerization, service mesh patterns, and serverless computing.',
      subject: 'Cloud Computing',
      teacher_id: '22222222-2222-4222-8222-222222222222',
      duration_minutes: 60,
      total_marks: 100,
      passing_marks: 60,
      is_published: false,
      start_date: new Date(Date.now() + 432000000).toISOString(),
      end_date: new Date(Date.now() + 3888000000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  questions: [
    {
      id: 'q1111111-1111-4111-8111-111111111111',
      exam_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      question_text: 'Which HTTP status code signifies that a resource was successfully created on the server?',
      question_type: 'multiple_choice',
      points: 10,
      options: ['200 OK', '201 Created', '204 No Content', '302 Found'],
      correct_answer: '201 Created',
      explanation: 'HTTP 201 Created indicates that the request has succeeded and led to the creation of a new resource.',
      order_index: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 'q2222222-2222-4222-8222-222222222222',
      exam_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      question_text: 'In JavaScript, the expression (typeof null === "object") evaluates to true.',
      question_type: 'true_false',
      points: 10,
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'In JavaScript, typeof null returns "object" due to a historical legacy implementation detail in early JS engines.',
      order_index: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 'q3333333-3333-4333-8333-333333333333',
      exam_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      question_text: 'What does CORS stand for in modern web browser security architecture?',
      question_type: 'multiple_choice',
      points: 10,
      options: [
        'Cross-Origin Resource Sharing',
        'Centralized Object Routing Standard',
        'Client Origin Remote Service',
        'Cascading Operations Relay Standard'
      ],
      correct_answer: 'Cross-Origin Resource Sharing',
      explanation: 'CORS stands for Cross-Origin Resource Sharing, a mechanism that uses HTTP headers to tell browsers to give a web application running at one origin access to selected resources from a different origin.',
      order_index: 3,
      created_at: new Date().toISOString()
    },
    {
      id: 'q4444444-4444-4444-8444-444444444444',
      exam_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      question_text: 'Which standard data format is most commonly used for serializing and transmitting structured data in RESTful APIs?',
      question_type: 'short_answer',
      points: 10,
      options: [],
      correct_answer: 'JSON',
      explanation: 'JSON (JavaScript Object Notation) is the lightweight, language-independent data-interchange format predominantly used by REST APIs.',
      order_index: 4,
      created_at: new Date().toISOString()
    },
    {
      id: 'q5555555-5555-4555-8555-555555555555',
      exam_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      question_text: 'Middleware functions in Express.js have access to the request object, response object, and the next middleware function in the application’s request-response cycle.',
      question_type: 'true_false',
      points: 10,
      options: ['True', 'False'],
      correct_answer: 'True',
      explanation: 'Express middleware functions have access to req, res, and next().',
      order_index: 5,
      created_at: new Date().toISOString()
    },
    {
      id: 'q6666666-6666-4666-8666-666666666666',
      exam_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      question_text: 'What is the worst-case time complexity of QuickSort when a naive pivot strategy is used on an already sorted array?',
      question_type: 'multiple_choice',
      points: 10,
      options: ['O(N log N)', 'O(N)', 'O(N^2)', 'O(log N)'],
      correct_answer: 'O(N^2)',
      explanation: 'Naive pivot selection leads to partitions of size 1 and N-1, yielding O(N^2) quadratic time complexity.',
      order_index: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 'q7777777-7777-4777-8777-777777777777',
      exam_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      question_text: 'A binary search tree guarantees O(log N) search time even if it is completely unbalanced.',
      question_type: 'true_false',
      points: 10,
      options: ['True', 'False'],
      correct_answer: 'False',
      explanation: 'An unbalanced BST degenerates into a linked list with O(N) search time. Balanced trees (AVL, Red-Black) are required for O(log N).',
      order_index: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 'q8888888-8888-4888-8888-888888888888',
      exam_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      question_text: 'Which data structure operates on a Last-In, First-Out (LIFO) principle?',
      question_type: 'short_answer',
      points: 10,
      options: [],
      correct_answer: 'Stack',
      explanation: 'A Stack operates on the LIFO principle.',
      order_index: 3,
      created_at: new Date().toISOString()
    },
    {
      id: 'q9999999-9999-4999-8999-999999999999',
      exam_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      question_text: 'Which algorithm is used to find the shortest path in a weighted graph with non-negative edge weights?',
      question_type: 'multiple_choice',
      points: 10,
      options: [
        "Dijkstra's Algorithm",
        "Kruskal's Algorithm",
        'Depth-First Search',
        'Floyd-Warshall with negative cycles'
      ],
      correct_answer: "Dijkstra's Algorithm",
      explanation: "Dijkstra's algorithm finds single-source shortest paths in graphs with non-negative weights.",
      order_index: 4,
      created_at: new Date().toISOString()
    }
  ],
  exam_attempts: [
    {
      id: 'e1111111-1111-4111-8111-111111111111',
      exam_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      student_id: '33333333-3333-4333-8333-333333333333',
      started_at: new Date(Date.now() - 7200000).toISOString(),
      submitted_at: new Date(Date.now() - 5100000).toISOString(),
      status: 'completed',
      total_score: 40.0,
      max_score: 50.0,
      percentage: 80.0,
      is_passed: true,
      answers: {
        'q1111111-1111-4111-8111-111111111111': '201 Created',
        'q2222222-2222-4222-8222-222222222222': 'True',
        'q3333333-3333-4333-8333-333333333333': 'Cross-Origin Resource Sharing',
        'q4444444-4444-4444-8444-444444444444': 'XML',
        'q5555555-5555-4555-8555-555555555555': 'True'
      },
      feedback: [
        {
          question_id: 'q1111111-1111-4111-8111-111111111111',
          student_answer: '201 Created',
          correct_answer: '201 Created',
          is_correct: true,
          points_earned: 10,
          max_points: 10
        },
        {
          question_id: 'q2222222-2222-4222-8222-222222222222',
          student_answer: 'True',
          correct_answer: 'True',
          is_correct: true,
          points_earned: 10,
          max_points: 10
        },
        {
          question_id: 'q3333333-3333-4333-8333-333333333333',
          student_answer: 'Cross-Origin Resource Sharing',
          correct_answer: 'Cross-Origin Resource Sharing',
          is_correct: true,
          points_earned: 10,
          max_points: 10
        },
        {
          question_id: 'q4444444-4444-4444-8444-444444444444',
          student_answer: 'XML',
          correct_answer: 'JSON',
          is_correct: false,
          points_earned: 0,
          max_points: 10
        },
        {
          question_id: 'q5555555-5555-4555-8555-555555555555',
          student_answer: 'True',
          correct_answer: 'True',
          is_correct: true,
          points_earned: 10,
          max_points: 10
        }
      ],
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ]
};

// Local File Helper Functions
function readLocalStore() {
  try {
    if (!fs.existsSync(LOCAL_STORE_PATH)) {
      fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(INITIAL_LOCAL_DATA, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(INITIAL_LOCAL_DATA));
    }
    const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local store:', err);
    return JSON.parse(JSON.stringify(INITIAL_LOCAL_DATA));
  }
}

function writeLocalStore(data) {
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local store:', err);
  }
}

// Generate standard UUIDv4
function generateUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize store if needed
if (!isSupabaseConfigured) {
  readLocalStore();
}

/**
 * DB Service object implementing repository methods
 */
const dbService = {
  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  async findUserByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    return store.users.find(u => u.email.toLowerCase() === normalizedEmail) || null;
  },

  async findUserById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, is_active, created_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    const user = store.users.find(u => u.id === id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  async createUser(userData) {
    const id = generateUUID();
    const now = new Date().toISOString();
    const record = {
      id,
      email: userData.email.trim().toLowerCase(),
      password_hash: userData.password_hash,
      full_name: userData.full_name.trim(),
      role: userData.role || 'student',
      is_active: true,
      created_at: now,
      updated_at: now
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    store.users.push(record);
    writeLocalStore(store);
    const { password_hash, ...safeRecord } = record;
    return safeRecord;
  },

  async getAllUsers() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, is_active, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    return store.users.map(({ password_hash, ...rest }) => rest);
  },

  async deleteUser(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const store = readLocalStore();
    store.users = store.users.filter(u => u.id !== id);
    store.exams = store.exams.filter(e => e.teacher_id !== id);
    store.exam_attempts = store.exam_attempts.filter(a => a.student_id !== id);
    writeLocalStore(store);
    return true;
  },

  // -------------------------------------------------------------
  // EXAMS
  // -------------------------------------------------------------
  async getAllExams(filters = {}) {
    if (isSupabaseConfigured) {
      let query = supabase.from('exams').select('*, teacher:teacher_id(full_name, email)');
      
      if (filters.isPublished !== undefined) {
        query = query.eq('is_published', filters.isPublished);
      }
      if (filters.teacherId) {
        query = query.eq('teacher_id', filters.teacherId);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    let result = store.exams.map(exam => {
      const teacher = store.users.find(u => u.id === exam.teacher_id);
      return {
        ...exam,
        teacher: teacher ? { full_name: teacher.full_name, email: teacher.email } : null
      };
    });

    if (filters.isPublished !== undefined) {
      result = result.filter(e => e.is_published === filters.isPublished);
    }
    if (filters.teacherId) {
      result = result.filter(e => e.teacher_id === filters.teacherId);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(s) || e.subject.toLowerCase().includes(s));
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getExamById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('exams')
        .select('*, teacher:teacher_id(full_name, email)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    const exam = store.exams.find(e => e.id === id);
    if (!exam) return null;
    const teacher = store.users.find(u => u.id === exam.teacher_id);
    return {
      ...exam,
      teacher: teacher ? { full_name: teacher.full_name, email: teacher.email } : null
    };
  },

  async createExam(examData) {
    const id = generateUUID();
    const now = new Date().toISOString();
    const record = {
      id,
      title: examData.title.trim(),
      description: examData.description || '',
      subject: examData.subject.trim(),
      teacher_id: examData.teacher_id,
      duration_minutes: parseInt(examData.duration_minutes, 10) || 30,
      total_marks: parseInt(examData.total_marks, 10) || 100,
      passing_marks: parseInt(examData.passing_marks, 10) || 40,
      is_published: Boolean(examData.is_published),
      start_date: examData.start_date || now,
      end_date: examData.end_date || null,
      created_at: now,
      updated_at: now
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('exams')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    store.exams.push(record);
    writeLocalStore(store);
    return record;
  },

  async updateExam(id, updateData) {
    const now = new Date().toISOString();
    const cleanData = { ...updateData, updated_at: now };
    delete cleanData.id;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('exams')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    const index = store.exams.findIndex(e => e.id === id);
    if (index === -1) return null;
    store.exams[index] = { ...store.exams[index], ...cleanData };
    writeLocalStore(store);
    return store.exams[index];
  },

  async deleteExam(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const store = readLocalStore();
    store.exams = store.exams.filter(e => e.id !== id);
    store.questions = store.questions.filter(q => q.exam_id !== id);
    store.exam_attempts = store.exam_attempts.filter(a => a.exam_id !== id);
    writeLocalStore(store);
    return true;
  },

  // -------------------------------------------------------------
  // QUESTIONS
  // -------------------------------------------------------------
  async getQuestionsByExamId(examId, includeAnswer = false) {
    if (isSupabaseConfigured) {
      const fields = includeAnswer
        ? '*'
        : 'id, exam_id, question_text, question_type, points, options, order_index, created_at';
      
      const { data, error } = await supabase
        .from('questions')
        .select(fields)
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    const questions = store.questions
      .filter(q => q.exam_id === examId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    if (includeAnswer) {
      return questions;
    }

    return questions.map(q => {
      const { correct_answer, explanation, ...safeQ } = q;
      return safeQ;
    });
  },

  async getQuestionById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    return store.questions.find(q => q.id === id) || null;
  },

  async createQuestion(questionData) {
    const id = generateUUID();
    const record = {
      id,
      exam_id: questionData.exam_id,
      question_text: questionData.question_text.trim(),
      question_type: questionData.question_type, // 'multiple_choice', 'true_false', 'short_answer'
      points: parseInt(questionData.points, 10) || 1,
      options: questionData.options || [],
      correct_answer: String(questionData.correct_answer || '').trim(),
      explanation: questionData.explanation || '',
      order_index: parseInt(questionData.order_index, 10) || 1,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('questions')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    store.questions.push(record);
    writeLocalStore(store);
    return record;
  },

  async updateQuestion(id, updateData) {
    const cleanData = { ...updateData };
    delete cleanData.id;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('questions')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    const index = store.questions.findIndex(q => q.id === id);
    if (index === -1) return null;
    store.questions[index] = { ...store.questions[index], ...cleanData };
    writeLocalStore(store);
    return store.questions[index];
  },

  async deleteQuestion(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const store = readLocalStore();
    store.questions = store.questions.filter(q => q.id !== id);
    writeLocalStore(store);
    return true;
  },

  // -------------------------------------------------------------
  // EXAM ATTEMPTS & RESULTS
  // -------------------------------------------------------------
  async createAttempt(attemptData) {
    const id = generateUUID();
    const now = new Date().toISOString();
    const record = {
      id,
      exam_id: attemptData.exam_id,
      student_id: attemptData.student_id,
      started_at: now,
      submitted_at: null,
      status: 'in_progress',
      total_score: 0,
      max_score: 0,
      percentage: 0,
      is_passed: false,
      answers: {},
      feedback: [],
      created_at: now
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    store.exam_attempts.push(record);
    writeLocalStore(store);
    return record;
  },

  async getAttemptById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, exam:exam_id(title, subject, duration_minutes, passing_marks, total_marks), student:student_id(full_name, email)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    const attempt = store.exam_attempts.find(a => a.id === id);
    if (!attempt) return null;
    const exam = store.exams.find(e => e.id === attempt.exam_id);
    const student = store.users.find(u => u.id === attempt.student_id);
    return {
      ...attempt,
      exam: exam ? {
        title: exam.title,
        subject: exam.subject,
        duration_minutes: exam.duration_minutes,
        passing_marks: exam.passing_marks,
        total_marks: exam.total_marks
      } : null,
      student: student ? {
        full_name: student.full_name,
        email: student.email
      } : null
    };
  },

  async getAttemptsByStudent(studentId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, exam:exam_id(title, subject, duration_minutes, passing_marks, total_marks)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    const attempts = store.exam_attempts
      .filter(a => a.student_id === studentId)
      .map(attempt => {
        const exam = store.exams.find(e => e.id === attempt.exam_id);
        return {
          ...attempt,
          exam: exam ? {
            title: exam.title,
            subject: exam.subject,
            duration_minutes: exam.duration_minutes,
            passing_marks: exam.passing_marks,
            total_marks: exam.total_marks
          } : null
        };
      });

    return attempts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getAttemptsByExam(examId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, student:student_id(full_name, email)')
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    const attempts = store.exam_attempts
      .filter(a => a.exam_id === examId)
      .map(attempt => {
        const student = store.users.find(u => u.id === attempt.student_id);
        return {
          ...attempt,
          student: student ? { full_name: student.full_name, email: student.email } : null
        };
      });

    return attempts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async updateAttempt(id, updateData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    const index = store.exam_attempts.findIndex(a => a.id === id);
    if (index === -1) return null;
    store.exam_attempts[index] = { ...store.exam_attempts[index], ...updateData };
    writeLocalStore(store);
    return store.exam_attempts[index];
  },

  async getAllAttempts() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, exam:exam_id(title, subject), student:student_id(full_name, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }

    const store = readLocalStore();
    return store.exam_attempts.map(attempt => {
      const exam = store.exams.find(e => e.id === attempt.exam_id);
      const student = store.users.find(u => u.id === attempt.student_id);
      return {
        ...attempt,
        exam: exam ? { title: exam.title, subject: exam.subject } : null,
        student: student ? { full_name: student.full_name, email: student.email } : null
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // -------------------------------------------------------------
  // SYSTEM ANALYTICS & METRICS
  // -------------------------------------------------------------
  async getSystemStats() {
    if (isSupabaseConfigured) {
      const [uRes, eRes, aRes] = await Promise.all([
        supabase.from('users').select('id, role', { count: 'exact' }),
        supabase.from('exams').select('id, is_published', { count: 'exact' }),
        supabase.from('exam_attempts').select('id, is_passed, status', { count: 'exact' })
      ]);

      const users = uRes.data || [];
      const exams = eRes.data || [];
      const attempts = aRes.data || [];

      const studentsCount = users.filter(u => u.role === 'student').length;
      const teachersCount = users.filter(u => u.role === 'teacher').length;
      const completedAttempts = attempts.filter(a => a.status === 'completed');
      const passedAttempts = completedAttempts.filter(a => a.is_passed).length;
      const passRate = completedAttempts.length > 0
        ? Math.round((passedAttempts / completedAttempts.length) * 100)
        : 0;

      return {
        totalUsers: users.length,
        totalStudents: studentsCount,
        totalTeachers: teachersCount,
        totalExams: exams.length,
        publishedExams: exams.filter(e => e.is_published).length,
        totalAttempts: attempts.length,
        completedAttempts: completedAttempts.length,
        overallPassRate: passRate
      };
    }

    const store = readLocalStore();
    const studentsCount = store.users.filter(u => u.role === 'student').length;
    const teachersCount = store.users.filter(u => u.role === 'teacher').length;
    const completedAttempts = store.exam_attempts.filter(a => a.status === 'completed');
    const passedAttempts = completedAttempts.filter(a => a.is_passed).length;
    const passRate = completedAttempts.length > 0
      ? Math.round((passedAttempts / completedAttempts.length) * 100)
      : 0;

    return {
      totalUsers: store.users.length,
      totalStudents: studentsCount,
      totalTeachers: teachersCount,
      totalExams: store.exams.length,
      publishedExams: store.exams.filter(e => e.is_published).length,
      totalAttempts: store.exam_attempts.length,
      completedAttempts: completedAttempts.length,
      overallPassRate: passRate
    };
  }
};

module.exports = dbService;
