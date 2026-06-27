"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Generate 10 technical interview questions for a ${
      user.industry
    } professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.
    
    Each question should be multiple choice with 4 options.
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const text = result.text;
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: improvementPrompt,
      });

      improvementTip = tipResult.text.trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

export async function generateVoiceQuestion() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
      experience: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Generate a single open-ended interview question for a ${
      user.industry
    } professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }${user.experience ? ` and ${user.experience} years of experience` : ""}.
    
    The question should be the kind asked in a real job interview — either behavioral (STAR method) or technical requiring a detailed verbal explanation.
    
    Return the response in this JSON format only, no additional text:
    {
      "question": "string",
      "type": "Behavioral" | "Technical" | "Situational",
      "tips": "A brief one-line tip on how to approach this question"
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const text = result.text.trim();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating voice question:", error);
    throw new Error("Failed to generate interview question");
  }
}

export async function evaluateVoiceAnswer(question, answer) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    You are an expert interviewer for the ${user.industry} industry.
    
    Evaluate the following interview answer:

    QUESTION: ${question}
    
    CANDIDATE'S ANSWER: ${answer}

    Provide your evaluation in ONLY the following JSON format without any additional notes or explanations:
    {
      "score": number (0-100),
      "strengths": ["strength1", "strength2", "strength3"],
      "improvements": ["improvement1", "improvement2", "improvement3"],
      "modelAnswer": "A concise model answer that demonstrates best practices (150-200 words)",
      "overallFeedback": "A brief 2-3 sentence summary of the candidate's performance"
    }

    IMPORTANT:
    - Return ONLY valid JSON. No markdown, no backticks, no explanations.
    - Be constructive and encouraging but honest.
    - Include at least 2 strengths and 2 improvements.
    - The model answer should be specific to the question asked.
    - Score should reflect how well a real interviewer would rate this answer.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const text = result.text.trim();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error evaluating voice answer:", error);
    throw new Error("Failed to evaluate your answer. Please try again.");
  }
}

export async function generateSkillRoadmap(assessmentId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const assessment = await db.assessment.findUnique({
    where: {
      id: assessmentId,
      userId: user.id,
    },
  });

  if (!assessment) throw new Error("Assessment not found");

  const wrongQuestions = assessment.questions.filter((q) => !q.isCorrect);

  if (wrongQuestions.length === 0) {
    throw new Error(
      "You got all questions correct! No roadmap needed — you're already an expert."
    );
  }

  const wrongTopics = wrongQuestions
    .map(
      (q) =>
        `Question: "${q.question}" | Correct Answer: "${q.answer}" | Your Answer: "${q.userAnswer}"`
    )
    .join("\n");

  const prompt = `
    You are a career development expert for the ${user.industry} industry.
    
    A candidate scored ${assessment.quizScore.toFixed(
      1
    )}% on a technical quiz. They got the following questions wrong:

    ${wrongTopics}

    Create a personalized 4-week learning roadmap to help them improve on these weak areas.

    Return the response in ONLY the following JSON format without any additional notes or explanations:
    {
      "title": "Personalized Learning Roadmap",
      "summary": "A brief 1-2 sentence summary of what this roadmap covers",
      "weeks": [
        {
          "week": 1,
          "topic": "Main topic for this week",
          "description": "What the learner will focus on this week (2-3 sentences)",
          "tasks": [
            "Specific task or exercise 1",
            "Specific task or exercise 2",
            "Specific task or exercise 3"
          ],
          "resources": [
            {
              "title": "Resource name",
              "type": "Article" | "Video" | "Documentation" | "Tutorial" | "Practice",
              "url": "A real, working URL to a free resource (MDN, freeCodeCamp, YouTube, official docs, etc.)"
            }
          ]
        }
      ]
    }

    IMPORTANT:
    - Return ONLY valid JSON. No markdown, no backticks, no explanations.
    - Each week should build on the previous one (progressive difficulty).
    - Include exactly 4 weeks.
    - Include 2-3 tasks per week.
    - Include 2-3 free resources per week with real, working URLs.
    - Focus specifically on the knowledge gaps revealed by the wrong answers.
    - Make tasks practical and hands-on, not just reading.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const text = result.text.trim();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating skill roadmap:", error);
    throw new Error("Failed to generate learning roadmap. Please try again.");
  }
}

// ─── Behavioral (STAR) Practice ────────────────────────────────────────────────

export async function generateBehavioralQuestion() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true, skills: true, experience: true },
  });
  if (!user) throw new Error("User not found");

  const prompt = `
    Generate a single behavioral interview question for a ${user.industry} professional
    with ${user.experience || "a few"} years of experience.
    Behavioral questions ask candidates to describe past situations using the STAR method.
    Examples: "Tell me about a time you handled conflict", "Describe a project you led under pressure".
    Return ONLY this JSON, no extra text:
    {
      "question": "Behavioral interview question string",
      "category": "Leadership" | "Teamwork" | "Conflict Resolution" | "Problem Solving" | "Adaptability" | "Communication",
      "hint": "One-line tip reminding the candidate to use the STAR method for this question"
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const text = result.text.trim();
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
  } catch (error) {
    console.error("Error generating behavioral question:", error);
    throw new Error("Failed to generate question. Please try again.");
  }
}

export async function evaluateSTARAnswer(question, answer) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });
  if (!user) throw new Error("User not found");

  const prompt = `
    You are an expert interviewer for the ${user.industry} industry evaluating a behavioral answer using STAR.
    QUESTION: ${question}
    CANDIDATE'S ANSWER: ${answer}
    Evaluate: Situation (0-25), Task (0-25), Action (0-25), Result (0-25).
    Return ONLY this JSON, no extra text:
    {
      "overallScore": number (0-100),
      "starBreakdown": {
        "situation": { "score": number, "feedback": "string" },
        "task":      { "score": number, "feedback": "string" },
        "action":    { "score": number, "feedback": "string" },
        "result":    { "score": number, "feedback": "string" }
      },
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"],
      "improvedAnswer": "Rewritten answer that better follows STAR (150-200 words)",
      "overallFeedback": "2-sentence overall assessment"
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const text = result.text.trim();
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
  } catch (error) {
    console.error("Error evaluating STAR answer:", error);
    throw new Error("Failed to evaluate answer. Please try again.");
  }
}

// ─── Company Research Brief ─────────────────────────────────────────────────────

export async function generateCompanyBrief(companyName, jobTitle) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });
  if (!user) throw new Error("User not found");

  const prompt = `
    You are a career coach preparing a ${user.industry} candidate for an interview at ${companyName}
    for a ${jobTitle || "professional"} role.
    Generate a concise interview preparation brief.
    Return ONLY this JSON, no extra text:
    {
      "companyOverview": "2-3 sentence summary of what the company does and its market position",
      "culture": ["culture trait 1", "culture trait 2", "culture trait 3"],
      "interviewStyle": "2-3 sentences describing their typical interview process and style",
      "likelyQuestions": [
        "Likely interview question 1",
        "Likely interview question 2",
        "Likely interview question 3",
        "Likely interview question 4",
        "Likely interview question 5"
      ],
      "keyTopics": ["Topic to know 1", "Topic to know 2", "Topic to know 3"],
      "prepTips": ["Specific prep tip 1", "Specific prep tip 2", "Specific prep tip 3"],
      "redFlags": ["Common mistake to avoid 1", "Common mistake to avoid 2"]
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const text = result.text.trim();
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
  } catch (error) {
    console.error("Error generating company brief:", error);
    throw new Error("Failed to generate company brief. Please try again.");
  }
}

// ─── Interview Cheat Sheet from JD ─────────────────────────────────────────────

export async function generateInterviewCheatSheet(jobDescription) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true, skills: true, experience: true, bio: true },
  });
  if (!user) throw new Error("User not found");

  const prompt = `
    You are an expert career coach. Prepare a personalized interview cheat sheet.
    CANDIDATE PROFILE:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience || "not specified"}
    - Skills: ${user.skills?.join(", ") || "not specified"}
    - Background: ${user.bio || "not specified"}
    JOB DESCRIPTION:
    ${jobDescription}
    Generate 10 likely questions for this role with personalized answer frameworks from the candidate's profile.
    Return ONLY this JSON, no extra text:
    {
      "roleTitle": "Inferred job title",
      "questions": [
        {
          "question": "Interview question",
          "type": "Technical" | "Behavioral" | "Situational" | "Culture Fit",
          "answerFramework": ["Key point 1", "Key point 2", "Key point 3"],
          "personalizedTip": "Tip specific to the candidate's background"
        }
      ],
      "keySkillsToEmphasize": ["Matching skill 1", "Matching skill 2", "Matching skill 3"],
      "redFlags": ["Gap to address 1", "Gap to address 2"]
    }
    IMPORTANT: Return ONLY valid JSON. Answer frameworks must use the candidate's profile.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const text = result.text.trim();
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
  } catch (error) {
    console.error("Error generating cheat sheet:", error);
    throw new Error("Failed to generate cheat sheet. Please try again.");
  }
}

// ─── Profile-Based Skill Gap Roadmap ───────────────────────────────────────────

export async function generateProfileSkillRoadmap() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });
  if (!user) throw new Error("User not found");
  if (!user.industryInsight)
    throw new Error(
      "No industry data found. Visit your dashboard first to generate industry insights."
    );

  const recommendedSkills = user.industryInsight.recommendedSkills || [];
  const userSkills = user.skills || [];
  const missingSkills = recommendedSkills.filter(
    (s) => !userSkills.map((u) => u.toLowerCase()).includes(s.toLowerCase())
  );

  if (missingSkills.length === 0) {
    throw new Error(
      "You already have all the recommended skills for your industry. Great work!"
    );
  }

  const prompt = `
    You are a career development expert for the ${user.industry} industry.
    A professional with ${user.experience || "a few"} years of experience currently has:
    Skills: ${userSkills.join(", ") || "none listed"}
    Industry recommended skills: ${recommendedSkills.join(", ")}
    Missing skills: ${missingSkills.join(", ")}
    Create a personalized 4-week learning roadmap to close their skill gaps.
    Return ONLY this JSON, no extra text:
    {
      "title": "Your Personalized Skill Gap Roadmap",
      "summary": "1-2 sentence summary",
      "skillsAddressed": ["skill1", "skill2"],
      "weeks": [
        {
          "week": 1,
          "topic": "Main skill focus",
          "description": "What the learner will cover (2-3 sentences)",
          "tasks": ["Hands-on task 1", "Hands-on task 2"],
          "resources": [
            {
              "title": "Resource name",
              "type": "Article" | "Video" | "Documentation" | "Tutorial" | "Practice",
              "url": "Real free URL (MDN, freeCodeCamp, YouTube, official docs, Coursera free)"
            }
          ]
        }
      ]
    }
    IMPORTANT: Return ONLY valid JSON. Include exactly 4 weeks. Use real free resource URLs.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const text = result.text.trim();
    return JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
  } catch (error) {
    console.error("Error generating skill gap roadmap:", error);
    throw new Error("Failed to generate roadmap. Please try again.");
  }
}
