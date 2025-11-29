"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { captureEvent } from "@/lib/posthog";

export type AnalysisState = 'pending' | 'running' | 'success' | 'error';

export interface AnalysisStatus {
  state: AnalysisState;
  startTime: number | null;
  endTime: number | null;
  duration: number | null;
  data: any | null;
  error: any | null;
  progress: number; // 0-100
}

export type AnalysisType = 
  | 'performance' 
  | 'monitor' 
  | 'ssl' 
  | 'dns' 
  | 'sitemap' 
  | 'api' 
  | 'links' 
  | 'typography';

export interface OrchestratorState {
  url: string;
  isRunning: boolean;
  currentAnalysis: AnalysisType | null;
  currentIndex: number;
  startTime: number | null;
  endTime: number | null;
  runSequence: number;
  currentRunId: number | null;
  lastCompletedRunId: number | null;
  analyses: Record<AnalysisType, AnalysisStatus>;
}

const ANALYSIS_SEQUENCE: AnalysisType[] = [
  'performance',
  'monitor',
  'ssl',
  'dns',
  'sitemap',
  'api',
  'links',
  'typography'
];

// Analyses to skip (not working yet)
const SKIP_ANALYSES: AnalysisType[] = []; // Empty - all analyses enabled when selected

const ANALYSIS_NAMES: Record<AnalysisType, string> = {
  performance: 'Performance',
  monitor: 'Monitor',
  ssl: 'SSL',
  dns: 'DNS',
  sitemap: 'Sitemap',
  api: 'API',
  links: 'Links',
  typography: 'Typography'
};

// API endpoint mapping
const API_ENDPOINTS: Record<AnalysisType, string> = {
  performance: '/api/analyze',
  monitor: '/api/monitor',
  ssl: '/api/ssl',
  dns: '/api/dns',
  sitemap: '/api/sitemap',  // Next.js wrapper (forwards to Django)
  api: '/api/ai-analyze',  // Fixed: was /api/api-analyze
  links: '/api/links',
  typography: '/api/typography'
};

function initializeAnalyses(): Record<AnalysisType, AnalysisStatus> {
  const analyses = {} as Record<AnalysisType, AnalysisStatus>;
  
  ANALYSIS_SEQUENCE.forEach(type => {
    analyses[type] = {
      state: 'pending',
      startTime: null,
      endTime: null,
      duration: null,
      data: null,
      error: null,
      progress: 0
    };
  });
  
  return analyses;
}

const STORAGE_KEY = 'pagerodeo_analysis_state';
const STORAGE_EXPIRY = 60 * 60 * 1000; // 1 hour

export function useAnalysisOrchestrator() {
  // Initialize state from localStorage if available
  const getInitialState = (): OrchestratorState => {
    if (typeof window === 'undefined') {
      return {
        url: '',
        isRunning: false,
        currentAnalysis: null,
        currentIndex: -1,
        startTime: null,
        endTime: null,
        runSequence: 0,
        currentRunId: null,
        lastCompletedRunId: null,
        analyses: initializeAnalyses()
      };
    }

    try {
      // Check if user is logged in (has access_token)
      const accessToken = localStorage.getItem('access_token');
      
      // If no token, user is logged out - clear data
      if (!accessToken) {
        console.log('[Orchestrator] No access_token - user logged out, clearing state');
        localStorage.removeItem(STORAGE_KEY);
        const restoredState: OrchestratorState = {
          url: '',
          isRunning: false,
          currentAnalysis: null,
          currentIndex: -1,
          startTime: null,
          endTime: null,
          runSequence: 0,
          currentRunId: null,
          lastCompletedRunId: null,
          analyses: initializeAnalyses()
        };
        return restoredState;
      }
      
      // User is logged in - restore their data
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Check if expired (1 hour)
        if (parsed.timestamp && Date.now() - parsed.timestamp < STORAGE_EXPIRY) {
          console.log('[Orchestrator] Restored state for logged-in user');
          const restoredState: OrchestratorState = {
            ...parsed.state,
            isRunning: false,  // Never restore as running
            currentAnalysis: null,
            // Clear URL to prevent auto-running old reports
            url: ''
          };
          return {
            ...restoredState,
            runSequence: restoredState.runSequence ?? 0,
            currentRunId: restoredState.currentRunId ?? null,
            lastCompletedRunId: restoredState.lastCompletedRunId ?? null,
            analyses: restoredState.analyses ?? initializeAnalyses()
          };
        } else {
          console.log('[Orchestrator] Stored state expired, clearing');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('[Orchestrator] Failed to restore state:', e);
    }

    return {
      url: '',
      isRunning: false,
      currentAnalysis: null,
      currentIndex: -1,
      startTime: null,
      endTime: null,
      runSequence: 0,
      currentRunId: null,
      lastCompletedRunId: null,
      analyses: initializeAnalyses()
    };
  };

  const [state, setState] = useState<OrchestratorState>(() => {
    const initialState = getInitialState();
    console.log('[Orchestrator] Initial state on mount:', initialState);
    return initialState;
  });

  // Ref to track if user requested to stop analysis
  const stopRequested = useRef(false);
  // Ref to store auditReportId so it's always available when saving
  const auditReportIdRef = useRef<string | null>(null);

  // Watch for logout (access_token removal) and clear data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkLogout = () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken && state.url) {
        // User logged out - clear orchestrator data
        console.log('[Orchestrator] Logout detected - clearing state');
        setState({
          url: '',
          isRunning: false,
          currentAnalysis: null,
          currentIndex: -1,
          startTime: null,
          endTime: null,
          analyses: initializeAnalyses(),
          runSequence: 0,
          currentRunId: null,
          lastCompletedRunId: null
        });
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    
    // Check on mount and listen for storage changes
    checkLogout();
    window.addEventListener('storage', checkLogout);
    
    // Also check periodically (storage event doesn't fire in same tab)
    const interval = setInterval(checkLogout, 1000);
    
    return () => {
      window.removeEventListener('storage', checkLogout);
      clearInterval(interval);
    };
  }, [state.url]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && state.url) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          state,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('[Orchestrator] Failed to save state:', e);
      }
    }
  }, [state]);

  // Update analysis state
  const updateAnalysisState = useCallback((
    type: AnalysisType,
    updates: Partial<AnalysisStatus>
  ) => {
    setState(prev => ({
      ...prev,
      analyses: {
        ...prev.analyses,
        [type]: {
          ...prev.analyses[type],
          ...updates
        }
      }
    }));
  }, []);

  // Run single analysis via API
  const runSingleAnalysis = async (
    type: AnalysisType,
    url: string,
    currentState: OrchestratorState
  ): Promise<void> => {
    const startTime = Date.now();
    
    // Set to running
    updateAnalysisState(type, {
      state: 'running',
      startTime,
      progress: 0
    });

    try {
      const endpoint = API_ENDPOINTS[type];
      
      // Prepare request body based on what each API expects
      const requestBody: any = {};
      switch (type) {
        case 'performance':
        case 'monitor':
        case 'links':
          requestBody.url = url;
          break;
        case 'ssl':
        case 'dns':
        case 'typography':
          requestBody.domain = url;
          break;
        case 'sitemap':
          // Sitemap needs full URL with scheme
          requestBody.url = `https://${url}`;
          break;
        case 'api':
          // AI analyze needs performance data - get from previous analysis
          const perfData = currentState.analyses.performance.data;
          if (!perfData) {
            // Skip AI analysis if no performance data available
            throw new Error('Performance analysis must complete first');
          }
          requestBody.prompt = `Analyze the performance data for ${url} and provide recommendations`;
          requestBody.performanceData = perfData;
          break;
      }

      console.log(`[Orchestrator] Starting ${type} analysis for ${url}`);
      console.log(`[Orchestrator] Endpoint: ${endpoint}`);
      console.log(`[Orchestrator] Request body:`, requestBody);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log(`[Orchestrator] ${type} response status:`, response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        const error: any = new Error(errorData.error || `HTTP ${response.status}`);
        error.response = { status: response.status };
        throw error;
      }

      const result = await response.json();
      console.log(`[Orchestrator] ${type} response data:`, result);
      
      // Check if response contains an error field (even with 200 status)
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Check for DNS_NOT_FOUND error code (API returns 200 but with error code)
      if (result.code === 'DNS_NOT_FOUND') {
        throw new Error(result.message || `Domain ${url} cannot be resolved`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Set to success
      updateAnalysisState(type, {
        state: 'success',
        endTime,
        duration,
        data: result,
        progress: 100
      });
      
      // Track analysis completed
      captureEvent('audit_analysis_completed', {
        analysis_type: type,
        url: url,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      });
      
      console.log(`[Orchestrator] ${type} completed successfully in ${duration}ms`);
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Set to error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateAnalysisState(type, {
        state: 'error',
        endTime,
        duration,
        error: errorMessage,
        progress: 0
      });

      // Track analysis error
      captureEvent('audit_analysis_error', {
        analysis_type: type,
        url: url,
        error: errorMessage,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      });

      // Error already displayed in UI - no need to log
    }
  };

  // Start sequential analysis
  const startAnalysis = useCallback(async (url: string, selectedServices?: string[], auditReportId?: string | null) => {
    // Store auditReportId in ref so it's available when saving
    if (auditReportId) {
      auditReportIdRef.current = auditReportId;
      console.log(`[Orchestrator] Stored auditReportId in ref: ${auditReportId}`);
    }
    
    // Clean URL
    const cleanUrl = url.trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .toLowerCase();

    if (!cleanUrl) {
      return;
    }

    // Validate URL format
    if (cleanUrl.length < 4 || !cleanUrl.includes('.')) {
      return;
    }
    
    // Filter to only run selected services
    const servicesToRun = selectedServices 
      ? ANALYSIS_SEQUENCE.filter(type => selectedServices.includes(type))
      : ANALYSIS_SEQUENCE;
    
    console.log('[Orchestrator] Selected services to run:', servicesToRun);

    // Check if already running (with timeout protection)
    if (state.isRunning) {
      // If stuck running for more than 5 minutes, force reset
      if (state.startTime && Date.now() - state.startTime > 5 * 60 * 1000) {
        console.warn('[Orchestrator] Analysis stuck, forcing reset');
        setState(prev => ({ ...prev, isRunning: false, currentAnalysis: null, currentRunId: null }));
      } else {
        console.warn('[Orchestrator] Blocked: Analysis already in progress');
        return;
      }
    }

    console.log(`[Orchestrator] Starting new analysis for: ${cleanUrl}`);

    // Track audit orchestration started
    captureEvent('audit_orchestration_started', {
      url: cleanUrl,
      services: servicesToRun,
      service_count: servicesToRun.length,
      timestamp: new Date().toISOString(),
    });

    // Reset stop flag
    stopRequested.current = false;

    const nextRunId = (state.runSequence ?? 0) + 1;

    // Initialize state
    const initialState: OrchestratorState = {
      url: cleanUrl,
      isRunning: true,
      currentAnalysis: null,
      currentIndex: -1,
      startTime: Date.now(),
      endTime: null,
      runSequence: nextRunId,
      currentRunId: nextRunId,
      lastCompletedRunId: state.lastCompletedRunId ?? null,
      analyses: initializeAnalyses()
    };
    
    setState(initialState);

    // Run analyses sequentially
    let currentStateSnapshot = initialState;
    
    for (let i = 0; i < servicesToRun.length; i++) {
      // Check if user requested to stop
      if (stopRequested.current) {
        console.log('[Orchestrator] Analysis stopped by user');
        break;
      }

      const type = servicesToRun[i];
      
      // Skip analyses that are not working
      if (SKIP_ANALYSES.includes(type)) {
        console.log(`[Orchestrator] Skipping ${type} analysis (feature disabled)`);
        continue;
      }
      
      // Update current analysis
      setState(prev => {
        currentStateSnapshot = {
          ...prev,
          currentAnalysis: type,
          currentIndex: i
        };
        return currentStateSnapshot;
      });

      // Run the analysis with current state snapshot
      await runSingleAnalysis(type, cleanUrl, currentStateSnapshot);
    }

    // Complete - calculate stats from final state
    const finalState = currentStateSnapshot;
    const endTime = Date.now();
    const startTime = initialState.startTime || Date.now();
    const totalDuration = endTime - startTime;
    
    // Count successful and failed analyses
    const successfulAnalyses = servicesToRun.filter(type => 
      finalState.analyses[type]?.state === 'success'
    ).length;
    const failedAnalyses = servicesToRun.filter(type => 
      finalState.analyses[type]?.state === 'error'
    ).length;
    
    // Track audit orchestration completed
    captureEvent('audit_orchestration_completed', {
      url: cleanUrl,
      services: servicesToRun,
      total_services: servicesToRun.length,
      successful_analyses: successfulAnalyses,
      failed_analyses: failedAnalyses,
      total_duration_ms: totalDuration,
      timestamp: new Date().toISOString(),
    });

    // Complete
    setState(prev => ({
      ...prev,
      isRunning: false,
      currentAnalysis: null,
      endTime: endTime,
      lastCompletedRunId: prev.currentRunId ?? prev.lastCompletedRunId ?? null,
      currentRunId: null
    }));

    // Analysis results are stored in orchestrator state and localStorage
    // Background save to database is triggered by site-audit-main.tsx useEffect
    // This allows UI to display results immediately while data saves in background
    console.log(`[Orchestrator] All analyses complete. Results stored in state/localStorage. Background save will be triggered.`);
  }, []);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    console.log('[Orchestrator] Stop requested by user');
    stopRequested.current = true;
    
    // Update state to reflect stopped status
    setState(prev => ({
      ...prev,
      isRunning: false,
      currentAnalysis: null,
      endTime: Date.now(),
      currentRunId: null
    }));
  }, []);

  // Clear results
  const clearResults = useCallback(() => {
    setState(prev => ({
      url: '',
      isRunning: false,
      currentAnalysis: null,
      currentIndex: -1,
      startTime: null,
      endTime: null,
      runSequence: prev.runSequence ?? 0,
      currentRunId: null,
      lastCompletedRunId: prev.lastCompletedRunId ?? null,
      analyses: initializeAnalyses()
    }));
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[Orchestrator] Cleared results from localStorage');
    }
  }, []);

  // Get summary stats
  const getStats = useCallback(() => {
    const total = ANALYSIS_SEQUENCE.length;
    const completed = Object.values(state.analyses).filter(
      a => a.state === 'success' || a.state === 'error'
    ).length;
    const success = Object.values(state.analyses).filter(
      a => a.state === 'success'
    ).length;
    const failed = Object.values(state.analyses).filter(
      a => a.state === 'error'
    ).length;
    const totalDuration = state.endTime && state.startTime 
      ? state.endTime - state.startTime 
      : null;

    return {
      total,
      completed,
      success,
      failed,
      totalDuration
    };
  }, [state]);

  // Check if tab should be enabled
  const isTabEnabled = useCallback((type: AnalysisType): boolean => {
    const status = state.analyses[type];
    return status.state === 'success' || status.state === 'error';
  }, [state.analyses]);

  // Get tab badge
  const getTabBadge = useCallback((type: AnalysisType): string => {
    const status = state.analyses[type];
    switch (status.state) {
      case 'pending': return '⏸️';
      case 'running': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '';
    }
  }, [state.analyses]);

  return {
    state,
    startAnalysis,
    stopAnalysis,
    clearResults,
    getStats,
    isTabEnabled,
    getTabBadge,
    analysisNames: ANALYSIS_NAMES,
    analysisSequence: ANALYSIS_SEQUENCE
  };
}

