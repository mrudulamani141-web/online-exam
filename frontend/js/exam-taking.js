/**
 * Examination Taking Engine
 * Handles live countdown timer, interactive question navigation, state caching,
 * anti-cheat tab monitoring, auto-submission, and grading dispatch.
 */

let examData = null;
let attemptData = null;
let questions = [];
let currentIndex = 0;
let userAnswers = {};
let reviewFlags = {};
let timerInterval = null;
let remainingSeconds = 0;
let tabSwitchCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
  const user = checkAuth();
  if (!user) return;

  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('examId');

  if (!examId) {
    alert('No examination ID specified.');
    window.location.href = 'dashboard.html';
    return;
  }

  await initializeExamSession(examId);
  setupExamEventListeners();
  setupAntiCheatMonitoring();
});

async function initializeExamSession(examId) {
  try {
    const res = await apiRequest('/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ exam_id: examId })
    });

    attemptData = res.data.attempt;
    examData = res.data.exam;
    questions = res.data.questions || [];

    if (questions.length === 0) {
      alert('This exam has no questions available yet.');
      window.location.href = 'dashboard.html';
      return;
    }

    // Populate header details
    document.getElementById('exam-title-display').textContent = examData.title;
    document.getElementById('exam-subject-display').textContent = `${examData.subject} • ${questions.length} Questions • ${examData.total_marks} Marks`;

    // Restore cached answers from previous partial session if any
    if (attemptData.answers && Object.keys(attemptData.answers).length > 0) {
      userAnswers = { ...attemptData.answers };
    }

    // Calculate timer from started_at and duration
    calculateRemainingTime();
    startCountdown();

    // Render palette and initial question
    renderPalette();
    renderQuestion(0);
  } catch (err) {
    alert(`Could not start exam: ${err.message}`);
    window.location.href = 'dashboard.html';
  }
}

function calculateRemainingTime() {
  const startedTime = new Date(attemptData.started_at).getTime();
  const totalDurationMs = (examData.duration_minutes || 30) * 60 * 1000;
  const elapsedMs = Date.now() - startedTime;
  const leftMs = totalDurationMs - elapsedMs;

  remainingSeconds = Math.max(0, Math.floor(leftMs / 1000));
}

function startCountdown() {
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    remainingSeconds--;

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      showToast('Time is up! Submitting your examination now...', 'warning');
      submitExam(true);
      return;
    }

    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const digitsEl = document.getElementById('timer-digits');
  const container = document.getElementById('timer-container');
  if (!digitsEl) return;

  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  digitsEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // Visual urgency alerts
  if (remainingSeconds <= 120) { // Under 2 mins
    container.classList.remove('timer-warning');
    container.classList.add('timer-critical');
  } else if (remainingSeconds <= 300) { // Under 5 mins
    container.classList.add('timer-warning');
  }
}

function renderQuestion(index) {
  if (index < 0 || index >= questions.length) return;
  currentIndex = index;
  const q = questions[index];

  // Update question header
  document.getElementById('question-number-badge').textContent = `Question ${index + 1} of ${questions.length}`;
  document.getElementById('question-points-badge').textContent = `${q.points} point${q.points > 1 ? 's' : ''}`;
  document.getElementById('question-text-el').textContent = q.question_text;

  // Render question answer container
  const ansContainer = document.getElementById('question-input-container');
  const currentAnswer = userAnswers[q.id] || '';

  if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
    const options = q.question_type === 'true_false' ? ['True', 'False'] : (q.options || []);

    ansContainer.innerHTML = `
      <div class="options-list">
        ${options.map((opt, i) => {
          const isSelected = String(currentAnswer).trim() === String(opt).trim();
          return `
            <label class="option-item ${isSelected ? 'selected' : ''}" onclick="selectAnswer('${q.id}', '${escapeHtml(opt)}')">
              <input type="radio" name="opt_choice_${q.id}" value="${escapeHtml(opt)}" ${isSelected ? 'checked' : ''}>
              <span class="option-text">${escapeHtml(opt)}</span>
            </label>
          `;
        }).join('')}
      </div>
    `;
  } else if (q.question_type === 'short_answer') {
    ansContainer.innerHTML = `
      <textarea 
        class="short-answer-input" 
        placeholder="Type your concise answer here..."
        oninput="handleShortAnswerInput('${q.id}', this.value)"
      >${escapeHtml(currentAnswer)}</textarea>
    `;
  }

  // Update Review button state
  const isReviewed = Boolean(reviewFlags[q.id]);
  const reviewBtn = document.getElementById('mark-review-btn');
  if (reviewBtn) {
    reviewBtn.textContent = isReviewed ? '★ Marked for Review' : '☆ Mark for Review';
    reviewBtn.className = isReviewed ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
  }

  // Update navigation buttons disable state
  document.getElementById('prev-question-btn').disabled = currentIndex === 0;
  const nextBtn = document.getElementById('next-question-btn');
  if (currentIndex === questions.length - 1) {
    nextBtn.textContent = 'Review & Submit →';
  } else {
    nextBtn.textContent = 'Next Question →';
  }

  renderPalette();
}

function selectAnswer(questionId, value) {
  userAnswers[questionId] = value;
  // Re-render current question to update visual selected class
  renderQuestion(currentIndex);
}

function handleShortAnswerInput(questionId, value) {
  if (value.trim()) {
    userAnswers[questionId] = value.trim();
  } else {
    delete userAnswers[questionId];
  }
  renderPalette();
}

function clearAnswer() {
  const q = questions[currentIndex];
  delete userAnswers[q.id];
  renderQuestion(currentIndex);
}

function toggleReview() {
  const q = questions[currentIndex];
  reviewFlags[q.id] = !reviewFlags[q.id];
  renderQuestion(currentIndex);
}

function renderPalette() {
  const grid = document.getElementById('palette-grid');
  if (!grid) return;

  grid.innerHTML = questions.map((q, idx) => {
    const isCurrent = idx === currentIndex;
    const isAnswered = userAnswers[q.id] !== undefined && String(userAnswers[q.id]).trim() !== '';
    const isReviewed = Boolean(reviewFlags[q.id]);

    let classes = ['palette-btn'];
    if (isCurrent) classes.push('current');
    if (isAnswered) classes.push('answered');
    if (isReviewed) classes.push('review');

    return `
      <button 
        type="button" 
        class="${classes.join(' ')}" 
        onclick="renderQuestion(${idx})"
        title="Question ${idx + 1}"
      >
        ${idx + 1}
      </button>
    `;
  }).join('');

  // Update summary counts
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k] && String(userAnswers[k]).trim() !== '').length;
  const statEl = document.getElementById('palette-stats-text');
  if (statEl) {
    statEl.textContent = `${answeredCount} of ${questions.length} Answered`;
  }
}

function setupExamEventListeners() {
  document.getElementById('prev-question-btn').addEventListener('click', () => {
    if (currentIndex > 0) renderQuestion(currentIndex - 1);
  });

  document.getElementById('next-question-btn').addEventListener('click', () => {
    if (currentIndex < questions.length - 1) {
      renderQuestion(currentIndex + 1);
    } else {
      openSubmitConfirmModal();
    }
  });

  document.getElementById('clear-answer-btn').addEventListener('click', clearAnswer);
  document.getElementById('mark-review-btn').addEventListener('click', toggleReview);

  document.getElementById('open-submit-modal-btn').addEventListener('click', openSubmitConfirmModal);
  document.getElementById('confirm-final-submit-btn').addEventListener('click', () => submitExam(false));
}

function openSubmitConfirmModal() {
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k] && String(userAnswers[k]).trim() !== '').length;
  const unansweredCount = questions.length - answeredCount;
  const reviewCount = Object.values(reviewFlags).filter(Boolean).length;

  document.getElementById('confirm-answered-count').textContent = answeredCount;
  document.getElementById('confirm-unanswered-count').textContent = unansweredCount;
  document.getElementById('confirm-review-count').textContent = reviewCount;

  openModal('submit-confirm-modal');
}

async function submitExam(isTimedOut = false) {
  if (timerInterval) clearInterval(timerInterval);

  try {
    const res = await apiRequest(`/attempts/${attemptData.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        answers: userAnswers,
        is_timed_out: isTimedOut
      })
    });

    closeModal('submit-confirm-modal');
    showToast('Exam submitted successfully! Redirecting to results...', 'success');

    setTimeout(() => {
      window.location.href = `results.html?attemptId=${attemptData.id}`;
    }, 1000);
  } catch (err) {
    alert(`Submission error: ${err.message}`);
  }
}

/**
 * Anti-Cheat Tab Switching Monitor
 */
function setupAntiCheatMonitoring() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      tabSwitchCount++;
      const banner = document.getElementById('cheat-alert-banner');
      if (banner) {
        banner.style.display = 'block';
        banner.textContent = `⚠️ Warning: Tab switch detected (${tabSwitchCount} time${tabSwitchCount > 1 ? 's' : ''}). Please remain on the examination window.`;
      }
      showToast('Exam Proctor Warning: Leaving the exam tab is prohibited.', 'warning');
    }
  });

  // Warn before accidental page reload / close
  window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave the exam room? Your responses will be saved.';
  });
}
