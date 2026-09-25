/* result.js — runs on result.html only */

(function () {
  const result = Storage.loadResult();

  if (!result) {
    alert('No result found. Redirecting to the setup page.');
    window.location.href = 'index.html';
    return;
  }

  const scoreNumEl = document.getElementById('scoreNumEl');
  const scoreLblEl = document.getElementById('scoreLblEl');
  const summaryGrid = document.getElementById('summaryGrid');
  const ungradedNote = document.getElementById('ungradedNote');
  const resultTableBody = document.getElementById('resultTableBody');
  const copyOutput = document.getElementById('copyOutput');
  const copyBtn = document.getElementById('copyBtn');
  const copyFeedback = document.getElementById('copyFeedback');

  function formatMS(totalSeconds) {
    totalSeconds = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function formatHMSWords(totalSeconds) {
    totalSeconds = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    let out = '';
    if (h > 0) out += `${h}h `;
    out += `${m}m ${s}s`;
    return out;
  }

  // ---- Score banner ----
  if (result.hasAnyAnswerKey) {
    scoreNumEl.textContent = `${result.score} / ${result.totalMarksPossible}`;
    scoreLblEl.textContent = 'Score';
  } else {
    scoreNumEl.textContent = 'N/A';
    scoreLblEl.textContent = 'No answer key was provided — score not calculated';
  }

  // ---- Summary grid ----
  const stats = [
    ['Total Questions', result.totalQuestions],
    ['Attempted', result.attempted],
    ['Not Attempted', result.notAttempted],
    ['Correct', result.correct],
    ['Wrong', result.wrong],
    ['Total Time', formatHMSWords(result.totalTimeSeconds)],
  ];
  summaryGrid.innerHTML = stats
    .map(([lbl, num]) => `<div class="result-stat"><div class="num">${num}</div><div class="lbl">${lbl}</div></div>`)
    .join('');

  if (result.ungraded > 0) {
    ungradedNote.textContent = `${result.ungraded} question(s) had no answer key and were not graded (shown as "Ungraded").`;
  }

  // ---- Table ----
  resultTableBody.innerHTML = result.rows
    .map((r) => {
      const badgeClass = `status-${r.status.replace(/\s/g, '')}`;
      return `<tr>
        <td>Q${r.id}</td>
        <td>${escapeHtml(r.subject)}</td>
        <td><span class="status-badge ${badgeClass}">${r.status}</span></td>
        <td>${formatMS(r.timeSpentSec)}</td>
        <td>${r.marksAwarded > 0 ? '+' : ''}${r.marksAwarded}</td>
      </tr>`;
    })
    .join('');

  // ---- Copy text ----
  function buildCopyText() {
    let lines = [];
    lines.push('JEE MOCK TEST RESULT');
    lines.push(`Test: ${result.testName}`);
    lines.push('');
    lines.push(`Total Questions: ${result.totalQuestions}`);
    lines.push(`Attempted: ${result.attempted}`);
    lines.push(`Correct: ${result.correct}`);
    lines.push(`Wrong: ${result.wrong}`);
    lines.push(`Not Attempted: ${result.notAttempted}`);
    if (result.ungraded > 0) lines.push(`Ungraded (no answer key): ${result.ungraded}`);
    lines.push('');
    if (result.hasAnyAnswerKey) {
      lines.push(`Score: ${result.score}/${result.totalMarksPossible}`);
    } else {
      lines.push('Score: Not calculated (no answer key was provided)');
    }
    lines.push(`Total Time: ${formatHMSWords(result.totalTimeSeconds)}`);
    lines.push('');
    lines.push('QUESTION-WISE DATA:');
    lines.push('');
    result.rows.forEach((r) => {
      lines.push(`Q${r.id} | ${r.subject} | ${r.status} | ${formatHMSWords(r.timeSpentSec)}`);
    });
    return lines.join('\n');
  }

  const copyText = buildCopyText();
  copyOutput.value = copyText;

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      showCopyFeedback();
    } catch (e) {
      copyOutput.select();
      try {
        document.execCommand('copy');
        showCopyFeedback();
      } catch (e2) {
        alert('Could not copy automatically. The text is selected — please copy it manually (Ctrl+C).');
      }
    }
  });

  function showCopyFeedback() {
    copyFeedback.classList.remove('hidden');
    setTimeout(() => copyFeedback.classList.add('hidden'), 3000);
  }

  document.getElementById('newTestBtn').addEventListener('click', () => {
    Storage.clearTestData();
    Storage.clearExamState();
    window.location.href = 'index.html';
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
