export type UserRole = 'candidate' | 'recruiter';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface ExtractedSkill {
  name: string;
  relevance: number;
  category: 'technical' | 'soft' | 'domain';
}

export interface ExtractedExperience {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
}

export interface ExtractedEducation {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  deadline: string;
  questions: string[];
  weights: {
    resume: number;
    behaviour: number;
  };
  applicants: Applicant[];
  createdAt: string;
  createdBy: string;
  requiredSkills?: string[];
}

export interface Applicant {
  id: string;
  name: string;
  userId: string;
  appliedAt: string;
  resumeName: string;
  resumeURL: string;
  resumeScore: number;
  behaviourScore: number;
  resumeInsights: string;
  behaviourInsights: string;
  status: 'Under Review' | 'Shortlisted' | 'Rejected';
  locked: boolean;
  behaviouralAnswers: string[];
  fitScore?: number;
  personalityTraits?: PersonalityTraits;
  extractedSkills?: ExtractedSkill[];
  extractedExperience?: ExtractedExperience[];
  extractedEducation?: ExtractedEducation[];
  matchExplanation?: string;
}

export interface ResumeAnalysis {
  matchScore: number;
  strengths: string[];
  improvements: string[];
  skills: string[];
  experience: string;
  education: string;
  extractedEntities?: {
    skills: ExtractedSkill[];
    experience: ExtractedExperience[];
    education: ExtractedEducation[];
  };
  matchExplanation?: string;
}

export interface ApplicationStats {
  applied: number;
  shortlisted: number;
  rejected: number;
}

export interface HiringMetrics {
  totalApplicants: number;
  shortlisted: number;
  rejected: number;
  underReview: number;
  averageTimeToHire: number;
  averageFitScore: number;
}

export interface SkillGapAnalysis {
  skill: string;
  required: number;
  available: number;
  gap: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateJobRequest {
  title: string;
  company: string;
  description: string;
  deadline: string;
  questions: string[];
  weights: {
    resume: number;
    behaviour: number;
  };
  requiredSkills?: string[];
}

export interface SubmitApplicationRequest {
  jobId: string;
  resumeFile: File;
  behaviouralAnswers: string[];
}
