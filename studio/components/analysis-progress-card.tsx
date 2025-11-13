"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { AnalysisStatus, AnalysisType } from "@/hooks/use-analysis-orchestrator-v2";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock, 
  ArrowRight 
} from "lucide-react";

interface AnalysisProgressCardProps {
  type: AnalysisType;
  name: string;
  status: AnalysisStatus;
}

export function AnalysisProgressCard({ type, name, status }: AnalysisProgressCardProps) {
  const formatDuration = (ms: number | null) => {
    if (!ms) return '';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getElapsedTime = () => {
    if (!status.startTime) return '';
    const elapsed = Date.now() - status.startTime;
    return formatDuration(elapsed);
  };

  const getSummary = () => {
    if (status.state === 'success' && status.data) {
      switch (type) {
        case 'performance':
          return `Score: ${status.data.performanceScore || 'N/A'}/100 • Load Time: ${status.data.loadTime || 'N/A'}s`;
        case 'monitor':
          return `Status: ${status.data.status || 'Unknown'} • Uptime: ${status.data.uptime || 'N/A'}`;
        case 'ssl':
          return `Valid: ${status.data.valid ? 'Yes' : 'No'} • Expires: ${status.data.daysUntilExpiry || 'N/A'} days`;
        case 'dns':
          return `Records: ${status.data.totalRecords || 0} found • IPv4: ${status.data.ipv4?.length || 0}`;
        case 'sitemap':
          return `URLs: ${status.data.totalUrls || 0} • Valid: ${status.data.validUrls || 0}`;
        case 'api':
          return `Endpoints: ${status.data.endpoints?.length || 0} • Health: ${status.data.health || 'Unknown'}`;
        case 'links':
          const linksData = status.data.results || status.data.links || status.data || [];
          const totalLinks = Array.isArray(linksData) ? linksData.length : (status.data.total || 0);
          const workingLinks = Array.isArray(linksData) ? linksData.filter((l: any) => l.status && l.status < 400).length : 0;
          return `Total: ${totalLinks} • Working: ${workingLinks}`;
        case 'typography':
          return `Fonts: ${status.data.summary?.totalFamilies || 0} • Score: ${status.data.summary?.overallScore || 'N/A'}`;
        default:
          return '';
      }
    }
    return '';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {/* Status Icon */}
              {status.state === 'pending' && (
                <Clock className="h-5 w-5 text-slate-400" />
              )}
              {status.state === 'running' && (
                <Loader2 className="h-5 w-5 text-palette-primary animate-spin" />
              )}
              {status.state === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {status.state === 'error' && (
                <XCircle className="h-5 w-5 text-red-600" />
              )}

              {/* Name */}
              <h3 className="text-lg font-semibold text-slate-800">
                {name}
              </h3>

              {/* Status Text */}
              {status.state === 'pending' && (
                <span className="text-sm text-slate-500">
                  Waiting in queue...
                </span>
              )}
              {status.state === 'running' && (
                <span className="text-sm text-palette-primary font-medium">
                  Analyzing... ({getElapsedTime()} elapsed)
                </span>
              )}
              {status.state === 'success' && status.duration && (
                <span className="text-sm text-green-600">
                  Complete ({formatDuration(status.duration)})
                </span>
              )}
              {status.state === 'error' && status.duration && (
                <span className="text-sm text-red-600">
                  Failed ({formatDuration(status.duration)})
                </span>
              )}
            </div>

            {/* Summary */}
            {status.state === 'success' && getSummary() && (
              <p className="text-sm text-slate-600 ml-8 mb-2">
                {getSummary()}
              </p>
            )}

            {/* Error Message */}
            {status.state === 'error' && status.error && (
              <div className="ml-8 mb-2">
                <p className="text-sm text-red-600 font-medium">
                  Error: {status.error}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  ⚠️ Click "View Error" to see details and troubleshooting
                </p>
              </div>
            )}

            {/* Progress Bar for Running State */}
            {status.state === 'running' && (
              <div className="ml-8 mt-2">
                <Progress value={status.progress} className="h-2" />
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="ml-4">
            {status.state === 'success' && (
              <Link href={`/${type}`}>
                <Button size="sm" variant="outline">
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
            {status.state === 'error' && (
              <Link href={`/${type}`}>
                <Button size="sm" variant="destructive">
                  View Error
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

