import {
  Job,
  User,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  CreateJobRequest,
  ResumeAnalysis,
  Applicant,
} from '@/types';
import { mockJobs, generateResumeAnalysis, generateBehaviouralScores, generatePersonalityAnalysis, calculateFitScore } from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let jobs = [...mockJobs];

// ============= AUTH API =============

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await delay(800);
    if (!data.email || !data.password || !data.role) {
      return { success: false, message: 'Please fill all fields' };
    }
    if (data.password.length < 4) {
      return { success: false, message: 'Invalid credentials' };
    }
    const user: User = {
      id: crypto.randomUUID(),
      name: data.email.split('@')[0],
      email: data.email,
      role: data.role,
    };
    return { success: true, user, token: 'simulated_jwt_token_' + Date.now() };
  },

  signup: async (data: SignupRequest): Promise<LoginResponse> => {
    await delay(800);
    if (!data.name || !data.email || !data.password || !data.role) {
      return { success: false, message: 'Please fill all fields' };
    }
    if (data.password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters' };
    }
    return { success: true, message: 'Account created successfully' };
  },

  logout: async (): Promise<{ success: boolean }> => {
    await delay(300);
    return { success: true };
  },
};

// ============= JOBS API =============

export const jobsAPI = {
  getAll: async (): Promise<Job[]> => {
    await delay(500);
    return jobs;
  },

  create: async (data: CreateJobRequest, userId: string): Promise<Job> => {
    await delay(600);
    const newJob: Job = {
      id: crypto.randomUUID(),
      ...data,
      applicants: [],
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: userId,
    };
    jobs = [newJob, ...jobs];
    return newJob;
  },

  getById: async (id: string): Promise<Job | null> => {
    await delay(300);
    return jobs.find(j => j.id === id) || null;
  },

  delete: async (id: string): Promise<boolean> => {
    await delay(400);
    jobs = jobs.filter(j => j.id !== id);
    return true;
  },
};

// ============= APPLICATIONS API =============

export const applicationsAPI = {
  submit: async (
    jobId: string,
    userId: string,
    userName: string,
    resumeFile: File,
    behaviouralAnswers: string[]
  ): Promise<{ success: boolean; applicant: Applicant }> => {
    await delay(1000);

    const job = jobs.find(j => j.id === jobId);
    const { score: behaviourScore, insights: behaviourInsights } = generateBehaviouralScores();
    const resumeAnalysis = generateResumeAnalysis();
    const personalityTraits = generatePersonalityAnalysis();

    const resumeWeight = job?.weights.resume || 50;
    const behaviourWeight = job?.weights.behaviour || 20;
    const fitScore = calculateFitScore(resumeAnalysis.matchScore, behaviourScore, resumeWeight, behaviourWeight);

    const applicant: Applicant = {
      id: crypto.randomUUID(),
      name: userName,
      userId,
      appliedAt: new Date().toLocaleString(),
      resumeName: resumeFile.name,
      resumeURL: URL.createObjectURL(resumeFile),
      resumeScore: resumeAnalysis.matchScore,
      behaviourScore,
      fitScore,
      resumeInsights: resumeAnalysis.strengths.join(', '),
      behaviourInsights,
      status: 'Under Review',
      locked: false,
      behaviouralAnswers,
      personalityTraits,
      extractedSkills: resumeAnalysis.extractedEntities?.skills,
      extractedExperience: resumeAnalysis.extractedEntities?.experience,
      extractedEducation: resumeAnalysis.extractedEntities?.education,
      matchExplanation: resumeAnalysis.matchExplanation,
    };

    const jobIndex = jobs.findIndex(j => j.id === jobId);
    if (jobIndex !== -1) {
      jobs[jobIndex].applicants.push(applicant);
    }

    return { success: true, applicant };
  },

  getMyApplications: async (userId: string): Promise<{ job: Job; applicant: Applicant }[]> => {
    await delay(400);
    const applications: { job: Job; applicant: Applicant }[] = [];
    jobs.forEach(job => {
      const applicant = job.applicants.find(a => a.userId === userId);
      if (applicant) {
        applications.push({ job, applicant });
      }
    });
    return applications;
  },

  updateStatus: async (
    jobId: string,
    applicantId: string,
    status: 'Shortlisted' | 'Rejected'
  ): Promise<boolean> => {
    await delay(400);
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const applicant = job.applicants.find(a => a.id === applicantId);
      if (applicant) {
        applicant.status = status;
        applicant.locked = true;
        return true;
      }
    }
    return false;
  },

  unlockDecision: async (jobId: string, applicantId: string): Promise<boolean> => {
    await delay(300);
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const applicant = job.applicants.find(a => a.id === applicantId);
      if (applicant) {
        applicant.locked = false;
        return true;
      }
    }
    return false;
  },
};

// ============= AI/ML API =============

export const aiAPI = {
  parseResume: async (_file: File): Promise<ResumeAnalysis> => {
    await delay(1500);
    return generateResumeAnalysis();
  },

  generateQuestions: async (_jobDescription: string): Promise<string[]> => {
    await delay(1000);
    return [
      'Tell us about a challenging situation you handled at work.',
      'How do you handle pressure and tight deadlines?',
      'Describe a failure and what you learned from it.',
    ];
  },
};
