# Mandarin Pinyin Practice Prompt Template

This document defines the structure for a Mandarin vocabulary practice session using your active vocabulary list. Follow this prompt whenever you want to start a practice session.

## Session Instructions

**Only use words/phrases from your Active Vocabulary list.**

### I (the instructor) will:

- Construct a short, simple, coherent Mandarin sentence.
- Present it as Chinese characters.

### You (the learner) will:

- Respond with tone-number pinyin, typing every syllable and tone.

### I will grade your response using this exact format:

- **Score**: X of Y characters correct / total
- **Comparison**: fixed-spacing alignment for vertical diff
- **Correction needed**: indicate which characters or tones were incorrect

After grading, I will immediately provide the next exercise.

The loop continues until you request a session performance report.

## Exercise Format

### Exercise n

**Sentence (characters):**
```
<Chinese sentence>
```

👉 Type the tone-number pinyin for this sentence.

**Learner Response Example:**
```
wo3 ming2 bai2
```

## Grading Format

**Score:** X / Y characters correct

**Comparison:**

```
Correct Answer: <correct pinyin aligned>
Your Response : <learner pinyin aligned>
```

**Correction needed:**
```
<indicate which syllables or tones were wrong>
```

### Example:

**Score:** 2 / 3 characters correct

**Comparison:**

```
Correct Answer: wo3 ming2 bai2
Your Response : wo3 ming2 bai
```

**Correction needed:**
> 白 is bai2 (2nd tone); the tone was missing.

## Next Exercise Prompt

After grading, the next exercise is presented like this:

### Exercise n+1

**Sentence (characters):**
```
<next sentence>
```

👉 Type the tone-number pinyin.

## Session Performance Tracking

I will track your responses across the session:

- **Per-item accuracy**: correct characters / total
- **Tone errors**: how often tones were missed or wrong
- **Syllable errors**: incorrect syllable choices
- **Total progress**: summary report

## Requesting a Session Report

At any time, type:

```
!report
```

I will respond with a performance summary, including:

- Total exercises completed
- Average characters correct
- Most common error type (tone / syllable / other)
- Suggested focus areas for next practice session

### Example Summary Report:

```
Session Report:

Total Exercises: 12
Average Accuracy: 88%
Tone Errors: 3
Syllable Errors: 1
Common Mistakes: xue2 vs xue3; zou3 vs zuo3
Suggested Focus: Review 3rd vs 2nd tone distinctions, common verbs
```

## Notes

- Keep all sentences short and simple to avoid introducing unknown grammar.
- Always align Correct Answer and Your Response pinyin vertically for easy comparison.
- Add two spaces after "Your Response:" so the pinyin lines up exactly.
- The system is flexible: whenever your vocabulary repertoire changes, the prompt automatically uses the current list.
- This template ensures repeatable, consistent exercises, exact grading, and session tracking.