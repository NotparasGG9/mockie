/* parser.js
   Converts a pasted, plain-text question paper into structured question data.
   This is the ONLY file that understands the text format. If you ever want to
   change the format, this is the file to edit.

   ---------------------------------------------------------------------------
   SUPPORTED FORMAT (also documented in README.md)
   ---------------------------------------------------------------------------
   Optional header lines at the very top:
     TEST: My Physics Mock Test
     DURATION: 180

   Then one block per question. Each block MUST start with a line like:
     Q1 | Physics | MCQ | +4 -1
     Q2 | Physics | NUM | +4 -0

   Followed by the question text (one or more lines), then for MCQ the four
   options, then (optionally) an ANSWER line:

     Q1 | Physics | MCQ | +4 -1
     A particle moves such that its velocity v = 3t^2 - 2t.
     Find its acceleration at t = 2s.
     A) 8 m/s^2
     B) 10 m/s^2
     C) 12 m/s^2
     D) 14 m/s^2
     ANSWER: B

     Q2 | Physics | NUM | +4 -0
     A ball is dropped from a height of 20 m. Find the time taken to reach
     the ground (g = 10 m/s^2). Enter answer in seconds.
     ANSWER: 2

   Notes:
   - Subject can be anything (Physics, Chemistry, Mathematics, ...).
   - TYPE can be MCQ or NUM (numerical). Anything else defaults to MCQ.
   - Marks are optional and default to +4 -1. Write them as "+4 -1".
   - ANSWER is optional. If it is missing, that question simply will not be
     auto-graded later (this is not an error, only a warning).
   --------------------------------------------------------------------------- */

(function () {
  const Q_HEADER_REGEX = /^Q\s*(\d+)\s*\|/i;
  const OPTION_REGEX = /^([A-D])\)\s*(.*)$/;
  const ANSWER_REGEX = /^ANSWER\s*:\s*(.+)$/i;

  function parseQuestionPaper(rawText) {
    const errors = [];
    const warnings = [];

    if (!rawText || !rawText.trim()) {
      errors.push('The question paper is empty. Paste your test text first.');
      return { testName: 'JEE Mock Test', durationMinutes: 180, questions: [], errors, warnings };
    }

    const lines = rawText.replace(/\r\n/g, '\n').split('\n');

    let testName = 'JEE Mock Test';
    let durationMinutes = 180;

    // Find the first line that looks like a question header.
    const firstQIdx = lines.findIndex((l) => Q_HEADER_REGEX.test(l.trim()));

    if (firstQIdx === -1) {
      errors.push(
        'No questions were found. Every question must start with a line like "Q1 | Physics | MCQ | +4 -1". Check the format guide below.'
      );
      return { testName, durationMinutes, questions: [], errors, warnings };
    }

    // Parse optional header lines (TEST:, DURATION:) before the first question.
    for (let i = 0; i < firstQIdx; i++) {
      const line = lines[i].trim();
      let m;
      if ((m = line.match(/^TEST\s*:\s*(.+)$/i))) {
        testName = m[1].trim();
      } else if ((m = line.match(/^DURATION\s*:\s*(\d+)/i))) {
        durationMinutes = parseInt(m[1], 10);
      }
    }

    // Locate every question header line to split the text into blocks.
    const qLineIndices = [];
    lines.forEach((l, i) => {
      if (Q_HEADER_REGEX.test(l.trim())) qLineIndices.push(i);
    });

    const blocks = [];
    for (let i = 0; i < qLineIndices.length; i++) {
      const start = qLineIndices[i];
      const end = i + 1 < qLineIndices.length ? qLineIndices[i + 1] : lines.length;
      blocks.push(lines.slice(start, end));
    }

    const seenIds = new Set();
    const questions = [];

    blocks.forEach((blockLines) => {
      const headerLine = blockLines[0].trim();
      const hm = headerLine.match(Q_HEADER_REGEX);
      const qNum = parseInt(hm[1], 10);

      if (seenIds.has(qNum)) {
        errors.push(`Question ${qNum} appears more than once (duplicate question number). Rename one of them.`);
      }
      seenIds.add(qNum);

      const parts = headerLine.split('|').map((p) => p.trim());
      const subject = parts[1] || 'General';
      let type = (parts[2] || 'MCQ').toUpperCase();
      type = type.startsWith('NUM') ? 'NUM' : 'MCQ';

      let marksCorrect = 4;
      let marksWrong = -1;
      if (parts[3]) {
        const mm = parts[3].match(/([+\-]?\d+(?:\.\d+)?)[^\d+\-]+(-?\d+(?:\.\d+)?)/);
        if (mm) {
          marksCorrect = parseFloat(mm[1]);
          marksWrong = parseFloat(mm[2]);
          if (marksWrong > 0) marksWrong = -marksWrong;
        } else {
          warnings.push(`Question ${qNum}: could not read the marks "${parts[3]}", using default +4 -1.`);
        }
      }

      const bodyLines = blockLines.slice(1);
      let questionTextLines = [];
      let options = {};
      let answer = null;
      let mode = 'text';

      for (const raw of bodyLines) {
        const trimmed = raw.trim();
        if (trimmed === '') continue;

        const am = trimmed.match(ANSWER_REGEX);
        if (am) {
          answer = am[1].trim().toUpperCase();
          mode = 'answer';
          continue;
        }

        const om = trimmed.match(OPTION_REGEX);
        if (om) {
          options[om[1]] = om[2].trim();
          mode = 'options';
          continue;
        }

        if (mode === 'text') {
          questionTextLines.push(trimmed);
        }
        // Stray lines appearing after options/answer are ignored on purpose,
        // so a trailing blank line or note doesn't break parsing.
      }

      const text = questionTextLines.join(' ').replace(/\s+/g, ' ').trim();

      if (!text) {
        errors.push(`Question ${qNum}: the question text is missing.`);
      }

      if (type === 'MCQ') {
        const requiredKeys = ['A', 'B', 'C', 'D'];
        const missing = requiredKeys.filter((k) => !options[k]);
        if (missing.length > 0) {
          errors.push(`Question ${qNum}: missing option(s) ${missing.join(', ')}.`);
        }
        if (answer && !requiredKeys.includes(answer)) {
          errors.push(`Question ${qNum}: answer "${answer}" is not a valid option (must be A, B, C or D).`);
          answer = null;
        }
      } else if (type === 'NUM') {
        options = null;
        if (answer !== null && isNaN(parseFloat(answer))) {
          errors.push(`Question ${qNum}: numerical answer "${answer}" is not a valid number.`);
          answer = null;
        }
      }

      if (!answer) {
        warnings.push(`Question ${qNum}: no answer key given — it will show as "Ungraded" in your result, not right or wrong.`);
      }

      questions.push({
        id: qNum,
        subject: subject || 'General',
        type,
        marksCorrect,
        marksWrong,
        text,
        options,
        answer: answer || null,
      });
    });

    questions.sort((a, b) => a.id - b.id);

    if (durationMinutes <= 0 || isNaN(durationMinutes)) {
      warnings.push('DURATION was invalid, defaulting to 180 minutes.');
      durationMinutes = 180;
    }

    return { testName, durationMinutes, questions, errors, warnings };
  }

  window.Parser = { parse: parseQuestionPaper };
})();
