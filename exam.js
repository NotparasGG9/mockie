/* exam.js — runs the live exam on exam.html.
   State is kept in one object (`state`) and mirrored to localStorage so a
   refresh can restore everything. The timer is based on a fixed end
   timestamp (not a simple decrementing counter) so it stays accurate even
   if the tab is backgrounded or the page is reloaded. */

(function () {
  // ---- DOM references -------------------------------------------------
  const testNameEl = document.getElementById('testNameEl');
  const timerEl = document.getElementById('timerEl');
  const qIndexEl = document.getElementById('qIndexEl');
  const qSubjectMarksEl = document.getElementById('qSubjectMarksEl');
  const qTimeEl = document.getElementById('qTimeEl');
  const questionTextEl = document.getElementById('questionTextEl');
  const mcqOptionsWrap = document.getElementById('mcqOptionsWrap');
  const numInputWrap = document.getElementById('numInputWrap');
  const numAnswerInput = document.getElementById('numAnswerInput');

  const prevBtn = document.getElementById('prevBtn');
  const clearBtn = document.getElementById('clearBtn');
  const markBtn = document.getElementById('markBtn');
  const saveNextBtn = document.getElementById('saveNextBtn');

  const paletteGrid = document.getElementById('paletteGrid');
  const subjectTabs = document.getElementById('subjectTabs');
  const palettePanel = document.getElementById('palettePanel');
  const paletteToggleBtn = document.getElementById('paletteToggleBtn');
  const drawerOverlay = document.getElementById('drawerOverlay');

  const headerSubmitBtn = document.getElementById('headerSubmitBtn');
  const drawerSubmitBtn = document.getElementById('drawerSubmitBtn');
  const submitModal = document.getElementById('submitModal');
  const modalStats = document.getElementById('modalStats');
  const cancelSubmitBtn = document.getElementById('cancelSubmitBtn');
  const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
  const timerToastWrap = document.getElementById('timerToastWrap');

  // ---- Load or resume state --------------------------------------------
  let state = Storage.loadExamState();

  if (!state || state.submitted) {
    const testData = Storage.loadTestData();
    if (!testData || !testData.questions || testData.questions.length === 0) {
      alert('No test found. Redirecting to the setup page.');
      window.location.href = 'index.html';
      return;
    }
    state = buildFreshState(testData);
    Storage.saveExamState(state);
  }

  function buildFreshState(testData) {
    const status = {};
    const timeSpent = {};
    testData.questions.forEach((q) => {
      status[q.id] = 'not-visited';
      timeSpent[q.id] = 0;
    });
    return {
      testName: testData.testName,
      durationMinutes: testData.durationMinutes,
      questions: testData.questions,
      currentIndex: 0,
      answers: {},
      status,
      timeSpent,
      endTimestamp: Date.now() + testData.durationMinutes * 60 * 1000,
      currentEnteredAt: Date.now(),
      submitted: false,
      warnedFiveMin: false,
      warnedOneMin: false,
    };
  }

  const questions = state.questions;
  let activeSubjectFilter = 'ALL';

  // ---- Helpers ------------------------------------------------------------
  function currentQuestion() {
    return questions[state.currentIndex];
  }

  function formatHMS(totalSeconds) {
    totalSeconds = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }

  function formatMS(totalSeconds) {
    totalSeconds = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function flushCurrentQuestionTime() {
    const q = currentQuestion();
    if (!q) return;
    const now = Date.now();
    const elapsedSec = (now - state.currentEnteredAt) / 1000;
    state.timeSpent[q.id] = (state.timeSpent[q.id] || 0) + Math.max(0, elapsedSec);
    state.currentEnteredAt = now;
  }

  function liveTimeForCurrentQuestion() {
    const q = currentQuestion();
    if (!q) return 0;
    const now = Date.now();
    const extra = (now - state.currentEnteredAt) / 1000;
    return (state.timeSpent[q.id] || 0) + Math.max(0, extra);
  }

  // ---- Rendering ------------------------------------------------------------
  function renderHeader() {
    testNameEl.textContent = state.testName;
  }

  function renderQuestion() {
    const q = currentQuestion();
    qIndexEl.textContent = `Question ${state.currentIndex + 1} of ${questions.length}`;
    qSubjectMarksEl.textContent = `${q.subject} · +${q.marksCorrect} / ${q.marksWrong}`;
    questionTextEl.textContent = `Q${q.id}. ${q.text}`;

    if (q.type === 'MCQ') {
      mcqOptionsWrap.classList.remove('hidden');
      numInputWrap.classList.add('hidden');
      const selected = state.answers[q.id];
      mcqOptionsWrap.innerHTML = ['A', 'B', 'C', 'D']
        .map((key) => {
          const isSel = selected === key;
          return `
          <div class="option ${isSel ? 'selected' : ''}" data-key="${key}">
            <input type="radio" name="mcqOption" id="opt${key}" value="${key}" ${isSel ? 'checked' : ''}>
            <label for="opt${key}">${key}) ${escapeHtml(q.options && q.options[key] ? q.options[key] : '')}</label>
          </div>`;
        })
        .join('');

      mcqOptionsWrap.querySelectorAll('.option').forEach((optEl) => {
        optEl.addEventListener('click', () => selectMcqOption(optEl.dataset.key));
      });
    } else {
      mcqOptionsWrap.classList.add('hidden');
      numInputWrap.classList.remove('hidden');
      numAnswerInput.value = state.answers[q.id] !== undefined ? state.answers[q.id] : '';
    }

    // Mark as visited if it was 'not-visited'
    if (state.status[q.id] === 'not-visited') {
      state.status[q.id] = 'not-answered';
    }

    updateMarkButtonLabel();
    renderPalette();
    updateQuestionTimeDisplay();
  }

  function selectMcqOption(key) {
    const q = currentQuestion();
    state.answers[q.id] = key;
    const wasMarked = state.status[q.id] === 'marked' || state.status[q.id] === 'answered-marked';
    state.status[q.id] = wasMarked ? 'answered-marked' : 'answered';
    renderQuestion();
    saveStateThrottled();
  }

  numAnswerInput.addEventListener('input', () => {
    const q = currentQuestion();
    const val = numAnswerInput.value.trim();
    if (val === '') {
      delete state.answers[q.id];
      const wasMarked = state.status[q.id] === 'answered-marked';
      state.status[q.id] = wasMarked ? 'marked' : 'not-answered';
    } else {
      state.answers[q.id] = val;
      const wasMarked = state.status[q.id] === 'marked' || state.status[q.id] === 'answered-marked';
      state.status[q.id] = wasMarked ? 'answered-marked' : 'answered';
    }
    renderPalette();
    saveStateThrottled();
  });

  function updateMarkButtonLabel() {
    const q = currentQuestion();
    const isMarked = state.status[q.id] === 'marked' || state.status[q.id] === 'answered-marked';
    markBtn.textContent = isMarked ? '★ Marked (click to unmark) & Next' : 'Mark for Review & Next';
  }

  function updateQuestionTimeDisplay() {
    qTimeEl.textContent = formatMS(liveTimeForCurrentQuestion());
  }

  function statusClass(status) {
    switch (status) {
      case 'answered': return 'pal-answered';
      case 'not-answered': return 'pal-not-answered';
      case 'marked': return 'pal-marked';
      case 'answered-marked': return 'pal-answered-marked';
      default: return 'pal-not-visited';
    }
  }

  function renderSubjectTabs() {
    const subjects = ['ALL', ...new Set(questions.map((q) => q.subject))];
    subjectTabs.innerHTML = subjects
      .map((s) => `<button type="button" class="subject-tab ${s === activeSubjectFilter ? 'active' : ''}" data-subj="${escapeHtml(s)}">${escapeHtml(s)}</button>`)
      .join('');
    subjectTabs.querySelectorAll('.subject-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSubjectFilter = btn.dataset.subj;
        renderSubjectTabs();
        renderPalette();
      });
    });
  }

  function renderPalette() {
    const q = currentQuestion();
    const visible = questions.filter((qq) => activeSubjectFilter === 'ALL' || qq.subject === activeSubjectFilter);
    paletteGrid.innerHTML = visible
      .map((qq, idx) => {
        const realIndex = questions.indexOf(qq);
        const cls = statusClass(state.status[qq.id]);
        const isCurrent = qq.id === q.id;
        return `<button type="button" class="palette-btn ${cls} ${isCurrent ? 'current' : ''}" data-index="${realIndex}">${qq.id}</button>`;
      })
      .join('');
    paletteGrid.querySelectorAll('.palette-btn').forEach((btn) => {
      btn.addEventListener('click', () => goToQuestion(parseInt(btn.dataset.index, 10)));
    });
  }

  // ---- Navigation ------------------------------------------------------------
  function goToQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    if (index === state.currentIndex) { closeDrawer(); return; }
    flushCurrentQuestionTime();
    state.currentIndex = index;
    state.currentEnteredAt = Date.now();
    renderQuestion();
    saveStateThrottled(true);
    closeDrawer();
  }

  prevBtn.addEventListener('click', () => goToQuestion(state.currentIndex - 1));

  saveNextBtn.addEventListener('click', () => {
    const q = currentQuestion();
    if (state.status[q.id] === 'not-visited') state.status[q.id] = 'not-answered';
    if (state.currentIndex < questions.length - 1) {
      goToQuestion(state.currentIndex + 1);
    } else {
      saveStateThrottled(true);
    }
  });

  clearBtn.addEventListener('click', () => {
    const q = currentQuestion();
    delete state.answers[q.id];
    const wasMarked = state.status[q.id] === 'marked' || state.status[q.id] === 'answered-marked';
    state.status[q.id] = wasMarked ? 'marked' : 'not-answered';
    renderQuestion();
    saveStateThrottled(true);
  });

  markBtn.addEventListener('click', () => {
    const q = currentQuestion();
    const hasAnswer = state.answers[q.id] !== undefined && state.answers[q.id] !== '';
    const currentlyMarked = state.status[q.id] === 'marked' || state.status[q.id] === 'answered-marked';

    if (currentlyMarked) {
      state.status[q.id] = hasAnswer ? 'answered' : 'not-answered';
    } else {
      state.status[q.id] = hasAnswer ? 'answered-marked' : 'marked';
    }

    if (state.currentIndex < questions.length - 1) {
      goToQuestion(state.currentIndex + 1);
    } else {
      renderQuestion();
      saveStateThrottled(true);
    }
  });

  // ---- Palette drawer (mobile) ------------------------------------------------
  function openDrawer() {
    palettePanel.classList.add('open');
    drawerOverlay.classList.add('open');
  }
  function closeDrawer() {
    if (window.innerWidth > 860) return;
    palettePanel.classList.remove('open');
    drawerOverlay.classList.remove('open');
  }
  paletteToggleBtn.addEventListener('click', () => {
    palettePanel.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  drawerOverlay.addEventListener('click', closeDrawer);

  // ---- Keyboard navigation (desktop) ------------------------------------------
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === 'ArrowRight') goToQuestion(state.currentIndex + 1);
    if (e.key === 'ArrowLeft') goToQuestion(state.currentIndex - 1);
  });

  // ---- Timer -------------------------------------------------------------------
  function tick() {
    if (state.submitted) return;
    const remainingSeconds = Math.max(0, Math.round((state.endTimestamp - Date.now()) / 1000));
    timerEl.textContent = formatHMS(remainingSeconds);

    timerEl.classList.toggle('timer-critical', remainingSeconds <= 60);
    timerEl.classList.toggle('timer-warning', remainingSeconds <= 300 && remainingSeconds > 60);

    if (remainingSeconds <= 300 && !state.warnedFiveMin) {
      state.warnedFiveMin = true;
      showTimerToast('⏰ Only 5 minutes remaining!');
    }
    if (remainingSeconds <= 60 && !state.warnedOneMin) {
      state.warnedOneMin = true;
      showTimerToast('⏰ 1 minute left — finish up!');
    }

    updateQuestionTimeDisplay();

    if (remainingSeconds <= 0) {
      autoSubmit();
      return;
    }
  }

  function showTimerToast(text) {
    const toast = document.createElement('div');
    toast.className = 'timer-toast';
    toast.textContent = text;
    timerToastWrap.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  let timerInterval = setInterval(tick, 1000);

  // ---- Autosave (throttled) ----------------------------------------------------
  let saveTimeout = null;
  function saveStateThrottled(immediate) {
    if (immediate) {
      persist();
      return;
    }
    if (saveTimeout) return;
    saveTimeout = setTimeout(() => {
      persist();
      saveTimeout = null;
    }, 3000);
  }

  function persist() {
    Storage.saveExamState(state);
  }

  setInterval(() => persist(), 5000);

  // ---- Submit flow ----------------------------------------------------------
  function computeCounts() {
    let answered = 0, notAnswered = 0, marked = 0, answeredMarked = 0;
    questions.forEach((q) => {
      const s = state.status[q.id];
      if (s === 'answered') answered++;
      else if (s === 'marked') marked++;
      else if (s === 'answered-marked') answeredMarked++;
      else notAnswered++;
    });
    const attempted = questions.filter((q) => state.answers[q.id] !== undefined && state.answers[q.id] !== '').length;
    return { answered, notAnswered, marked, answeredMarked, attempted, total: questions.length };
  }

  function openSubmitModal() {
    flushCurrentQuestionTime();
    const c = computeCounts();
    modalStats.innerHTML = `
      <div><span class="label">Total Questions</span><span class="value">${c.total}</span></div>
      <div><span class="label">Attempted</span><span class="value">${c.attempted}</span></div>
      <div><span class="label">Not Attempted</span><span class="value">${c.total - c.attempted}</span></div>
      <div><span class="label">Marked for Review</span><span class="value">${c.marked + c.answeredMarked}</span></div>
    `;
    submitModal.classList.remove('hidden');
  }

  headerSubmitBtn.addEventListener('click', openSubmitModal);
  drawerSubmitBtn.addEventListener('click', openSubmitModal);
  cancelSubmitBtn.addEventListener('click', () => submitModal.classList.add('hidden'));
  confirmSubmitBtn.addEventListener('click', () => finishExam());

  function autoSubmit() {
    if (state.submitted) return;
    flushCurrentQuestionTime();
    showTimerToast("⏰ Time's up! Submitting your test...");
    setTimeout(() => finishExam(), 1200);
  }

  function finishExam() {
    if (state.submitted) return;
    flushCurrentQuestionTime();
    state.submitted = true;
    clearInterval(timerInterval);

    const result = calculateResult(state);
    Storage.saveResult(result);
    Storage.clearExamState();
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    window.location.href = 'result.html';
  }

  function calculateResult(st) {
    let correct = 0, wrong = 0, notAttempted = 0, ungraded = 0, score = 0, totalMarksPossible = 0;
    const hasAnyAnswerKey = st.questions.some((q) => q.answer !== null && q.answer !== undefined);

    const rows = st.questions.map((q) => {
      totalMarksPossible += q.marksCorrect;
      const userAns = st.answers[q.id];
      const timeSpentSec = Math.round(st.timeSpent[q.id] || 0);
      const attempted = userAns !== undefined && userAns !== null && String(userAns).trim() !== '';

      let status;
      let marksAwarded = 0;

      if (!attempted) {
        status = 'Not Attempted';
        notAttempted++;
      } else if (q.answer === null || q.answer === undefined) {
        status = 'Ungraded';
        ungraded++;
      } else {
        let isCorrect = false;
        if (q.type === 'NUM') {
          const userNum = parseFloat(String(userAns).trim());
          const correctNum = parseFloat(String(q.answer).trim());
          isCorrect = !isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) < 0.01;
        } else {
          isCorrect = String(userAns).trim().toUpperCase() === String(q.answer).trim().toUpperCase();
        }

        if (isCorrect) {
          status = 'Correct';
          correct++;
          marksAwarded = q.marksCorrect;
        } else {
          status = 'Wrong';
          wrong++;
          marksAwarded = q.marksWrong;
        }
      }

      score += marksAwarded;

      return {
        id: q.id,
        subject: q.subject,
        type: q.type,
        status,
        timeSpentSec,
        userAnswer: attempted ? userAns : null,
        correctAnswer: q.answer,
        marksAwarded,
      };
    });

    const attemptedCount = st.questions.length - notAttempted;
    const totalTimeSeconds = Object.values(st.timeSpent).reduce((a, b) => a + b, 0);

    return {
      testName: st.testName,
      totalQuestions: st.questions.length,
      attempted: attemptedCount,
      correct,
      wrong,
      notAttempted,
      ungraded,
      score,
      totalMarksPossible,
      hasAnyAnswerKey,
      totalTimeSeconds: Math.round(totalTimeSeconds),
      rows,
      submittedAt: Date.now(),
    };
  }

  // ---- Prevent accidental navigation away --------------------------------------
  function beforeUnloadHandler(e) {
    if (state.submitted) return;
    e.preventDefault();
    e.returnValue = '';
  }
  window.addEventListener('beforeunload', beforeUnloadHandler);

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ---- Init ---------------------------------------------------------------
  renderHeader();
  renderSubjectTabs();
  renderQuestion();
  tick();
})();
