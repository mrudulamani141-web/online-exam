/**
 * Results & Diagnostic Review Controller
 * Renders student score summaries, pass/fail status, and per-question diagnostic breakdowns.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = checkAuth();
  if (!user) return;

  const urlParams = new URLSearchParams(window.location.search);
  const attemptId = urlParams.get('attemptId');

  if (!attemptId) {
    alert('No examination attempt specified.');
    window.location.href = 'dashboard.html';
    return;
  }

  await loadAttemptResult(attemptId);
});

async function loadAttemptResult(attemptId) {
  try {
    const res = await apiRequest(`/attempts/${attemptId}`);
    const attempt = res.data;

    if (!attempt) {
      alert('Attempt result record not found.');
      window.location.href = 'dashboard.html';
      return;
    }

    renderSummaryCard(attempt);
    renderFeedbackBreakdown(attempt.feedback || []);
  } catch (err) {
    alert(`Could not load results: ${err.message}`);
    window.location.href = 'dashboard.html';
  }
}

function renderSummaryCard(attempt) {
  const isPassed = Boolean(attempt.is_passed);
  const percentage = Number(attempt.percentage) || 0;

  // Header Details
  document.getElementById('res-exam-title').textContent = attempt.exam?.title || 'Examination Result';
  document.getElementById('res-subject').textContent = `${attempt.exam?.subject || 'General'} • Completed on ${formatDate(attempt.submitted_at || attempt.created_at)}`;
  document.getElementById('res-student-name').textContent = attempt.student?.full_name || 'Candidate';

  // Score Badges
  document.getElementById('res-score-display').textContent = `${attempt.total_score} / ${attempt.max_score}`;
  document.getElementById('res-percentage-display').textContent = `${percentage}%`;

  const statusBadge = document.getElementById('res-status-badge');
  if (statusBadge) {
    if (isPassed) {
      statusBadge.className = 'badge badge-success';
      statusBadge.style.fontSize = '1.1rem';
      statusBadge.style.padding = '0.5rem 1.25rem';
      statusBadge.textContent = '🎉 PASSED';
    } else {
      statusBadge.className = 'badge badge-danger';
      statusBadge.style.fontSize = '1.1rem';
      statusBadge.style.padding = '0.5rem 1.25rem';
      statusBadge.textContent = '❌ FAILED';
    }
  }

  // Progress Bar
  const progressBar = document.getElementById('res-progress-fill');
  if (progressBar) {
    progressBar.style.width = `${Math.min(100, percentage)}%`;
    progressBar.style.backgroundColor = isPassed ? 'var(--success)' : 'var(--danger)';
  }

  // Passing criteria note
  const passNote = document.getElementById('res-passing-note');
  if (passNote) {
    passNote.textContent = `Passing threshold: ${attempt.exam?.passing_marks || 40} points required.`;
  }
}

function renderFeedbackBreakdown(feedbackList) {
  const container = document.getElementById('feedback-questions-list');
  if (!container) return;

  if (feedbackList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No itemized question breakdown is available for this attempt.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = feedbackList.map((item, index) => {
    const isCorrect = Boolean(item.is_correct);
    const borderColor = isCorrect ? '#10b981' : '#ef4444';
    const bgColor = isCorrect ? '#f0fdf4' : '#fef2f2';

    return `
      <div class="card" style="margin-bottom: 1.25rem; border-left: 5px solid ${borderColor};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">
            Question ${index + 1}
          </h4>
          <span class="badge ${isCorrect ? 'badge-success' : 'badge-danger'}">
            ${isCorrect ? '✓ Correct' : '✗ Incorrect'} (${item.points_earned} / ${item.max_points} pts)
          </span>
        </div>

        <p style="font-weight: 600; color: var(--text-main); margin-bottom: 1rem; font-size: 1rem;">
          ${escapeHtml(item.question_text)}
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 0.75rem;">
          <div style="padding: 0.75rem 1rem; background: ${bgColor}; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">
              Your Submitted Answer
            </div>
            <div style="font-weight: 600; color: ${isCorrect ? '#065f46' : '#991b1b'};">
              ${escapeHtml(item.student_answer || '(No answer provided)')}
            </div>
          </div>

          <div style="padding: 0.75rem 1rem; background: #f0fdf4; border-radius: var(--radius-md); border: 1px solid #bbf7d0;">
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #166534; margin-bottom: 0.25rem;">
              Correct Key Answer
            </div>
            <div style="font-weight: 700; color: #166534;">
              ${escapeHtml(item.correct_answer)}
            </div>
          </div>
        </div>

        ${item.explanation ? `
          <div style="font-size: 0.85rem; color: var(--text-muted); padding: 0.65rem 0.85rem; background: var(--bg-subtle); border-radius: var(--radius-sm); margin-top: 0.5rem;">
            💡 <strong>Explanation:</strong> ${escapeHtml(item.explanation)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}
