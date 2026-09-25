/* storage.js
   Small wrapper around localStorage so the rest of the code never touches
   localStorage directly. Everything lives on this one device/browser —
   nothing is ever sent to a server. */

(function () {
  const KEYS = {
    TEST_DATA: 'jeeMock_testData', // the imported paper, before the exam starts
    EXAM_STATE: 'jeeMock_examState', // live state of an in-progress exam
    RESULT: 'jeeMock_result', // the last finished result
  };

  function safeGet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Storage read failed for', key, e);
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write failed for', key, e);
      return false;
    }
  }

  window.Storage = {
    KEYS,
    saveTestData: (data) => safeSet(KEYS.TEST_DATA, data),
    loadTestData: () => safeGet(KEYS.TEST_DATA),
    clearTestData: () => localStorage.removeItem(KEYS.TEST_DATA),

    saveExamState: (state) => safeSet(KEYS.EXAM_STATE, state),
    loadExamState: () => safeGet(KEYS.EXAM_STATE),
    clearExamState: () => localStorage.removeItem(KEYS.EXAM_STATE),

    saveResult: (result) => safeSet(KEYS.RESULT, result),
    loadResult: () => safeGet(KEYS.RESULT),
    clearResult: () => localStorage.removeItem(KEYS.RESULT),
  };
})();
