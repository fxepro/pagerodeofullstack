"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { 
  ChevronRight, 
  ChevronLeft,
  Home,
  LayoutDashboard,
  Search,
  Gauge,
  Activity,
  TrendingUp,
  BarChart3,
  Shield,
  Users,
  Monitor,
  Network,
  Wrench,
  Palette,
  MessageSquare,
  CreditCard,
  Settings,
  User as UserIcon,
  Cpu,
  Plug,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

interface NavigationItem {
  id: string;
  title: string;
  href: string;
  icon?: string;
  permission?: string;
  badge?: string | null;
}

interface NavigationSection {
  id: string;
  title: string;
  icon?: string;
  permission?: string;
  items: NavigationItem[];
}

interface UnifiedSidebarProps {
  navigation: {
    sections: NavigationSection[];
  } | null;
  currentPath: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  LayoutDashboard,
  Search,
  Gauge,
  Activity,
  TrendingUp,
  BarChart3,
  Shield,
  Users,
  Monitor,
  Network,
  Wrench,
  Palette,
  MessageSquare,
  CreditCard,
  Settings,
  User: UserIcon,
  Tool: Wrench, // Use Wrench as alternative for Tool icon (Tool doesn't exist in lucide-react)
  Cpu, // AI Health icon
  Plug, // Integrations icon
};

export function UnifiedSidebar({ navigation, currentPath, collapsed = false, onToggle }: UnifiedSidebarProps) {
  const { hasPermission, permissions } = usePermissions();

  if (!navigation || !navigation.sections) {
    return (
      <aside className={cn(
        "fixed left-0 top-0 h-screen border-r border-gray-200 bg-gray-100 shadow-lg transition-all duration-300 flex flex-col z-40",
        collapsed ? "w-20" : "w-64"
      )}>
        <div className="p-4 text-sm text-gray-500">No navigation available</div>
      </aside>
    );
  }

  // Navigation is already filtered on backend by permissions
  // Use it directly - backend filtering is the source of truth
  const filteredSections = navigation.sections.filter(section => 
    section.items && section.items.length > 0
  );

  // Safety check: If user has site_audit.view but it's not in navigation, add it
  // This is a temporary fallback to ensure the item appears
  if (hasPermission('site_audit.view')) {
    const hasSiteAudit = filteredSections.some(section => 
      section.items?.some(item => item.id === 'site_audit')
    );
    if (!hasSiteAudit) {
      // Find or create "My Tools" section
      let myToolsSection = filteredSections.find(s => s.id === 'user_features');
      if (!myToolsSection) {
        myToolsSection = {
          id: 'user_features',
          title: 'My Tools',
          icon: 'Tool',
          items: []
        };
        filteredSections.push(myToolsSection);
      }
      // Add site-audit if not present
      if (!myToolsSection.items?.find(item => item.id === 'site_audit')) {
        myToolsSection.items.push({
          id: 'site_audit',
          title: 'Site Audit',
          href: '/workspace/site-audit',
          icon: 'Search',
          permission: 'site_audit.view'
        });
        console.warn('Site Audit was missing from navigation, added as fallback');
      }
    }
  }

  // Debug in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Sidebar - Navigation sections:', navigation.sections.length);
    console.log('Sidebar - Filtered sections:', filteredSections.length);
    console.log('Sidebar - Permissions:', permissions.length);
    console.log('Sidebar - Full navigation:', JSON.stringify(navigation, null, 2));
    // Check for site-audit specifically
    const allItems = navigation.sections.flatMap(s => s.items || []);
    const siteAuditItem = allItems.find(item => item.id === 'site_audit');
    console.log('Sidebar - Site Audit item:', siteAuditItem);
    console.log('Sidebar - All items:', allItems.map(i => ({ id: i.id, title: i.title, href: i.href })));
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen border-r border-gray-200 bg-gray-100 shadow-lg transition-all duration-300 flex flex-col z-40",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Header */}
      <div className={cn(
        "flex-shrink-0 flex items-center border-b border-gray-200 bg-white",
        collapsed ? "justify-center p-4" : "justify-between p-6"
      )}>
        {!collapsed && (
          <Link href="/" className="flex items-center">
            <Image 
              src="/Pagerodeo-Logo-Black.png" 
              alt="PageRodeo Logo" 
              width={160} 
              height={40}
              className="object-contain"
              priority
              unoptimized
            />
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="flex items-center justify-center">
            <Image 
              src="/Pagerodeo-Logo-Black.png" 
              alt="PageRodeo Logo" 
              width={40} 
              height={40}
              className="object-contain"
              priority
              unoptimized
            />
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "rounded-lg p-2 text-gray-500 hover:text-palette-primary hover:bg-white/70 transition",
            collapsed ? "ml-0" : "ml-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className={cn("flex-1 overflow-y-auto", collapsed ? "p-4" : "p-6")}>
        <div className={cn("flex flex-col", collapsed ? "gap-6" : "gap-8")}>
          {filteredSections.map((section) => (
            <div key={section.id}>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">
                  {section.title}
                </h3>
              )}
              <nav className={cn("space-y-2", collapsed && "space-y-3")}>
                {section.items.map((item) => {
                  const isActive = currentPath === item.href;
                  const IconComponent = item.icon ? iconMap[item.icon] : null;
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-palette-primary text-white shadow-md"
                          : "text-gray-700 hover:text-palette-primary hover:bg-palette-accent-3",
                        collapsed ? "justify-center" : "space-x-3"
                      )}
                    >
                      {IconComponent && <IconComponent className="h-5 w-5 flex-shrink-0" />}
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                        </div>
                      )}
                      {isActive && !collapsed && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

