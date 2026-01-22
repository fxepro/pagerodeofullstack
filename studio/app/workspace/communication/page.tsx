"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Settings,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface CommunicationIntegration {
  id: string;
  name: string;
  type: 'slack' | 'telegram' | 'webhook' | 'discord' | 'mattermost' | 'ms_teams' | 'google_chat' | 'zapier' | 'pagerduty' | 'splunk' | 'android' | 'pushbullet' | 'pushover';
  icon: string;
  description: string;
  connected: boolean;
  status: 'active' | 'inactive' | 'error';
  last_test?: string;
  webhook_url?: string;
  channel?: string;
  enabled: boolean;
  events: string[];
}

const availableIntegrations: Omit<CommunicationIntegration, 'id' | 'connected' | 'status' | 'last_test' | 'webhook_url' | 'channel' | 'enabled' | 'events'>[] = [
  {
    name: 'Slack',
    type: 'slack',
    icon: '💬',
    description: 'Send notifications to Slack channels',
  },
  {
    name: 'Telegram',
    type: 'telegram',
    icon: '✈️',
    description: 'Send messages via Telegram bot',
  },
  {
    name: 'Webhook',
    type: 'webhook',
    icon: '🔗',
    description: 'Custom webhook integration',
  },
  {
    name: 'Discord',
    type: 'discord',
    icon: '🎮',
    description: 'Post notifications to Discord channels',
  },
  {
    name: 'Mattermost',
    type: 'mattermost',
    icon: '💼',
    description: 'Integrate with Mattermost workspace',
  },
  {
    name: 'Microsoft Teams',
    type: 'ms_teams',
    icon: '👥',
    description: 'Send alerts to MS Teams channels',
  },
  {
    name: 'Google Chat',
    type: 'google_chat',
    icon: '💬',
    description: 'Post messages to Google Chat spaces',
  },
  {
    name: 'Zapier',
    type: 'zapier',
    icon: '⚡',
    description: 'Connect via Zapier webhooks',
  },
  {
    name: 'PagerDuty',
    type: 'pagerduty',
    icon: '🚨',
    description: 'Incident management and alerting',
  },
  {
    name: 'Splunk',
    type: 'splunk',
    icon: '📊',
    description: 'Send logs and events to Splunk',
  },
  {
    name: 'Android',
    type: 'android',
    icon: '📱',
    description: 'Push notifications to Android devices',
  },
  {
    name: 'Pushbullet',
    type: 'pushbullet',
    icon: '📲',
    description: 'Send notifications via Pushbullet',
  },
  {
    name: 'Pushover',
    type: 'pushover',
    icon: '📬',
    description: 'Push notifications to mobile devices',
  },
];

export default function CommunicationPage() {
  const [integrations, setIntegrations] = useState<CommunicationIntegration[]>([
    {
      id: '1',
      name: 'Slack',
      type: 'slack',
      icon: '💬',
      description: 'Send notifications to Slack channels',
      connected: true,
      status: 'active',
      last_test: '2024-01-15T10:30:00Z',
      webhook_url: 'https://hooks.slack.com/services/...',
      channel: '#alerts',
      enabled: true,
      events: ['site_down', 'site_up', 'performance_alert'],
    },
    {
      id: '2',
      name: 'Telegram',
      type: 'telegram',
      icon: '✈️',
      description: 'Send messages via Telegram bot',
      connected: true,
      status: 'active',
      last_test: '2024-01-15T09:15:00Z',
      channel: '@pagerodeo_alerts',
      enabled: true,
      events: ['site_down', 'critical_alert'],
    },
    {
      id: '3',
      name: 'Webhook',
      type: 'webhook',
      icon: '🔗',
      description: 'Custom webhook integration',
      connected: true,
      status: 'active',
      last_test: '2024-01-14T16:20:00Z',
      webhook_url: 'https://api.example.com/webhook',
      enabled: true,
      events: ['all'],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [newIntegration, setNewIntegration] = useState({
    webhook_url: '',
    channel: '',
    enabled: true,
    events: [] as string[],
  });

  const availableToAdd = availableIntegrations.filter(
    int => !integrations.some(existing => existing.type === int.type)
  );

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'connected' && integration.connected) ||
      (statusFilter === 'not_connected' && !integration.connected) ||
      (statusFilter === 'active' && integration.status === 'active') ||
      (statusFilter === 'error' && integration.status === 'error');
    
    return matchesSearch && matchesStatus;
  });

  const handleAddIntegration = () => {
    if (!selectedIntegration) return;

    const template = availableIntegrations.find(int => int.type === selectedIntegration);
    if (!template) return;

    const newInt: CommunicationIntegration = {
      id: Date.now().toString(),
      ...template,
      connected: true,
      status: 'active',
      last_test: new Date().toISOString(),
      webhook_url: newIntegration.webhook_url,
      channel: newIntegration.channel,
      enabled: newIntegration.enabled,
      events: newIntegration.events.length > 0 ? newIntegration.events : ['site_down'],
    };

    setIntegrations([...integrations, newInt]);
    setShowAddDialog(false);
    setSelectedIntegration(null);
    setNewIntegration({ webhook_url: '', channel: '', enabled: true, events: [] });
  };

  const handleDeleteIntegration = (id: string) => {
    if (!confirm('Are you sure you want to remove this integration?')) return;
    setIntegrations(integrations.filter(int => int.id !== id));
  };

  const handleToggleEnabled = (id: string) => {
    setIntegrations(integrations.map(int => 
      int.id === id ? { ...int, enabled: !int.enabled } : int
    ));
  };

  const getStatusBadge = (integration: CommunicationIntegration) => {
    if (!integration.connected) {
      return <Badge variant="outline">Not Connected</Badge>;
    }
    
    switch (integration.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="outline">{integration.status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Calculate stats
  const totalIntegrations = integrations.length;
  const activeIntegrations = integrations.filter(i => i.connected && i.status === 'active').length;
  const enabledIntegrations = integrations.filter(i => i.enabled).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h4-dynamic font-bold">Communication</h1>
          <p className="text-muted-foreground mt-1">Connect and configure external communication tools for alerts and notifications</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Communication Integration</DialogTitle>
              <DialogDescription>
                Select a communication tool to integrate with PageRodeo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="integration-type">Integration Type</Label>
                <Select value={selectedIntegration || ''} onValueChange={setSelectedIntegration}>
                  <SelectTrigger id="integration-type">
                    <SelectValue placeholder="Select integration type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToAdd.map((int) => (
                      <SelectItem key={int.type} value={int.type}>
                        <div className="flex items-center gap-2">
                          <span>{int.icon}</span>
                          <span>{int.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedIntegration && (
                <>
                  <div>
                    <Label htmlFor="webhook-url">
                      {selectedIntegration === 'webhook' ? 'Webhook URL' : 
                       selectedIntegration === 'slack' || selectedIntegration === 'discord' || selectedIntegration === 'mattermost' || selectedIntegration === 'ms_teams' || selectedIntegration === 'google_chat' ? 'Webhook URL' :
                       'API Key / Token'}
                    </Label>
                    <Input
                      id="webhook-url"
                      placeholder={
                        selectedIntegration === 'webhook' ? 'https://api.example.com/webhook' :
                        selectedIntegration === 'slack' ? 'https://hooks.slack.com/services/...' :
                        'Enter API key or token'
                      }
                      value={newIntegration.webhook_url}
                      onChange={(e) => setNewIntegration({ ...newIntegration, webhook_url: e.target.value })}
                    />
                  </div>

                  {(selectedIntegration === 'slack' || selectedIntegration === 'discord' || selectedIntegration === 'telegram' || selectedIntegration === 'mattermost' || selectedIntegration === 'ms_teams' || selectedIntegration === 'google_chat') && (
                    <div>
                      <Label htmlFor="channel">
                        {selectedIntegration === 'telegram' ? 'Chat ID or Username' : 'Channel'}
                      </Label>
                      <Input
                        id="channel"
                        placeholder={
                          selectedIntegration === 'slack' || selectedIntegration === 'discord' ? '#channel-name' :
                          selectedIntegration === 'telegram' ? '@username or chat_id' :
                          'Channel name'
                        }
                        value={newIntegration.channel}
                        onChange={(e) => setNewIntegration({ ...newIntegration, channel: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enabled">Enable Integration</Label>
                      <p className="text-sm text-slate-500">Start receiving notifications immediately</p>
                    </div>
                    <Switch
                      id="enabled"
                      checked={newIntegration.enabled}
                      onCheckedChange={(checked) => setNewIntegration({ ...newIntegration, enabled: checked })}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddIntegration}
                disabled={!selectedIntegration || !newIntegration.webhook_url}
              >
                Add Integration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-h2-dynamic font-bold text-slate-800">{totalIntegrations}</div>
              <p className="text-sm text-slate-600 mt-1">Total Integrations</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-h2-dynamic font-bold text-green-600">{activeIntegrations}</div>
              <p className="text-sm text-slate-600 mt-1">Active Integrations</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-h2-dynamic font-bold text-blue-600">{enabledIntegrations}</div>
              <p className="text-sm text-slate-600 mt-1">Enabled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="not_connected">Not Connected</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Available Integrations */}
      {availableToAdd.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Integrations</CardTitle>
            <CardDescription>
              Connect to these communication tools to receive alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableToAdd.map((integration) => (
                <Card key={integration.type} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{integration.icon}</span>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-slate-500 mt-1">{integration.description}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        setSelectedIntegration(integration.type);
                        setShowAddDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
          <CardDescription>
            {filteredIntegrations.length} {filteredIntegrations.length === 1 ? 'integration' : 'integrations'} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIntegrations.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-h4-dynamic font-medium text-slate-700 mb-2">No integrations found</p>
              <p className="text-sm">Connect to a communication tool to start receiving notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="border-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <span className="text-4xl">{integration.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-h4-dynamic font-semibold">{integration.name}</h3>
                            {getStatusBadge(integration)}
                            {integration.enabled ? (
                              <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
                            ) : (
                              <Badge variant="outline">Disabled</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{integration.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {integration.webhook_url && (
                              <div>
                                <span className="text-slate-500">Webhook URL: </span>
                                <span className="font-mono text-xs text-slate-700 break-all">
                                  {integration.webhook_url.length > 50 
                                    ? `${integration.webhook_url.substring(0, 50)}...` 
                                    : integration.webhook_url}
                                </span>
                              </div>
                            )}
                            {integration.channel && (
                              <div>
                                <span className="text-slate-500">Channel: </span>
                                <span className="font-medium text-slate-700">{integration.channel}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-500">Last Test: </span>
                              <span className="text-slate-700">{getTimeAgo(integration.last_test)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Events: </span>
                              <span className="text-slate-700">
                                {integration.events.length === 0 
                                  ? 'None' 
                                  : integration.events.length === 1 && integration.events[0] === 'all'
                                  ? 'All Events'
                                  : `${integration.events.length} event${integration.events.length > 1 ? 's' : ''}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={() => handleToggleEnabled(integration.id)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteIntegration(integration.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

