"use client";

import { useState, useCallback, useEffect } from "react";
import { usePerformanceAnalysis } from "./use-performance-analysis";
import { useMonitorAnalysis } from "./use-monitor-analysis";
import { useSslAnalysis } from "./use-ssl-analysis";
import { useDnsAnalysis } from "./use-dns-analysis";
import { useSitemapAnalysis } from "./use-sitemap-analysis";
import { useApiAnalysis } from "./use-api-analysis";
import { useLinksAnalysis } from "./use-links-analysis";
import { useTypographyAnalysis } from "./use-typography-analysis";

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

export function useAnalysisOrchestrator() {
  const [state, setState] = useState<OrchestratorState>({
    url: '',
    isRunning: false,
    currentAnalysis: null,
    currentIndex: -1,
    startTime: null,
    endTime: null,
    analyses: initializeAnalyses()
  });

  // Initialize all analysis hooks
  const performanceHook = usePerformanceAnalysis({ autoRun: false });
  const monitorHook = useMonitorAnalysis({ autoRun: false });
  const sslHook = useSslAnalysis({ autoRun: false });
  const dnsHook = useDnsAnalysis({ autoRun: false });
  const sitemapHook = useSitemapAnalysis({ autoRun: false });
  const apiHook = useApiAnalysis({ autoRun: false });
  const linksHook = useLinksAnalysis({ autoRun: false });
  const typographyHook = useTypographyAnalysis({ autoRun: false });

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

  // Run single analysis
  const runSingleAnalysis = useCallback(async (
    type: AnalysisType,
    url: string
  ): Promise<void> => {
    const startTime = Date.now();
    
    // Set to running
    updateAnalysisState(type, {
      state: 'running',
      startTime,
      progress: 0
    });

    try {
      let result;
      
      // Set URL and run analysis based on type
      switch (type) {
        case 'performance':
          performanceHook.setUrl(url);
          await performanceHook.analyzeWebsite();
          result = performanceHook.data;
          break;
          
        case 'monitor':
          monitorHook.setUrl(url);
          await monitorHook.handleMonitor();
          result = monitorHook.monitorData;
          break;
          
        case 'ssl':
          sslHook.setUrl(url);
          await sslHook.handleCheck();
          result = sslHook.sslData;
          break;
          
        case 'dns':
          dnsHook.setDomain(url);
          await dnsHook.handleCheck();
          result = dnsHook.dnsData;
          break;
          
        case 'sitemap':
          sitemapHook.setUrl(url);
          await sitemapHook.runAnalysis();
          result = sitemapHook.sitemap;
          break;
          
        case 'api':
          apiHook.setDomain(url);
          await apiHook.runTests();
          result = apiHook.results;
          break;
          
        case 'links':
          linksHook.setDomain(url);
          await linksHook.runLinkCheck();
          result = linksHook.results;
          break;
          
        case 'typography':
          typographyHook.setUrl(url);
          await typographyHook.runAnalysis();
          result = typographyHook.typographyData;
          break;
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
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Set to error
      updateAnalysisState(type, {
        state: 'error',
        endTime,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });
    }
  }, [
    performanceHook,
    monitorHook,
    sslHook,
    dnsHook,
    sitemapHook,
    apiHook,
    linksHook,
    typographyHook,
    updateAnalysisState
  ]);

  // Start sequential analysis
  const startAnalysis = useCallback(async (url: string) => {
    // Clean URL
    const cleanUrl = url.trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');

    if (!cleanUrl) {
      return;
    }

    // Initialize state
    setState({
      url: cleanUrl,
      isRunning: true,
      currentAnalysis: null,
      currentIndex: -1,
      startTime: Date.now(),
      endTime: null,
      analyses: initializeAnalyses()
    });

    // Run analyses sequentially
    for (let i = 0; i < ANALYSIS_SEQUENCE.length; i++) {
      const type = ANALYSIS_SEQUENCE[i];
      
      setState(prev => ({
        ...prev,
        currentAnalysis: type,
        currentIndex: i
      }));

      await runSingleAnalysis(type, cleanUrl);
    }

    // Complete
    setState(prev => ({
      ...prev,
      isRunning: false,
      currentAnalysis: null,
      endTime: Date.now()
    }));
  }, [runSingleAnalysis]);

  // Clear results
  const clearResults = useCallback(() => {
    setState({
      url: '',
      isRunning: false,
      currentAnalysis: null,
      currentIndex: -1,
      startTime: null,
      endTime: null,
      analyses: initializeAnalyses()
    });
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
    clearResults,
    getStats,
    isTabEnabled,
    getTabBadge,
    analysisNames: ANALYSIS_NAMES,
    analysisSequence: ANALYSIS_SEQUENCE
  };
}

