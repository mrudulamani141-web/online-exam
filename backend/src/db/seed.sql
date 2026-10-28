-- ==============================================================================
-- Web-Based Examination Management System - Seed Data (Supabase / PostgreSQL)
-- Default Password for all demo accounts: Password123!
-- ==============================================================================

-- 1. Insert Initial Users (Admin, Teacher, Students)
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES 
  (
    '11111111-1111-4111-8111-111111111111',
    'admin@exam.com',
    '$2b$10$cVgh0AXO7GvFtcR6KOFadukzwbwU0bpxKuWWPQeC/SD0VoObH7v9.',
    'System Administrator',
    'admin'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'teacher@exam.com',
    '$2b$10$cVgh0AXO7GvFtcR6KOFadukzwbwU0bpxKuWWPQeC/SD0VoObH7v9.',
    'Prof. Sarah Jenkins',
    'teacher'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'student@exam.com',
    '$2b$10$cVgh0AXO7GvFtcR6KOFadukzwbwU0bpxKuWWPQeC/SD0VoObH7v9.',
    'Alex Rivera',
    'student'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'student2@exam.com',
    '$2b$10$cVgh0AXO7GvFtcR6KOFadukzwbwU0bpxKuWWPQeC/SD0VoObH7v9.',
    'Emily Zhang',
    'student'
  )
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Sample Exams
INSERT INTO exams (id, title, description, subject, teacher_id, duration_minutes, total_marks, passing_marks, is_published, start_date, end_date)
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Full Stack Web Development Certification Exam',
    'Comprehensive examination covering modern client-server architecture, HTTP protocols, REST APIs, and database fundamentals.',
    'Computer Science',
    '22222222-2222-4222-8222-222222222222',
    45,
    50,
    30,
    TRUE,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Data Structures & Algorithms Midterm',
    'Rigorous assessment of computational complexity, tree traversal algorithms, and optimal data structure selection.',
    'Computer Science',
    '22222222-2222-4222-8222-222222222222',
    30,
    40,
    24,
    TRUE,
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '15 days'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Database Management Systems & SQL Fundamentals',
    'Core test on relational database modeling, normalization, SQL queries, and ACID properties.',
    'Information Technology',
    '22222222-2222-4222-8222-222222222222',
    20,
    30,
    18,
    TRUE,
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '20 days'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'Advanced Cloud Architecture & Microservices',
    'Draft exam covering containerization, service mesh patterns, and serverless computing.',
    'Cloud Computing',
    '22222222-2222-4222-8222-222222222222',
    60,
    100,
    60,
    FALSE,
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '45 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Questions for Exam 1: Full Stack Web Development
INSERT INTO questions (id, exam_id, question_text, question_type, points, options, correct_answer, explanation, order_index)
VALUES
  (
    'q1111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Which HTTP status code signifies that a resource was successfully created on the server?',
    'multiple_choice',
    10,
    '["200 OK", "201 Created", "204 No Content", "302 Found"]'::jsonb,
    '201 Created',
    'HTTP 201 Created indicates that the request has succeeded and led to the creation of a new resource.',
    1
  ),
  (
    'q2222222-2222-4222-8222-222222222222',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'In JavaScript, the expression (typeof null === "object") evaluates to true.',
    'true_false',
    10,
    '["True", "False"]'::jsonb,
    'True',
    'In JavaScript, typeof null returns "object" due to a historical legacy implementation detail in early JS engines.',
    2
  ),
  (
    'q3333333-3333-4333-8333-333333333333',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'What does CORS stand for in modern web browser security architecture?',
    'multiple_choice',
    10,
    '["Cross-Origin Resource Sharing", "Centralized Object Routing Standard", "Client Origin Remote Service", "Cascading Operations Relay Standard"]'::jsonb,
    'Cross-Origin Resource Sharing',
    'CORS stands for Cross-Origin Resource Sharing, a mechanism that uses HTTP headers to tell browsers to give a web application running at one origin access to selected resources from a different origin.',
    3
  ),
  (
    'q4444444-4444-4444-8444-444444444444',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Which standard data format is most commonly used for serializing and transmitting structured data in RESTful APIs?',
    'short_answer',
    10,
    '[]'::jsonb,
    'JSON',
    'JSON (JavaScript Object Notation) is the lightweight, language-independent data-interchange format predominantly used by REST APIs.',
    4
  ),
  (
    'q5555555-5555-4555-8555-555555555555',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Middleware functions in Express.js have access to the request object, response object, and the next middleware function in the application’s request-response cycle.',
    'true_false',
    10,
    '["True", "False"]'::jsonb,
    'True',
    'Express middleware functions have access to req, res, and next().',
    5
  )
ON CONFLICT (id) DO NOTHING;

-- Questions for Exam 2: Data Structures & Algorithms
INSERT INTO questions (id, exam_id, question_text, question_type, points, options, correct_answer, explanation, order_index)
VALUES
  (
    'q6666666-6666-4666-8666-666666666666',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'What is the worst-case time complexity of QuickSort when a naive pivot strategy is used on an already sorted array?',
    'multiple_choice',
    10,
    '["O(N log N)", "O(N)", "O(N^2)", "O(log N)"]'::jsonb,
    'O(N^2)',
    'Naive pivot selection (e.g. first or last element) leads to unbalanced partitions of size 1 and N-1, yielding O(N^2) time complexity.',
    1
  ),
  (
    'q7777777-7777-4777-8777-777777777777',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'A binary search tree guarantees O(log N) search time even if it is completely unbalanced.',
    'true_false',
    10,
    '["True", "False"]'::jsonb,
    'False',
    'An unbalanced BST degenerates into a linked list with O(N) search time. Self-balancing trees (AVL, Red-Black) are required for O(log N) guarantees.',
    2
  ),
  (
    'q8888888-8888-4888-8888-888888888888',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Which data structure operates on a Last-In, First-Out (LIFO) principle?',
    'short_answer',
    10,
    '[]'::jsonb,
    'Stack',
    'A Stack operates on the LIFO principle.',
    3
  ),
  (
    'q9999999-9999-4999-8999-999999999999',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Which algorithm is used to find the shortest path in a weighted graph with non-negative edge weights?',
    'multiple_choice',
    10,
    '["Dijkstra''s Algorithm", "Kruskal''s Algorithm", "Depth-First Search", "Floyd-Warshall with negative cycles"]'::jsonb,
    'Dijkstra''s Algorithm',
    'Dijkstra''s algorithm finds single-source shortest paths in graphs with non-negative weights.',
    4
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Completed Exam Attempt for Student 1
INSERT INTO exam_attempts (
  id, exam_id, student_id, started_at, submitted_at, status, 
  total_score, max_score, percentage, is_passed, answers, feedback
)
VALUES (
  'e1111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '33333333-3333-4333-8333-333333333333',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour 25 minutes',
  'completed',
  40.00,
  50.00,
  80.00,
  TRUE,
  '{"q1111111-1111-4111-8111-111111111111": "201 Created", "q2222222-2222-4222-8222-222222222222": "True", "q3333333-3333-4333-8333-333333333333": "Cross-Origin Resource Sharing", "q4444444-4444-4444-8444-444444444444": "XML", "q5555555-5555-4555-8555-555555555555": "True"}'::jsonb,
  '[
    {"question_id": "q1111111-1111-4111-8111-111111111111", "student_answer": "201 Created", "correct_answer": "201 Created", "is_correct": true, "points_earned": 10, "max_points": 10},
    {"question_id": "q2222222-2222-4222-8222-222222222222", "student_answer": "True", "correct_answer": "True", "is_correct": true, "points_earned": 10, "max_points": 10},
    {"question_id": "q3333333-3333-4333-8333-333333333333", "student_answer": "Cross-Origin Resource Sharing", "correct_answer": "Cross-Origin Resource Sharing", "is_correct": true, "points_earned": 10, "max_points": 10},
    {"question_id": "q4444444-4444-4444-8444-444444444444", "student_answer": "XML", "correct_answer": "JSON", "is_correct": false, "points_earned": 0, "max_points": 10},
    {"question_id": "q5555555-5555-4555-8555-555555555555", "student_answer": "True", "correct_answer": "True", "is_correct": true, "points_earned": 10, "max_points": 10}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
