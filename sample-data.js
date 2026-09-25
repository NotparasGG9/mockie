/* sample-data.js
   Holds the demo paper (for the "Load Sample Test" button) and the exact
   prompt text used by the "Copy AI Generation Prompt" button.
   Keeping these here (instead of buried in app.js) makes them easy to find
   and edit later if you want to tweak the AI prompt. */

const SAMPLE_TEST_TEXT = `TEST: Sample Mock Test (Demo)
DURATION: 15

Q1 | Physics | MCQ | +4 -1
A particle moves such that its velocity is v = 3t^2 - 2t (SI units).
What is its acceleration at t = 2 s?
A) 8 m/s^2
B) 10 m/s^2
C) 12 m/s^2
D) 14 m/s^2
ANSWER: B

Q2 | Physics | NUM | +4 -0
A ball is dropped from a height of 20 m (g = 10 m/s^2).
Find the time taken to reach the ground, in seconds.
ANSWER: 2

Q3 | Chemistry | MCQ | +4 -1
Which of the following is NOT an example of a colligative property?
A) Elevation of boiling point
B) Depression of freezing point
C) Osmotic pressure
D) Optical rotation
ANSWER: D

Q4 | Chemistry | MCQ | +4 -1
The hybridisation of carbon in diamond is:
A) sp
B) sp2
C) sp3
D) sp3d
ANSWER: C

Q5 | Mathematics | NUM | +4 -1
Find the value of the definite integral of 2x dx from x = 0 to x = 3.
ANSWER: 9
`;

const AI_GENERATION_PROMPT = `You are generating a mock test question paper for a personal JEE-style exam website. Follow this EXACT plain-text format — do not add markdown, bold text, numbering styles, or extra commentary. Output ONLY the test in the format below, nothing else.

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
`;
