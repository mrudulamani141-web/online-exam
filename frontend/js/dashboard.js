/**
 * Dashboard Controller
 * Multi-role logic for Student, Teacher, and Administrator interfaces.
 */

let currentUser = null;
let currentExamList = [];
let currentAttemptsList = [];
let activeManagingExamId = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = checkAuth();
  if (!currentUser) return;

  renderUserHeader();
  await loadDashboardData();
  setupEventListeners();
});

function renderUserHeader() {
  const greetingEl = document.getElementById('user-greeting');
  const roleDescEl = document.getElementById('role-description');
  if (greetingEl) {
    greetingEl.textContent = `Welcome back, ${currentUser.full_name}!`;
  }
  if (roleDescEl) {
    if (currentUser.role === 'admin') {
      roleDescEl.textContent = 'System Administrator Dashboard — Manage users, monitor exams, and oversee platform integrity.';
    } else if (currentUser.role === 'teacher') {
      roleDescEl.textContent = 'Instructor Workspace — Author exams, create question banks, and review student performance.';
    } else {
      roleDescEl.textContent = 'Student Learning Hub — Browse scheduled exams, launch test sessions, and review your performance history.';
    }
  }

  // Toggle role-specific navigation tabs & action buttons
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.getAttribute('data-role').split(',');
    if (roles.includes(currentUser.role)) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

/**
 * Main Data Loader
 */
async function loadDashboardData() {
  try {
    if (currentUser.role === 'student') {
      await Promise.all([loadStudentExams(), loadStudentAttempts()]);
    } else if (currentUser.role === 'teacher') {
      await Promise.all([loadTeacherExams(), loadTeacherStats()]);
    } else if (currentUser.role === 'admin') {
      await Promise.all([loadAdminUsers(), loadAdminExams(), loadAdminStats()]);
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    showToast('Failed to load some dashboard data. Please refresh.', 'error');
  }
}

// ==============================================================================
// STUDENT VIEW LOGIC
// ==============================================================================

async function loadStudentExams() {
  try {
    const res = await apiRequest('/exams?isPublished=true');
    currentExamList = res.data || [];
    renderStudentExams(currentExamList);
    updateStudentStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadStudentAttempts() {
  try {
    const res = await apiRequest('/attempts/my-attempts');
    currentAttemptsList = res.data || [];
    renderStudentAttempts(currentAttemptsList);
    updateStudentStats();
  } catch (err) {
    console.error('Attempts load error:', err);
  }
}

function updateStudentStats() {
  const totalTakenEl = document.getElementById('stat-student-taken');
  const avgScoreEl = document.getElementById('stat-student-avg');
  const passedCountEl = document.getElementById('stat-student-passed');
  const availableEl = document.getElementById('stat-student-available');

  const completed = currentAttemptsList.filter(a => a.status === 'completed' || a.status === 'timed_out');
  const passed = completed.filter(a => a.is_passed);
  const avg = completed.length > 0
    ? Math.round(completed.reduce((acc, c) => acc + Number(c.percentage || 0), 0) / completed.length)
    : 0;

  if (totalTakenEl) totalTakenEl.textContent = completed.length;
  if (avgScoreEl) avgScoreEl.textContent = `${avg}%`;
  if (passedCountEl) passedCountEl.textContent = passed.length;
  if (availableEl) availableEl.textContent = currentExamList.length;
}

function renderStudentExams(exams) {
  const container = document.getElementById('student-exam-grid');
  if (!container) return;

  if (exams.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">📝</div>
        <div class="empty-title">No Exams Available</div>
        <div class="empty-desc">There are no published examinations currently scheduled for your subjects. Check back soon!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = exams.map(exam => `
    <div class="exam-card">
      <div class="exam-card-header">
        <h3 class="exam-card-title">${escapeHtml(exam.title)}</h3>
      </div>
      <span class="exam-subject-tag">${escapeHtml(exam.subject)}</span>
      <p class="exam-card-desc">${escapeHtml(exam.description || 'No description provided.')}</p>
      
      <div class="exam-meta-pills">
        <span class="meta-pill">⏱️ ${formatDuration(exam.duration_minutes)}</span>
        <span class="meta-pill">🎯 ${exam.total_marks} Marks</span>
        <span class="meta-pill">❓ ${exam.question_count || 0} Questions</span>
        <span class="meta-pill">✅ Pass: ${exam.passing_marks}</span>
      </div>

      <div class="exam-card-footer">
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          Teacher: ${escapeHtml(exam.teacher?.full_name || 'Instructor')}
        </span>
        <a href="exam-portal.html?examId=${exam.id}" class="btn btn-primary btn-sm">
          Take Exam →
        </a>
      </div>
    </div>
  `).join('');
}

function renderStudentAttempts(attempts) {
  const tbody = document.getElementById('student-attempts-tbody');
  if (!tbody) return;

  if (attempts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          You haven't completed any examinations yet. Choose an exam above to get started!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = attempts.map(att => {
    const isCompleted = att.status === 'completed' || att.status === 'timed_out';
    const statusBadge = isCompleted
      ? (att.is_passed ? `<span class="badge badge-success">Passed (${att.percentage}%)</span>` : `<span class="badge badge-danger">Failed (${att.percentage}%)</span>`)
      : `<span class="badge badge-warning">In Progress</span>`;

    return `
      <tr>
        <td><strong>${escapeHtml(att.exam?.title || 'Exam')}</strong></td>
        <td>${escapeHtml(att.exam?.subject || '-')}</td>
        <td>${formatDate(att.started_at)}</td>
        <td><strong>${att.total_score}</strong> / ${att.max_score || att.exam?.total_marks}</td>
        <td>${statusBadge}</td>
        <td>
          ${isCompleted ? `<a href="results.html?attemptId=${att.id}" class="btn btn-outline-primary btn-sm">View Result</a>` : `<a href="exam-portal.html?examId=${att.exam_id}" class="btn btn-primary btn-sm">Resume</a>`}
        </td>
      </tr>
    `;
  }).join('');
}

// ==============================================================================
// TEACHER VIEW LOGIC
// ==============================================================================

async function loadTeacherExams() {
  try {
    const res = await apiRequest(`/exams?teacherId=${currentUser.id}`);
    currentExamList = res.data || [];
    renderTeacherExams(currentExamList);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadTeacherStats() {
  try {
    const res = await apiRequest('/users/stats');
    const stats = res.data || {};

    const myExamsCount = currentExamList.length;
    const publishedCount = currentExamList.filter(e => e.is_published).length;

    const el1 = document.getElementById('stat-teacher-exams');
    const el2 = document.getElementById('stat-teacher-published');
    const el3 = document.getElementById('stat-teacher-attempts');
    const el4 = document.getElementById('stat-teacher-passrate');

    if (el1) el1.textContent = myExamsCount;
    if (el2) el2.textContent = publishedCount;
    if (el3) el3.textContent = stats.totalAttempts || 0;
    if (el4) el4.textContent = `${stats.overallPassRate || 0}%`;
  } catch (err) {
    console.error('Teacher stats error:', err);
  }
}

function renderTeacherExams(exams) {
  const container = document.getElementById('teacher-exam-grid');
  if (!container) return;

  if (exams.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">📂</div>
        <div class="empty-title">No Exams Created Yet</div>
        <div class="empty-desc">Get started by creating your first online exam with questions, passing criteria, and point weights.</div>
        <button onclick="openModal('create-exam-modal')" class="btn btn-primary">➕ Create New Exam</button>
      </div>
    `;
    return;
  }

  container.innerHTML = exams.map(exam => `
    <div class="exam-card">
      <div class="exam-card-header">
        <h3 class="exam-card-title">${escapeHtml(exam.title)}</h3>
        <span class="badge ${exam.is_published ? 'badge-success' : 'badge-warning'}">
          ${exam.is_published ? 'Published' : 'Draft'}
        </span>
      </div>
      <span class="exam-subject-tag">${escapeHtml(exam.subject)}</span>
      <p class="exam-card-desc">${escapeHtml(exam.description || 'No description.')}</p>

      <div class="exam-meta-pills">
        <span class="meta-pill">⏱️ ${exam.duration_minutes}m</span>
        <span class="meta-pill">🎯 ${exam.total_marks} Marks</span>
        <span class="meta-pill">❓ ${exam.question_count || 0} Questions</span>
        <span class="meta-pill">✅ Pass: ${exam.passing_marks}</span>
      </div>

      <div class="exam-card-footer" style="flex-wrap: wrap; gap: 0.5rem;">
        <button onclick="openManageQuestionsModal('${exam.id}', '${escapeHtml(exam.title)}')" class="btn btn-secondary btn-sm">
          ❓ Questions (${exam.question_count || 0})
        </button>
        <button onclick="viewExamSubmissions('${exam.id}', '${escapeHtml(exam.title)}')" class="btn btn-secondary btn-sm">
          📊 Results
        </button>
        <button onclick="toggleExamPublish('${exam.id}')" class="btn ${exam.is_published ? 'btn-outline-primary' : 'btn-success'} btn-sm">
          ${exam.is_published ? 'Unpublish' : 'Publish'}
        </button>
        <button onclick="deleteExam('${exam.id}')" class="btn btn-danger btn-sm" title="Delete Exam">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

async function toggleExamPublish(examId) {
  try {
    const res = await apiRequest(`/exams/${examId}/publish`, { method: 'PATCH' });
    showToast(res.message, 'success');
    await loadTeacherExams();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteExam(examId) {
  if (!confirm('Are you sure you want to delete this exam and all its questions and student attempts? This cannot be undone.')) {
    return;
  }
  try {
    const res = await apiRequest(`/exams/${examId}`, { method: 'DELETE' });
    showToast(res.message, 'success');
    if (currentUser.role === 'admin') {
      await loadAdminExams();
    } else {
      await loadTeacherExams();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==============================================================================
// QUESTION MANAGEMENT MODAL (Teacher / Admin)
// ==============================================================================

async function openManageQuestionsModal(examId, examTitle) {
  activeManagingExamId = examId;
  const titleEl = document.getElementById('manage-questions-title');
  if (titleEl) titleEl.textContent = `Questions for "${examTitle}"`;

  document.getElementById('add-question-exam-id').value = examId;
  openModal('manage-questions-modal');
  await refreshQuestionsList(examId);
}

async function refreshQuestionsList(examId) {
  const container = document.getElementById('questions-list-container');
  if (!container) return;

  container.innerHTML = '<p style="text-align:center; padding:1rem;">Loading questions...</p>';

  try {
    const res = await apiRequest(`/exams/${examId}/questions`);
    const questions = res.data || [];

    if (questions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2rem;">
          <p>No questions added yet. Use the authoring form below to add questions!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = questions.map((q, idx) => `
      <div class="question-item-card">
        <div class="question-item-header">
          <strong>Q${idx + 1}: [${q.question_type.toUpperCase().replace('_', ' ')}] (${q.points} pt)</strong>
          <button onclick="deleteQuestion('${q.id}')" class="btn btn-danger btn-sm" style="padding: 0.2rem 0.5rem;">Delete</button>
        </div>
        <p style="margin-bottom: 0.5rem; color: var(--text-main); font-weight: 500;">${escapeHtml(q.question_text)}</p>
        ${q.options && q.options.length > 0 ? `
          <div style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-muted);">
            Options: ${q.options.map(o => `<code>${escapeHtml(o)}</code>`).join(', ')}
          </div>
        ` : ''}
        <div style="font-size: 0.85rem; color: var(--success); font-weight: 600;">
          ✓ Correct Answer: ${escapeHtml(q.correct_answer)}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger)">Error loading questions: ${err.message}</p>`;
  }
}

async function deleteQuestion(questionId) {
  if (!confirm('Are you sure you want to remove this question?')) return;
  try {
    await apiRequest(`/questions/${questionId}`, { method: 'DELETE' });
    showToast('Question removed.', 'success');
    await refreshQuestionsList(activeManagingExamId);
    await loadTeacherExams();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==============================================================================
// VIEW SUBMISSIONS MODAL
// ==============================================================================

async function viewExamSubmissions(examId, examTitle) {
  const modal = document.getElementById('exam-submissions-modal');
  const titleEl = document.getElementById('submissions-modal-title');
  const tbody = document.getElementById('submissions-tbody');
  const summaryEl = document.getElementById('submissions-summary-bar');

  if (titleEl) titleEl.textContent = `Student Submissions: "${examTitle}"`;
  openModal('exam-submissions-modal');

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading submissions...</td></tr>';

  try {
    const res = await apiRequest(`/exams/${examId}/results`);
    const attempts = res.data || [];
    const summary = res.summary || {};

    if (summaryEl) {
      summaryEl.innerHTML = `
        <span class="meta-pill">Total: ${summary.totalSubmissions || 0}</span>
        <span class="meta-pill" style="color: var(--success);">Passed: ${summary.passedCount || 0}</span>
        <span class="meta-pill" style="color: var(--danger);">Failed: ${summary.failedCount || 0}</span>
        <span class="meta-pill">Average Score: ${summary.averagePercentage || 0}%</span>
      `;
    }

    if (attempts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No student attempts recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = attempts.map(a => `
      <tr>
        <td><strong>${escapeHtml(a.student?.full_name || 'Student')}</strong></td>
        <td>${escapeHtml(a.student?.email || '-')}</td>
        <td>${formatDate(a.submitted_at || a.started_at)}</td>
        <td><strong>${a.total_score}</strong> / ${a.max_score}</td>
        <td>
          <span class="badge ${a.is_passed ? 'badge-success' : 'badge-danger'}">
            ${a.is_passed ? 'Passed' : 'Failed'} (${a.percentage}%)
          </span>
        </td>
        <td>
          <a href="results.html?attemptId=${a.id}" class="btn btn-secondary btn-sm" target="_blank">
            Inspect →
          </a>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
  }
}

// ==============================================================================
// ADMIN VIEW LOGIC
// ==============================================================================

async function loadAdminStats() {
  try {
    const res = await apiRequest('/users/stats');
    const stats = res.data || {};

    const el1 = document.getElementById('stat-admin-users');
    const el2 = document.getElementById('stat-admin-exams');
    const el3 = document.getElementById('stat-admin-attempts');
    const el4 = document.getElementById('stat-admin-passrate');

    if (el1) el1.textContent = stats.totalUsers || 0;
    if (el2) el2.textContent = stats.totalExams || 0;
    if (el3) el3.textContent = stats.totalAttempts || 0;
    if (el4) el4.textContent = `${stats.overallPassRate || 0}%`;
  } catch (err) {
    console.error('Admin stats error:', err);
  }
}

async function loadAdminUsers() {
  try {
    const res = await apiRequest('/users');
    const users = res.data || [];
    renderAdminUsers(users);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderAdminUsers(users) {
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${escapeHtml(u.full_name)}</strong></td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="role-tag ${u.role}">${u.role}</span></td>
      <td>${formatDate(u.created_at)}</td>
      <td>
        ${u.id !== currentUser.id ? `
          <button onclick="deleteUser('${u.id}', '${escapeHtml(u.full_name)}')" class="btn btn-danger btn-sm">
            Delete
          </button>
        ` : '<span style="color:var(--text-light); font-size:0.8rem;">(Current Account)</span>'}
      </td>
    </tr>
  `).join('');
}

async function deleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to delete user "${userName}"? All their exams and records will be deleted.`)) return;
  try {
    const res = await apiRequest(`/users/${userId}`, { method: 'DELETE' });
    showToast(res.message, 'success');
    await loadAdminUsers();
    await loadAdminStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAdminExams() {
  try {
    const res = await apiRequest('/exams');
    const exams = res.data || [];
    const tbody = document.getElementById('admin-exams-tbody');
    if (!tbody) return;

    tbody.innerHTML = exams.map(exam => `
      <tr>
        <td><strong>${escapeHtml(exam.title)}</strong></td>
        <td>${escapeHtml(exam.subject)}</td>
        <td>${escapeHtml(exam.teacher?.full_name || 'Instructor')}</td>
        <td>${exam.duration_minutes}m</td>
        <td>
          <span class="badge ${exam.is_published ? 'badge-success' : 'badge-warning'}">
            ${exam.is_published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td>
          <button onclick="deleteExam('${exam.id}')" class="btn btn-danger btn-sm">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Admin exams error:', err);
  }
}

// ==============================================================================
// FORM SUBMISSION LISTENERS & TABS
// ==============================================================================

function setupEventListeners() {
  // Tabs switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // Create Exam Form
  const createExamForm = document.getElementById('create-exam-form');
  if (createExamForm) {
    createExamForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('exam-title-input').value;
      const subject = document.getElementById('exam-subject-input').value;
      const description = document.getElementById('exam-desc-input').value;
      const duration_minutes = parseInt(document.getElementById('exam-duration-input').value, 10);
      const total_marks = parseInt(document.getElementById('exam-marks-input').value, 10);
      const passing_marks = parseInt(document.getElementById('exam-passing-input').value, 10);
      const is_published = document.getElementById('exam-publish-checkbox').checked;

      try {
        const res = await apiRequest('/exams', {
          method: 'POST',
          body: JSON.stringify({
            title,
            subject,
            description,
            duration_minutes,
            total_marks,
            passing_marks,
            is_published
          })
        });

        showToast('Exam created successfully! Now add questions to it.', 'success');
        closeModal('create-exam-modal');
        createExamForm.reset();

        if (currentUser.role === 'teacher') {
          await loadTeacherExams();
        } else {
          await loadAdminExams();
        }

        // Prompt to add questions right away
        if (res.data && res.data.id) {
          openManageQuestionsModal(res.data.id, res.data.title);
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Question Type Selector change in Add Question form
  const qTypeSelect = document.getElementById('question-type-select');
  if (qTypeSelect) {
    qTypeSelect.addEventListener('change', () => {
      const type = qTypeSelect.value;
      const mcqBox = document.getElementById('mcq-options-wrapper');
      const tfBox = document.getElementById('tf-options-wrapper');
      const shortBox = document.getElementById('short-answer-wrapper');

      if (mcqBox) mcqBox.style.display = type === 'multiple_choice' ? 'block' : 'none';
      if (tfBox) tfBox.style.display = type === 'true_false' ? 'block' : 'none';
      if (shortBox) shortBox.style.display = type === 'short_answer' ? 'block' : 'none';
    });
  }

  // Add Question Form
  const addQuestionForm = document.getElementById('add-question-form');
  if (addQuestionForm) {
    addQuestionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const examId = document.getElementById('add-question-exam-id').value;
      const question_text = document.getElementById('q-text-input').value;
      const question_type = document.getElementById('question-type-select').value;
      const points = parseInt(document.getElementById('q-points-input').value, 10) || 1;
      const explanation = document.getElementById('q-explanation-input').value;

      let options = [];
      let correct_answer = '';

      if (question_type === 'multiple_choice') {
        const optionInputs = document.querySelectorAll('.mcq-option-text');
        optionInputs.forEach(input => {
          if (input.value.trim()) options.push(input.value.trim());
        });

        const selectedRadio = document.querySelector('input[name="mcq-correct-choice"]:checked');
        if (!selectedRadio) {
          showToast('Please select which option is the correct answer.', 'warning');
          return;
        }
        const optIndex = parseInt(selectedRadio.value, 10);
        correct_answer = options[optIndex];
      } else if (question_type === 'true_false') {
        options = ['True', 'False'];
        const selectedTF = document.querySelector('input[name="tf-correct-choice"]:checked');
        if (!selectedTF) {
          showToast('Please select True or False as the correct answer.', 'warning');
          return;
        }
        correct_answer = selectedTF.value;
      } else if (question_type === 'short_answer') {
        correct_answer = document.getElementById('short-answer-key-input').value.trim();
        if (!correct_answer) {
          showToast('Please enter the expected short answer key.', 'warning');
          return;
        }
      }

      try {
        await apiRequest(`/exams/${examId}/questions`, {
          method: 'POST',
          body: JSON.stringify({
            question_text,
            question_type,
            points,
            options,
            correct_answer,
            explanation
          })
        });

        showToast('Question added successfully!', 'success');
        addQuestionForm.reset();
        // Reset MCQ options to default
        resetMcqOptionInputs();
        await refreshQuestionsList(examId);
        await loadTeacherExams();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Student Search filter
  const searchInput = document.getElementById('student-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = currentExamList.filter(
        exam => exam.title.toLowerCase().includes(q) || exam.subject.toLowerCase().includes(q)
      );
      renderStudentExams(filtered);
    });
  }
}

function addMcqOptionField() {
  const container = document.getElementById('mcq-options-list');
  if (!container) return;
  const count = container.querySelectorAll('.mcq-option-row').length;
  if (count >= 6) {
    showToast('Maximum 6 options allowed.', 'warning');
    return;
  }

  const row = document.createElement('div');
  row.className = 'mcq-option-row';
  row.innerHTML = `
    <input type="radio" name="mcq-correct-choice" value="${count}" title="Mark as correct answer">
    <input type="text" class="form-control mcq-option-text" placeholder="Option ${count + 1}" required>
    <button type="button" class="remove-opt-btn" onclick="this.parentElement.remove()" title="Remove option">✕</button>
  `;
  container.appendChild(row);
}

function resetMcqOptionInputs() {
  const container = document.getElementById('mcq-options-list');
  if (!container) return;
  container.innerHTML = `
    <div class="mcq-option-row">
      <input type="radio" name="mcq-correct-choice" value="0" checked title="Mark as correct answer">
      <input type="text" class="form-control mcq-option-text" placeholder="Option 1" required>
    </div>
    <div class="mcq-option-row">
      <input type="radio" name="mcq-correct-choice" value="1" title="Mark as correct answer">
      <input type="text" class="form-control mcq-option-text" placeholder="Option 2" required>
    </div>
  `;
}
