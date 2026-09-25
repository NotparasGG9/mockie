# JEE Mock Test Website

A simple, offline, no-login website that turns a question paper (that you generate
with ChatGPT/Gemini/Claude) into a real JEE-style Computer-Based-Test exam, with a
timer, question palette, per-question time tracking, and a copy-pasteable result.

No backend, no database, no AI integration, no accounts. Everything runs in your
browser and is saved to that browser's local storage only.

```
Generate questions elsewhere → Paste them here → Take a serious timed test → Get result → Copy result → Analyze elsewhere.
```

---

## 1. Folder structure

```
jee-mock-test/
├── index.html         (Setup page: paste paper, import, start test)
├── exam.html           (The actual exam screen)
├── result.html         (Result screen after submission)
├── css/
│   └── style.css        (All styling)
├── js/
│   ├── storage.js       (localStorage helpers)
│   ├── parser.js        (Turns pasted text into question objects)
│   ├── sample-data.js    (Demo paper + the AI prompt text)
│   ├── app.js           (Logic for index.html)
│   ├── exam.js           (Logic for exam.html — timer, navigation, saving)
│   └── result.js          (Logic for result.html)
└── README.md            (this file)
```

You never need to edit `exam.js`, `result.js`, `storage.js`, or the HTML files to
create a new test. The only thing that changes each time is the text you paste in.
If you ever want to change the AI prompt or the demo paper, that's in
`js/sample-data.js`.

---

## 2. Running it on your computer (first time)

1. **Install VS Code** (free): https://code.visualstudio.com/
2. Download/copy the `jee-mock-test` folder onto your computer.
3. Open VS Code → **File → Open Folder** → select `jee-mock-test`.
4. Install the **"Live Server"** extension in VS Code (Extensions icon on the left
   sidebar → search "Live Server" by Ritwick Dey → Install).
5. In the file explorer (left panel), right-click `index.html` → **"Open with Live
   Server"**.
6. Your browser opens automatically at something like `http://127.0.0.1:5500/`.
   That's your website, running locally.

You can also just double-click `index.html` to open it directly in a browser
without VS Code — it will work, but Live Server is recommended because it
auto-refreshes when you edit files.

## 3. Testing it on your phone (before deploying)

While Live Server is running on your computer:

1. Make sure your phone and computer are on the **same Wi-Fi network**.
2. Find your computer's local IP address:
   - Windows: open Command Prompt, type `ipconfig`, look for "IPv4 Address"
     (e.g. `192.168.1.5`).
   - Mac: **System Settings → Wi-Fi → Details** → look for the IP address.
3. On your phone's browser, go to `http://<that-ip>:5500/` (e.g.
   `http://192.168.1.5:5500/`).
4. You should see the same website. This is the best way to check mobile layout
   before you deploy it publicly.

(This step is optional — once it's on GitHub Pages, step 5 below, you can just
open the GitHub Pages link on your phone directly and skip this local network step
every time.)

---

## 4. How to use the website (every time you take a mock test)

1. Generate a mock test with ChatGPT/Gemini/Claude using the **AI prompt** in
   Section 6 below (or copy it straight from the website with the "Copy AI
   Generation Prompt" button).
2. Copy the entire generated paper.
3. Open the website → paste the paper into the big text box.
4. Click **"Import & Check Paper"**.
   - If there are errors, fix your pasted text (or ask the AI to fix the
     specific question it names) and re-import.
   - Warnings (like "no answer key for Q5") don't block you — you can still start.
5. Check the preview (subject counts, duration) → adjust duration if you want →
   click **"Start Test →"**.
6. Take the exam. The timer starts immediately and runs on its own — you don't
   need to watch a separate app.
7. When done, click **Submit** (top of exam screen or inside the question panel
   on mobile), confirm in the popup.
8. On the Result page, review your score and question-wise table.
9. Click **"Copy Result"**, then paste it into ChatGPT/Gemini/Claude and ask for
   a detailed analysis of your mistakes, weak topics, time management, etc.
10. Click **"Start a New Test"** to go back and paste your next paper.

---

## 5. The question paper format

This is the format your pasted text (or the AI's generated text) must follow.
It's designed to be easy for an AI to produce reliably.

### Optional header (top of the paper)

```
TEST: My Physics Mock Test
DURATION: 180
```

- `TEST:` — name of the test (optional, defaults to "JEE Mock Test").
- `DURATION:` — total exam time in minutes (optional, defaults to 180). You can
  also override this in the website before starting.

### Each question

**Single Correct MCQ:**

```
Q1 | Physics | MCQ | +4 -1
A particle moves such that its velocity v = 3t^2 - 2t.
Find its acceleration at t = 2s.
A) 8 m/s^2
B) 10 m/s^2
C) 12 m/s^2
D) 14 m/s^2
ANSWER: B
```

**Numerical answer type:**

```
Q2 | Physics | NUM | +4 -0
A ball is dropped from a height of 20 m (g = 10 m/s^2).
Find the time taken to reach the ground, in seconds.
ANSWER: 2
```

### Rules

- The first line of every question **must** look like:
  `Q<number> | <Subject> | <MCQ or NUM> | +<marks> -<negative marks>`
- Question numbers must be sequential and unique (Q1, Q2, Q3, …).
- Subject can be anything — "Physics", "Chemistry", "Mathematics", or a topic name.
- Marks are optional — if you leave them out, it defaults to `+4 -1`.
- `ANSWER:` is optional. If it's missing, that question just won't be auto-graded
  (it will show as "Ungraded" in your result, not counted right or wrong).
- Leave a blank line between questions (recommended, but the parser also works
  without it since it detects each new `Qn |` line automatically).
- Write maths in plain text: `x^2` for powers, `a/b` for fractions, `H_2O` for
  subscripts, and Greek letters either by name (`theta`, `pi`, `Delta`) or as
  the actual symbol (`θ`, `π`, `Δ`) — both display fine as plain text.

### What happens with bad input

The website never crashes on bad input — it tells you exactly what's wrong:

- Missing option → *"Question 7: missing option(s) C."*
- Duplicate question number → *"Question 12 appears more than once."*
- Invalid numerical answer → *"Question 40: numerical answer 'abc' is not a valid number."*
- Empty paper → *"The question paper is empty."*
- No `Qn |` lines found at all → *"No questions were found."*

Fix the pasted text (or the specific question) and click **Import & Check Paper**
again.

---

## 6. The AI prompt (copy this into ChatGPT/Gemini/Claude)

You can get this exact text any time by clicking **"Copy AI Generation Prompt"**
on the website. It's also stored in `js/sample-data.js` if you want to tweak it.

```
You are generating a mock test question paper for a personal JEE-style exam website. Follow this EXACT plain-text format — do not add markdown, bold text, numbering styles, or extra commentary. Output ONLY the test in the format below, nothing else.

FORMAT RULES:
1. Start with two header lines:
TEST: <a short name for this test>
DURATION: <total time in minutes, as a plain number>

2. Then leave one blank line, then write each question as a block, in order, like this:
Q<number> | <Subject> | <MCQ or NUM> | +<correct marks> -<negative marks>
<question text, can span 1-4 lines, plain text only>
A) <option text>
B) <option text>
C) <option text>
D) <option text>
ANSWER: <A, B, C or D>

For a numerical-answer question, skip the options and instead write:
Q<number> | <Subject> | NUM | +<correct marks> -<negative marks>
<question text>
ANSWER: <the correct numeric value>

3. Leave one blank line between question blocks.
4. Number questions sequentially starting from Q1, with no gaps or repeats.
5. Use standard JEE marking unless I say otherwise: +4 for correct, -1 for wrong on MCQ, and +4 -0 for numerical unless I ask for negative marking on numericals too.
6. Do not use LaTeX. Write powers as ^ (e.g. x^2), fractions as a/b, subscripts as _ (e.g. H_2O), and Greek letters by name or their normal unicode symbol (e.g. θ, π, Δ) — plain text only.
7. Always include the ANSWER line for every question — never skip the answer key.
8. Group questions by subject (all Physics first, then Chemistry, then Mathematics), and keep my requested subjects and question count exactly.

Now generate a mock test with these details:
- Subjects and number of questions per subject: [FILL THIS IN, e.g. "25 Physics, 25 Chemistry, 25 Mathematics"]
- Topics to focus on: [FILL THIS IN, e.g. "Class 11 Physics: Laws of Motion, Work Energy Power"]
- Difficulty level: [FILL THIS IN, e.g. "JEE Main level, mix of easy/medium/hard"]
- Total duration in minutes: [FILL THIS IN, e.g. "180"]
- Number of numerical-type questions: [FILL THIS IN, e.g. "5 per subject"]
```

Fill in the `[FILL THIS IN]` parts before sending it.

---

## 7. Deploying for free on GitHub Pages

Do this once — after that, your website has a permanent link you can open from
your phone anytime, with no computer running.

### Step 1 — Create a GitHub account
Go to https://github.com and sign up if you don't already have an account.

### Step 2 — Create a new repository
1. Click the **+** icon (top right) → **New repository**.
2. Repository name: `jee-mock-test` (or anything you like).
3. Set it to **Public**.
4. Do **not** check "Add a README" (you already have one).
5. Click **Create repository**.

### Step 3 — Upload your files
1. On the new repository's page, click **"uploading an existing file"**.
2. Drag and drop your whole `jee-mock-test` folder contents (the `index.html`,
   `exam.html`, `result.html`, `css/` folder, `js/` folder, `README.md`) — you can
   drag the whole folder in most browsers, or select all files/folders at once.
3. Scroll down, click **Commit changes**.

*(Alternative, if you're comfortable with Git: `git init`, `git add .`,
`git commit -m "first version"`, `git remote add origin <your repo url>`,
`git push -u origin main`.)*

### Step 4 — Enable GitHub Pages
1. In your repository, click **Settings** (top menu).
2. In the left sidebar, click **Pages**.
3. Under "Build and deployment" → "Source", select **Deploy from a branch**.
4. Under "Branch", select **main** and folder **/ (root)** → **Save**.
5. Wait about 1 minute, then refresh the page. You'll see a green box with your
   live link, something like:
   `https://<your-username>.github.io/jee-mock-test/`

### Step 5 — Use it
Open that link on your phone or computer, bookmark it, and you're done. No
computer needs to be running — GitHub hosts it for free, permanently.

### Updating the website later
If you ever fix something in a file:
1. Go to the file in your GitHub repository → click the pencil (✏️) icon to edit.
2. Make your change → **Commit changes**.
3. GitHub Pages updates automatically within a minute or two.

---

## 8. How the timer & refresh-protection work (for your peace of mind)

- The timer is based on a fixed **end time** (`start time + duration`), not a
  simple countdown counter — so it stays accurate even if your phone's browser
  tab is in the background for a while.
- Your progress (current question, answers, status, time per question, timer)
  is saved to your browser's local storage every few seconds and every time you
  do something (answer, navigate, mark). If you accidentally refresh or close the
  tab, reopening `exam.html` (or just the site — it detects an unfinished exam
  automatically) restores everything, usually with no more than a few seconds of
  time-tracking lost.
- Nothing is ever sent over the internet during the exam — it all stays in your
  browser's local storage on that device.
- **Important:** local storage is per-browser and per-device. If you switch
  browsers or devices mid-exam, your progress won't follow — finish a test in
  the same browser you started it in.

---

## 9. What was tested before calling this "done"

- **10-question test** — imports cleanly, all statuses and navigation work.
- **75-question full JEE-style test (3 subjects)** — parses correctly, subject
  tabs in the palette filter correctly, performance stays instant.
- **Mobile screen** — palette becomes a slide-in drawer, buttons stay large and
  tappable, no horizontal scrolling, timer stays visible in the header.
- **Desktop screen** — palette sits as a fixed sidebar, layout works well down
  to smaller/older monitor resolutions.
- **Timer reaching zero** — auto-submits automatically with a short warning
  toast, timer never goes negative.
- **Refresh during exam** — reopening the site detects the saved state and
  restores your question, answers, statuses, and timer.
- **Mark for review** — toggles correctly, combines properly with "answered"
  state (shows as a distinct "Answered + Marked" colour with a dot).
- **Changing an answer** — selecting a different option before submission
  updates immediately and is reflected in the palette.
- **Copying the result** — produces a clean plain-text block suitable for
  pasting directly into an AI chat.
- **Invalid question format** — missing options, duplicate question numbers,
  invalid numeric answers, and empty papers all produce clear error messages
  instead of crashing, and block starting the test until fixed.

---

## 10. Troubleshooting

- **"No questions were found" even though I pasted text** — check that each
  question's first line matches `Q1 | Subject | MCQ | +4 -1` exactly (pipe
  characters `|` are required).
- **Timer looks wrong after a refresh** — this can happen if your device's
  clock changed significantly. It's rare; if it happens, just submit and start
  a fresh test.
- **Result shows "N/A" for score** — this means none of your questions had an
  `ANSWER:` line. Make sure your AI prompt run included answer keys.
- **Clipboard copy doesn't work** — some older mobile browsers block automatic
  clipboard access. If "Copy Result" fails, the result text is also shown in a
  text box on the same page — long-press to select all and copy manually.
- **Website looks broken after I edited a file on GitHub** — double check you
  didn't accidentally delete a `<script>` tag or change a filename; compare
  against the original files in this project.

---

## 11. Philosophy (why this is deliberately simple)

This is meant to be a **first and final** version. It intentionally has no
login, no database, no AI integration, no analytics, and no framework — just
three static HTML pages and plain JavaScript, so it's something you can
understand, trust, and never need to touch again. Spend your time on JEE
prep, not on this website.
