/* app.js — logic for index.html only */

(function () {
  const paperInput = document.getElementById('paperInput');
  const messages = document.getElementById('messages');
  const previewCard = document.getElementById('previewCard');
  const previewSummary = document.getElementById('previewSummary');
  const durationOverride = document.getElementById('durationOverride');
  const startBtn = document.getElementById('startBtn');
  const resumeBanner = document.getElementById('resumeBanner');

  let parsedResult = null;

  // ---- Resume-in-progress-exam detection ----------------------------------
  const existingExam = Storage.loadExamState();
  if (existingExam && !existingExam.submitted) {
    resumeBanner.classList.remove('hidden');
  }
  document.getElementById('resumeBtn').addEventListener('click', () => {
    window.location.href = 'exam.html';
  });
  document.getElementById('discardBtn').addEventListener('click', () => {
    if (confirm('This will permanently delete the in-progress exam. Continue?')) {
      Storage.clearExamState();
      resumeBanner.classList.add('hidden');
    }
  });

  // ---- Sample / prompt / clear buttons -------------------------------------
  document.getElementById('loadSampleBtn').addEventListener('click', () => {
    paperInput.value = SAMPLE_TEST_TEXT;
  });

  document.getElementById('copyPromptBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(AI_GENERATION_PROMPT);
      flashMessage('success', 'Prompt copied! Paste it into ChatGPT/Gemini/Claude and fill in the [FILL THIS IN] parts.');
    } catch (e) {
      // Fallback for browsers without clipboard API
      prompt('Copy this prompt manually:', AI_GENERATION_PROMPT);
    }
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    paperInput.value = '';
    messages.innerHTML = '';
    previewCard.classList.add('hidden');
  });

  // ---- Parse / validate -----------------------------------------------------
  document.getElementById('parseBtn').addEventListener('click', () => {
    const raw = paperInput.value;
    const result = Parser.parse(raw);
    parsedResult = result;
    renderMessages(result);

    if (result.errors.length === 0 && result.questions.length > 0) {
      showPreview(result);
    } else {
      previewCard.classList.add('hidden');
    }
  });

  function renderMessages(result) {
    let html = '';
    if (result.errors.length > 0) {
      html += `<div class="msg-box error"><strong>${result.errors.length} error(s) — fix these before starting:</strong>
        <ul>${result.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>`;
    }
    if (result.warnings.length > 0) {
      html += `<div class="msg-box warning"><strong>${result.warnings.length} warning(s):</strong>
        <ul>${result.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul></div>`;
    }
    if (result.errors.length === 0 && result.questions.length > 0) {
      html += `<div class="msg-box success">✅ ${result.questions.length} question(s) imported successfully.</div>`;
    }
    messages.innerHTML = html;
  }

  function showPreview(result) {
    const bySubject = {};
    let mcqCount = 0, numCount = 0, gradedCount = 0;
    result.questions.forEach((q) => {
      bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
      if (q.type === 'MCQ') mcqCount++; else numCount++;
      if (q.answer) gradedCount++;
    });

    let chips = Object.entries(bySubject)
      .map(([subj, count]) => `<span class="summary-chip">${escapeHtml(subj)}: ${count}</span>`)
      .join('');

    previewSummary.innerHTML = `
      <p><strong>${escapeHtml(result.testName)}</strong> — ${result.questions.length} questions,
      default duration ${result.durationMinutes} minutes.</p>
      <p>${chips}</p>
      <p style="font-size:0.85rem; color:var(--color-text-muted);">
        ${mcqCount} MCQ · ${numCount} Numerical · ${gradedCount}/${result.questions.length} have an answer key
        ${gradedCount < result.questions.length ? ' (rest will show as "Ungraded" in your result)' : ''}.
      </p>`;

    durationOverride.value = result.durationMinutes;
    previewCard.classList.remove('hidden');
    previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---- Start test -------------------------------------------------------
  startBtn.addEventListener('click', () => {
    if (!parsedResult || parsedResult.questions.length === 0) return;

    const finalDuration = parseInt(durationOverride.value, 10) || parsedResult.durationMinutes;

    const testData = {
      testName: parsedResult.testName,
      durationMinutes: finalDuration,
      questions: parsedResult.questions,
    };

    Storage.saveTestData(testData);
    Storage.clearExamState();
    Storage.clearResult();
    window.location.href = 'exam.html';
  });

  function flashMessage(type, text) {
    const box = document.createElement('div');
    box.className = `msg-box ${type}`;
    box.textContent = text;
    messages.prepend(box);
    setTimeout(() => box.remove(), 4000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
