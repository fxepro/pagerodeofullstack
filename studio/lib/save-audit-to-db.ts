/**
 * Background save function for site audit results
 * 
 * Reads from orchestrator state/localStorage and saves all analyses to database
 * Runs asynchronously - doesn't block UI or depend on orchestrator flow
 */

import { getDjangoApiUrl } from './api-config';
import { saveAnalysisToDatabase } from './save-analysis-to-db';

const STORAGE_KEY = 'pagerodeo_analysis_state';

interface OrchestratorState {
  url: string;
  isRunning: boolean;
  analyses: Record<string, {
    state: string;
    data: any;
  }>;
}

/**
 * Get orchestrator state from localStorage
 */
function getOrchestratorState(): OrchestratorState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return parsed.state || null;
  } catch (error) {
    console.error('[SaveAudit] Failed to read orchestrator state:', error);
    return null;
  }
}

/**
 * Create AuditReport and return audit_report_id
 */
async function createAuditReport(url: string, toolsSelected: string[], token: string | null): Promise<string | null> {
  try {
    console.log('[SaveAudit] Creating AuditReport with tools:', toolsSelected);
    
    // Only include Authorization header if token exists and is valid
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token && token.trim() !== '') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(getDjangoApiUrl('/api/reports/'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: url.startsWith('http') ? url : `https://${url}`,
        status: 'pending',
        tools_selected: toolsSelected,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error('[SaveAudit] Failed to create AuditReport:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        payload: {
          url: url.startsWith('http') ? url : `https://${url}`,
          status: 'pending',
          tools_selected: toolsSelected
        }
      });
      return null;
    }

    const result = await response.json();
    console.log('[SaveAudit] AuditReport creation response:', result);
    
    // Extract ID - could be 'id' or nested in response
    const auditReportId = result.id || result.data?.id || null;
    
    if (!auditReportId) {
      console.error('[SaveAudit] No ID in response:', result);
      return null;
    }
    
    console.log('[SaveAudit] Extracted AuditReport ID:', auditReportId);
    return auditReportId;
  } catch (error) {
    console.error('[SaveAudit] Exception creating AuditReport:', error);
    return null;
  }
}

/**
 * Save all successful analyses to database
 * Runs in background - doesn't block UI
 */
export async function saveAuditToDatabase(): Promise<void> {
  console.log('[SaveAudit] ========================================');
  console.log('[SaveAudit] saveAuditToDatabase called');
  console.log('[SaveAudit] ========================================');
  
  // Check if user is authenticated
  if (typeof window === 'undefined') {
    console.log('[SaveAudit] Window undefined - skipping');
    return;
  }
  
  const token = localStorage.getItem('access_token');
  if (token) {
    console.log('[SaveAudit] Token found:', token.substring(0, 20) + '...');
  } else {
    console.log('[SaveAudit] No auth token - saving as anonymous (backend supports AllowAny)');
  }

  // Get orchestrator state
  const state = getOrchestratorState();
  console.log('[SaveAudit] Orchestrator state check:', {
    hasState: !!state,
    hasUrl: !!state?.url,
    url: state?.url,
    isRunning: state?.isRunning,
    analysesCount: state?.analyses ? Object.keys(state.analyses).length : 0,
    analysesKeys: state?.analyses ? Object.keys(state.analyses) : []
  });
  
  if (!state) {
    console.error('[SaveAudit] ❌ No orchestrator state found in localStorage');
    console.log('[SaveAudit] Checking localStorage directly...');
    try {
      const raw = localStorage.getItem('pagerodeo_analysis_state');
      console.log('[SaveAudit] Raw localStorage value:', raw ? 'Found' : 'Not found');
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log('[SaveAudit] Parsed structure:', {
          hasState: 'state' in parsed,
          hasTimestamp: 'timestamp' in parsed,
          keys: Object.keys(parsed)
        });
      }
    } catch (e) {
      console.error('[SaveAudit] Error reading localStorage:', e);
    }
    return;
  }
  
  if (!state.url) {
    console.error('[SaveAudit] ❌ No URL in orchestrator state');
    return;
  }

  // Don't save if still running
  if (state.isRunning) {
    console.log('[SaveAudit] Analysis still running - skipping save');
    return;
  }

  // Get all successful analyses
  const allAnalyses = Object.entries(state.analyses || {});
  console.log('[SaveAudit] All analyses:', allAnalyses.map(([type, a]) => ({
    type,
    state: a.state,
    hasData: !!a.data,
    dataKeys: a.data ? Object.keys(a.data).slice(0, 5) : []
  })));
  
  const successfulAnalyses = allAnalyses
    .filter(([_, analysis]) => analysis.state === 'success' && analysis.data);

  console.log('[SaveAudit] Successful analyses count:', successfulAnalyses.length);
  console.log('[SaveAudit] Successful analysis types:', successfulAnalyses.map(([type]) => type));

  if (successfulAnalyses.length === 0) {
    console.warn('[SaveAudit] ⚠️ No successful analyses to save');
    console.log('[SaveAudit] Analysis states:', allAnalyses.map(([type, a]) => `${type}: ${a.state}`));
    return;
  }

  console.log(`[SaveAudit] Starting background save for ${successfulAnalyses.length} analyses`);

  try {
    // Extract tools_selected from successful analyses
    const toolsSelected = successfulAnalyses.map(([type, _]) => type);
    console.log('[SaveAudit] Tools selected:', toolsSelected);
    
    // Create AuditReport first
    const fullUrl = state.url.startsWith('http') ? state.url : `https://${state.url}`;
    console.log('[SaveAudit] Creating AuditReport with:', {
      url: fullUrl,
      toolsSelected,
      toolsCount: toolsSelected.length
    });
    
    const auditReportId = await createAuditReport(fullUrl, toolsSelected, token);

    if (!auditReportId) {
      console.error('[SaveAudit] ❌ Failed to create AuditReport');
      console.error('[SaveAudit] Attempting to save analyses WITHOUT audit_report_id (fallback)');
      console.error('[SaveAudit] Check backend logs for AuditReport creation errors');
      
      // FALLBACK: Save analyses without audit_report_id
      // This ensures data is saved even if audit report creation fails
      const savePromises = successfulAnalyses.map(async ([type, analysis]) => {
        try {
          console.log(`[SaveAudit] Saving ${type} WITHOUT audit_report_id (fallback mode)`);
          const saved = await saveAnalysisToDatabase(
            type as any,
            analysis.data,
            null, // No audit_report_id
            fullUrl,
            token
          );
          
          if (saved) {
            console.log(`✅ [SaveAudit] Saved ${type} analysis (no audit_report_id)`);
          } else {
            console.warn(`⚠️ [SaveAudit] Failed to save ${type} analysis`);
          }
        } catch (error) {
          console.error(`❌ [SaveAudit] Exception saving ${type}:`, error);
        }
      });

      await Promise.allSettled(savePromises);
      console.log(`[SaveAudit] Background save complete (fallback mode - no audit_report_id)`);
      return;
    }

    console.log(`[SaveAudit] ✅ Created AuditReport: ${auditReportId}`);

    // Save all analyses in parallel (non-blocking)
    const savePromises = successfulAnalyses.map(async ([type, analysis]) => {
      try {
        const saved = await saveAnalysisToDatabase(
          type as any,
          analysis.data,
          auditReportId,
          fullUrl,
          token
        );
        
        if (saved) {
          console.log(`✅ [SaveAudit] Saved ${type} analysis`);
        } else {
          console.warn(`⚠️ [SaveAudit] Failed to save ${type} analysis`);
        }
      } catch (error) {
        console.error(`❌ [SaveAudit] Exception saving ${type}:`, error);
      }
    });

    // Wait for all saves to complete (but don't block UI)
    await Promise.allSettled(savePromises);
    
    console.log(`[SaveAudit] ✅ Background save complete for AuditReport: ${auditReportId}`);
  } catch (error) {
    console.error('[SaveAudit] Exception in background save:', error);
  }
}

/**
 * Auto-save when analysis completes
 * Call this after orchestrator finishes
 */
export function triggerBackgroundSave(): void {
  console.log('[SaveAudit] triggerBackgroundSave called');
  // Run in background, don't await
  saveAuditToDatabase().catch(error => {
    console.error('[SaveAudit] Background save failed:', error);
  });
}

