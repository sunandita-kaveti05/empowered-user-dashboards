import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Job, CreateJobRequest } from '@/types';
import { jobsAPI } from '@/lib/api';
import { useAuth } from './AuthContext';

interface JobContextType {
  jobs: Job[];
  isLoading: boolean;
  refreshJobs: () => Promise<void>;
  createJob: (data: CreateJobRequest) => Promise<Job>;
  getJobById: (id: string) => Job | undefined;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const refreshJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await jobsAPI.getAll();
      setJobs(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createJob = useCallback(async (data: CreateJobRequest) => {
    if (!user) throw new Error('Not authenticated');
    const newJob = await jobsAPI.create(data, user.id);
    setJobs(prev => [newJob, ...prev]);
    return newJob;
  }, [user]);

  const getJobById = useCallback((id: string) => {
    return jobs.find(j => j.id === id);
  }, [jobs]);

  useEffect(() => {
    if (user) {
      refreshJobs();
    }
  }, [user, refreshJobs]);

  return (
    <JobContext.Provider value={{ jobs, isLoading, refreshJobs, createJob, getJobById }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
}
