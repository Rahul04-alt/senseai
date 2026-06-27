"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeJobFit(jobDescription) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      resume: true,
    },
  });

  if (!user) throw new Error("User not found");

  if (!user.resume) {
    throw new Error(
      "No resume found. Please create your resume first before using the ATS Analyzer."
    );
  }

  const prompt = `
    You are an expert ATS (Applicant Tracking System) analyzer and career coach.
    
    Compare the following resume against the job description and provide a detailed analysis.

    RESUME:
    ${user.resume.content}

    JOB DESCRIPTION:
    ${jobDescription}

    Provide your analysis in ONLY the following JSON format without any additional notes, markdown formatting, or explanations:
    {
      "overallScore": number (0-100, representing how well the resume matches the job),
      "matchBreakdown": {
        "skills": number (0-100),
        "experience": number (0-100),
        "education": number (0-100),
        "keywords": number (0-100)
      },
      "matchedKeywords": ["keyword1", "keyword2"],
      "missingKeywords": ["keyword1", "keyword2"],
      "strongPoints": ["point1", "point2"],
      "improvements": [
        {
          "area": "string describing what to improve",
          "suggestion": "string with specific actionable suggestion",
          "priority": "High" | "Medium" | "Low"
        }
      ],
      "suggestedBulletPoints": [
        "Optimized resume bullet point 1 tailored to this job",
        "Optimized resume bullet point 2 tailored to this job",
        "Optimized resume bullet point 3 tailored to this job"
      ]
    }

    IMPORTANT:
    - Return ONLY valid JSON. No markdown, no backticks, no explanations.
    - Include at least 5 matched keywords and 5 missing keywords.
    - Include at least 3 strong points and 3 improvements.
    - Include at least 3 suggested bullet points tailored to the job.
    - Be honest and realistic with the score.
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
    console.error("Error analyzing job fit:", error.message);
    throw new Error("Failed to analyze job fit. Please try again.");
  }
}

export async function generateOutreachMessages(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    You are an expert networking and career coach. Generate professional outreach messages for the following scenario:

    About the sender:
    - Name: ${user.name || "the candidate"}
    - Industry: ${user.industry || "technology"}
    - Years of Experience: ${user.experience || "several"}
    - Skills: ${user.skills?.join(", ") || "various professional skills"}
    
    Target:
    - Company: ${data.companyName}
    - Job Title they're applying for: ${data.jobTitle}
    - Contact Person's Role: ${data.contactRole}
    ${data.additionalContext ? `- Additional Context: ${data.additionalContext}` : ""}

    Generate outreach messages in ONLY the following JSON format without any additional notes or explanations:
    {
      "linkedInConnectionRequest": "A concise LinkedIn connection request message (max 200 characters). Professional but warm. Must include why you're reaching out.",
      "formalEmail": {
        "subject": "Email subject line",
        "body": "A professional email body (150-250 words). Include a clear call-to-action. Use proper email formatting with paragraphs."
      },
      "casualMessage": "A warm, casual networking message (80-120 words) suitable for LinkedIn DM or informal outreach. Friendly but professional tone. Include a specific question or conversation starter."
    }

    IMPORTANT:
    - Return ONLY valid JSON. No markdown, no backticks, no explanations.
    - Make each message sound authentic and personalized, not templated.
    - Reference the specific company and role naturally.
    - Include the sender's relevant background where appropriate.
    - The LinkedIn connection request MUST be under 200 characters.
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
    console.error("Error generating outreach messages:", error.message);
    throw new Error("Failed to generate outreach messages. Please try again.");
  }
}
