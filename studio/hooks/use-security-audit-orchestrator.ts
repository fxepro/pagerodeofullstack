"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getApiBaseUrl } from "@/lib/api-config";
import axios from "axios";

export type SecurityScanState = 'pending' | 'running' | 'completed' | 'failed';

export interface SecurityScanStatus {
  scan_id: number;
  scan_type: string;
  category: string; // Consumer-friendly category name
  state: SecurityScanState;
  startTime: number | null;
  endTime: number | null;
  duration: number | null;
  findings_count: number;
  error: any | null;
  progress: number; // 0-100
}

// Scan type to consumer-friendly category mapping
export const SCAN_CATEGORY_MAP: Record<string, string> = {
  'dns_discovery': 'attack_surface',
  'port_scan': 'network_analysis',
  'vulnerability_scan': 'vulnerability_assessment',
  'dast': 'vulnerability_assessment',
  'misconfiguration_scan': 'configuration_analysis',
  'ssl_check': 'configuration_analysis',
  'headers_check': 'configuration_analysis',
  'sql_injection': 'exploit_testing',
  'cms_scan': 'vulnerability_assessment',
  'continuous_monitoring': 'network_analysis',
  'manual_pentest': 'exploit_testing',
};

// Consumer-friendly category names (no tool names)
export const CATEGORY_NAMES: Record<string, string> = {
  'attack_surface': 'Attack Surface Discovery',
  'network_analysis': 'Network Analysis',
  'vulnerability_assessment': 'Vulnerability Assessment',
  'configuration_analysis': 'Configuration Analysis',
  'exploit_testing': 'Exploit Testing',
};

export interface SecurityAuditState {
  audit_id: number | null;
  target_url: string;
  isRunning: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number | null;
  endTime: number | null;
  scans: Record<string, SecurityScanStatus>; // Keyed by scan_type
  scans_by_category: Record<string, SecurityScanStatus[]>; // Grouped by category
  findings_by_category: Record<string, any[]>; // Findings grouped by category
  total_scans: number;
  completed_scans: number;
  failed_scans: number;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
}

const STORAGE_KEY = 'pagerodeo_security_audit_state';
const STORAGE_EXPIRY = 60 * 60 * 1000; // 1 hour

function initializeScans(): Record<string, SecurityScanStatus> {
  return {};
}

export function useSecurityAuditOrchestrator() {
  const getInitialState = (): SecurityAuditState => {
    if (typeof window === 'undefined') {
      return {
        audit_id: null,
        target_url: '',
        isRunning: false,
        status: 'pending',
        startTime: null,
        endTime: null,
        scans: {},
        scans_by_category: {},
        total_scans: 0,
        completed_scans: 0,
        failed_scans: 0,
        total_findings: 0,
        critical_findings: 0,
        high_findings: 0,
        medium_findings: 0,
        low_findings: 0,
      };
    }

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        localStorage.removeItem(STORAGE_KEY);
        return {
          audit_id: null,
          target_url: '',
          isRunning: false,
          status: 'pending',
          startTime: null,
          endTime: null,
          scans: {},
          scans_by_category: {},
          total_scans: 0,
          completed_scans: 0,
          failed_scans: 0,
          total_findings: 0,
          critical_findings: 0,
          high_findings: 0,
          medium_findings: 0,
          low_findings: 0,
        };
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.timestamp && Date.now() - parsed.timestamp < STORAGE_EXPIRY) {
          return {
            ...parsed.state,
            isRunning: false, // Never restore as running
          };
        }
      }
    } catch (e) {
      console.warn('[SecurityAuditOrchestrator] Failed to restore state:', e);
    }

    return {
      audit_id: null,
      target_url: '',
      isRunning: false,
      status: 'pending',
      startTime: null,
      endTime: null,
      scans: {},
      scans_by_category: {},
      total_scans: 0,
      completed_scans: 0,
      failed_scans: 0,
      total_findings: 0,
      critical_findings: 0,
      high_findings: 0,
      medium_findings: 0,
      low_findings: 0,
    };
  };

  const [state, setState] = useState<SecurityAuditState>(getInitialState);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && state.target_url) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          state,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('[SecurityAuditOrchestrator] Failed to save state:', e);
      }
    }
  }, [state]);

  // Token refresh helper (defined with useCallback to ensure it's available)
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        return null;
      }

      const apiBase = getApiBaseUrl();
      const response = await axios.post(
        `${apiBase}/api/auth/token/refresh/`,
        { refresh: refreshToken }
      );

      if (response.data?.access) {
        localStorage.setItem("access_token", response.data.access);
        return response.data.access;
      }
      return null;
    } catch (error) {
      console.error("[SecurityAuditOrchestrator] Token refresh failed:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return null;
    }
  }, []);

  // Authenticated request helper with token refresh
  const makeAuthenticatedRequest = useCallback(async (url: string): Promise<any> => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("No access token available");
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (err: any) {
      // If 401, try to refresh token and retry
      if (err.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await axios.get(url, config);
          return retryResponse.data;
        }
        // Refresh failed, clear tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        throw err;
      }
      throw err;
    }
  }, [refreshAccessToken]);

  // Poll audit status when running
  useEffect(() => {
    if (state.isRunning && state.audit_id) {
      const pollAuditStatus = async () => {
        try {
          const apiBase = getApiBaseUrl();
          const data = await makeAuthenticatedRequest(
            `${apiBase}/api/security/audit/${state.audit_id}/`
          );

          const audit = data.audit;
          const scans = data.scans || [];
          const findings_by_category = data.findings_by_category || {};

            // Update scan statuses
            const updatedScans: Record<string, SecurityScanStatus> = {};
            const scansByCategory: Record<string, SecurityScanStatus[]> = {};

            scans.forEach((scan: any) => {
              const category = SCAN_CATEGORY_MAP[scan.scan_type] || 'other';
              const scanStatus: SecurityScanStatus = {
                scan_id: scan.id,
                scan_type: scan.scan_type,
                category,
                state: scan.status === 'completed' ? 'completed' : 
                       scan.status === 'failed' ? 'failed' :
                       scan.status === 'running' ? 'running' : 'pending',
                startTime: scan.started_at ? new Date(scan.started_at).getTime() : null,
                endTime: scan.completed_at ? new Date(scan.completed_at).getTime() : null,
                duration: scan.started_at && scan.completed_at 
                  ? new Date(scan.completed_at).getTime() - new Date(scan.started_at).getTime()
                  : null,
                findings_count: scan.findings_count || 0,
                error: scan.status === 'failed' ? 'Scan failed' : null,
                progress: scan.status === 'completed' ? 100 : 
                         scan.status === 'failed' ? 0 :
                         scan.status === 'running' ? 50 : 0,
              };

              updatedScans[scan.scan_type] = scanStatus;

              if (!scansByCategory[category]) {
                scansByCategory[category] = [];
              }
              scansByCategory[category].push(scanStatus);
            });

            const isCompleted = audit.status === 'completed';
            const isFailed = audit.status === 'failed';

            setState(prev => ({
              ...prev,
              status: audit.status,
              isRunning: !isCompleted && !isFailed,
              endTime: audit.completed_at ? new Date(audit.completed_at).getTime() : prev.endTime,
              scans: updatedScans,
              scans_by_category: scansByCategory,
              findings_by_category: findings_by_category || {},
              total_scans: audit.total_scans || 0,
              completed_scans: audit.completed_scans || 0,
              failed_scans: audit.failed_scans || 0,
              total_findings: audit.total_findings || 0,
              critical_findings: audit.critical_findings || 0,
              high_findings: audit.high_findings || 0,
              medium_findings: audit.medium_findings || 0,
              low_findings: audit.low_findings || 0,
            }));

            // Stop polling if completed or failed
            if (isCompleted || isFailed) {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            }
        } catch (error) {
          console.error('[SecurityAuditOrchestrator] Error polling audit status:', error);
        }
      };

      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(pollAuditStatus, 2000);
      pollAuditStatus(); // Initial poll

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [state.isRunning, state.audit_id]);

  const startAudit = useCallback(async (url: string) => {
      try {
        const apiBase = getApiBaseUrl();
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No access token found");
        }

        // Create audit with token refresh support
        const createAuditRequest = async (authToken: string) => {
          return await axios.post(
            `${apiBase}/api/security/audit/`,
            {
              target_url: url,
              scan_types: ['all'] // Run all available scans
            },
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
              },
            }
          );
        };

        let response;
        try {
          response = await createAuditRequest(token);
        } catch (err: any) {
          // If 401, try to refresh token and retry
          if (err.response?.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              response = await createAuditRequest(newToken);
            } else {
              throw new Error("Authentication failed");
            }
          } else {
            throw err;
          }
        }

        const data = response.data;
      const audit = data.audit;
      const scans = data.scans || [];

      // Initialize scan statuses
      const initialScans: Record<string, SecurityScanStatus> = {};
      const scansByCategory: Record<string, SecurityScanStatus[]> = {};

      scans.forEach((scan: any) => {
        const category = SCAN_CATEGORY_MAP[scan.scan_type] || 'other';
        const scanStatus: SecurityScanStatus = {
          scan_id: scan.id,
          scan_type: scan.scan_type,
          category,
          state: 'pending',
          startTime: null,
          endTime: null,
          duration: null,
          findings_count: 0,
          error: null,
          progress: 0,
        };

        initialScans[scan.scan_type] = scanStatus;

        if (!scansByCategory[category]) {
          scansByCategory[category] = [];
        }
        scansByCategory[category].push(scanStatus);
      });

      setState({
        audit_id: audit.id,
        target_url: url,
        isRunning: true,
        status: 'running',
        startTime: Date.now(),
        endTime: null,
        scans: initialScans,
        scans_by_category: scansByCategory,
        findings_by_category: {},
        total_scans: audit.total_scans || scans.length,
        completed_scans: 0,
        failed_scans: 0,
        total_findings: 0,
        critical_findings: 0,
        high_findings: 0,
        medium_findings: 0,
        low_findings: 0,
      });

    } catch (error: any) {
      console.error('[SecurityAuditOrchestrator] Error starting audit:', error);
      throw error;
    }
  }, [refreshAccessToken]);

  const clearResults = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setState({
      audit_id: null,
      target_url: '',
      isRunning: false,
      status: 'pending',
      startTime: null,
      endTime: null,
      scans: {},
      scans_by_category: {},
      findings_by_category: {},
      total_scans: 0,
      completed_scans: 0,
      failed_scans: 0,
      total_findings: 0,
      critical_findings: 0,
      high_findings: 0,
      medium_findings: 0,
      low_findings: 0,
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    state,
    startAudit,
    clearResults,
  };
}

