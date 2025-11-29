"use client";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { applyTheme } from "@/lib/theme";
import { 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  MessageSquare,
  Activity,
  Monitor,
  Network,
  Wrench,
  Palette,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Filter,
  Search
} from "lucide-react";

// Page configuration mapping
const pageConfig: Record<string, {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  primaryAction?: {
    label: string;
    icon: React.ComponentType<any>;
    href?: string;
    onClick?: () => void;
  };
}> = {
  "/admin/dashboard": {
    title: "Overview",
    description: "Admin dashboard overview and key metrics",
    icon: BarChart3
  },
  "/admin/users": {
    title: "User Management",
    description: "Manage user accounts, roles, and permissions",
    icon: Users
  },
  "/admin/roles": {
    title: "Role Management", 
    description: "Configure user roles and permissions",
    icon: Shield
  },
  "/admin/analytics": {
    title: "Analytics Dashboard",
    description: "View platform performance and user engagement metrics",
    icon: BarChart3
  },
  "/admin/settings": {
    title: "System Settings",
    description: "Configure application-wide settings and preferences",
    icon: Settings
  },
  "/admin/feedback": {
    title: "Feedback Management",
    description: "Review and manage user feedback and suggestions",
    icon: MessageSquare
  },
  "/admin/system-status": {
    title: "System Status",
    description: "Monitor system health and performance metrics",
    icon: Activity
  },
  "/admin/monitoring": {
    title: "Monitoring & Logs",
    description: "System health, jobs, and log files",
    icon: Monitor
  },
  "/admin/api-monitoring": {
    title: "API Monitoring",
    description: "Monitor and test API endpoints",
    icon: Network
  },
  "/admin/tools-management": {
    title: "Tools Management",
    description: "Track and manage tool integrations",
    icon: Wrench
  },
  "/admin/financials": {
    title: "Financials",
    description: "Payment integrations and financial management",
    icon: CreditCard
  },
  "/admin/themes": {
    title: "Theme Manager",
    description: "Manage color palettes and typography presets",
    icon: Palette
  }
};

interface DynamicPageHeaderProps {
  customTitle?: string;
  customDescription?: string;
  customIcon?: React.ComponentType<any>;
  customAction?: {
    label: string;
    icon: React.ComponentType<any>;
    href?: string;
    onClick?: () => void;
  };
}

export function DynamicPageHeader({ 
  customTitle, 
  customDescription, 
  customIcon, 
  customAction 
}: DynamicPageHeaderProps) {
  const pathname = usePathname();
  
  // Get page config or use custom props
  const config = pageConfig[pathname] || {};
  
  const title = customTitle || config.title || "Page";
  const description = customDescription || config.description || "";
  const IconComponent = customIcon || config.icon || Settings;
  const action = customAction || config.primaryAction;

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <IconComponent className="h-5 w-5 text-palette-primary" />
          <h1 className={`text-lg font-semibold ${applyTheme.text('primary')}`}>
            {title}
          </h1>
        </div>
        {description && (
          <span className={`text-sm ${applyTheme.text('secondary')} hidden sm:inline`}>
            {description}
          </span>
        )}
      </div>
      
      {action && (
        <Button 
          className={applyTheme.button('primary')}
          onClick={action.onClick}
          asChild={!!action.href}
        >
          {action.href ? (
            <a href={action.href}>
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </a>
          ) : (
            <>
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
