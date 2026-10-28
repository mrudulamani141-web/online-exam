/**
 * Automatic Grading Engine
 * Evaluates student answers against question answer keys,
 * computes score tallies, percentages, pass/fail status, and diagnostic feedback.
 */

function normalizeString(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase().replace(/\s+/g, ' ');
}

const gradingService = {
  /**
   * Grade an exam submission
   * @param {Array} questions - Exam questions with correct answers and point weights
   * @param {Object} studentAnswers - Key-value pair of { [questionId]: answer }
   * @param {Number} passingMarks - Threshold for passing the exam
   */
  gradeSubmission(questions, studentAnswers = {}, passingMarks = 40) {
    let totalScore = 0;
    let maxScore = 0;
    const feedback = [];

    for (const q of questions) {
      const qPoints = Number(q.points) || 1;
      maxScore += qPoints;

      const studentAnsRaw = studentAnswers[q.id];
      const studentAnsStr = studentAnsRaw !== undefined && studentAnsRaw !== null ? String(studentAnsRaw).trim() : '';
      const correctAnsStr = String(q.correct_answer || '').trim();

      let isCorrect = false;

      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
        isCorrect = normalizeString(studentAnsStr) === normalizeString(correctAnsStr);
      } else if (q.question_type === 'short_answer') {
        const normStudent = normalizeString(studentAnsStr).replace(/[^\w\s]/gi, '');
        const normCorrect = normalizeString(correctAnsStr).replace(/[^\w\s]/gi, '');
        isCorrect = normStudent === normCorrect || (normCorrect.length > 0 && normStudent.includes(normCorrect));
      }

      const pointsEarned = isCorrect ? qPoints : 0;
      totalScore += pointsEarned;

      feedback.push({
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        student_answer: studentAnsStr || '(No Answer Provided)',
        correct_answer: correctAnsStr,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        max_points: qPoints,
        explanation: q.explanation || ''
      });
    }

    const percentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(2)) : 0;
    const isPassed = totalScore >= passingMarks;

    return {
      totalScore,
      maxScore,
      percentage,
      isPassed,
      feedback
    };
  }
};

module.exports = gradingService;
