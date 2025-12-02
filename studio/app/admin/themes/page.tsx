"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Plus, Check, Edit, Trash2, Loader2, Eye, Type } from "lucide-react";
import { applyTheme } from "@/lib/theme";
import { AVAILABLE_FONTS } from "@/lib/available-fonts";
import axios from "axios";
import { toast } from "sonner";
import { captureEvent } from "@/lib/posthog";

// Use relative URL in browser (matches page protocol - HTTPS in production)
// Only use env var for server-side rendering
const API_BASE = typeof window !== 'undefined' 
  ? '' // Relative URL in browser (automatic HTTPS)
  : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'); // SSR: use env var or default

interface ThemePalette {
  id: number;
  name: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  accent_1: string;
  accent_2: string;
  accent_3: string;
  is_active: boolean;
  is_system: boolean;
  created_by_username: string;
  created_at: string;
}

interface TypographyPreset {
  id: number;
  name: string;
  description: string;
  body_font: string;
  heading_font: string;
  font_size_base: string;
  font_size_h1: string;
  font_size_h2: string;
  font_size_h3: string;
  font_size_h4: string;
  font_size_h5: string;
  font_size_h6: string;
  line_height_base: string;
  is_active: boolean;
  is_system: boolean;
  created_by_username: string;
  created_at: string;
}

export default function AdminThemesPage() {
  const [palettes, setPalettes] = useState<ThemePalette[]>([]);
  const [typographyPresets, setTypographyPresets] = useState<TypographyPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingTypography, setCreatingTypography] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state for color palette
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primary_color: '#0086ad',
    secondary_color: '#005582',
    accent_1: '#00c2c7',
    accent_2: '#97ebdb',
    accent_3: '#daf8e3',
  });
  
  // Form state for typography
  const [typographyFormData, setTypographyFormData] = useState({
    name: '',
    description: '',
    body_font: 'Roboto, sans-serif',
    heading_font: 'Montserrat, sans-serif',
    font_size_base: '16px',
    font_size_h1: '48px',
    font_size_h2: '36px',
    font_size_h3: '30px',
    font_size_h4: '24px',
    font_size_h5: '20px',
    font_size_h6: '18px',
    line_height_base: '1.6',
  });

  useEffect(() => {
    fetchPalettes();
    fetchTypographyPresets();
  }, []);

  const fetchPalettes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/api/palettes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPalettes(response.data);
    } catch (error: any) {
      console.error('Error fetching palettes:', error);
      
      // Check if it's a 500 error (likely database not setup)
      if (error.response?.status === 500) {
        toast.error('Backend not setup. Please run migrations and setup commands');
      } else {
        toast.error('Failed to load palettes. Check backend is running.');
      }
      
      // Set empty array so page doesn't break
      setPalettes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypographyPresets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/api/typography/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTypographyPresets(response.data);
    } catch (error: any) {
      console.error('Error fetching typography presets:', error);
      setTypographyPresets([]);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE}/api/palettes/create/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Palette created successfully');
      setCreating(false);
      resetForm();
      fetchPalettes();
    } catch (error: any) {
      toast.error(error.response?.data?.name?.[0] || 'Failed to create palette');
    }
  };

  const handleActivate = async (paletteId: number, paletteName: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE}/api/palettes/${paletteId}/activate/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Track theme change event
      captureEvent('theme_palette_activated', {
        palette_id: paletteId,
        palette_name: paletteName,
        timestamp: new Date().toISOString(),
      });
      
      toast.success(`${paletteName} activated!`);
      fetchPalettes();
      // Optionally reload to apply new theme
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Failed to activate palette');
    }
  };

  const handleDelete = async (paletteId: number, paletteName: string) => {
    if (!confirm(`Are you sure you want to delete "${paletteName}"?`)) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE}/api/palettes/${paletteId}/delete/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Palette deleted');
      fetchPalettes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete palette');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      primary_color: '#0086ad',
      secondary_color: '#005582',
      accent_1: '#00c2c7',
      accent_2: '#97ebdb',
      accent_3: '#daf8e3',
    });
    setEditingId(null);
  };

  const resetTypographyForm = () => {
    setTypographyFormData({
      name: '',
      description: '',
      body_font: 'Roboto, sans-serif',
      heading_font: 'Montserrat, sans-serif',
      font_size_base: '16px',
      font_size_h1: '48px',
      font_size_h2: '36px',
      font_size_h3: '30px',
      font_size_h4: '24px',
      font_size_h5: '20px',
      font_size_h6: '18px',
      line_height_base: '1.6',
    });
  };

  const handleCreateTypography = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE}/api/typography/create/`, typographyFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Typography preset created successfully');
      setCreatingTypography(false);
      resetTypographyForm();
      fetchTypographyPresets();
    } catch (error: any) {
      toast.error(error.response?.data?.name?.[0] || 'Failed to create typography preset');
    }
  };

  const handleActivateTypography = async (presetId: number, presetName: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE}/api/typography/${presetId}/activate/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Track typography change event
      captureEvent('theme_typography_activated', {
        preset_id: presetId,
        preset_name: presetName,
        timestamp: new Date().toISOString(),
      });
      
      toast.success(`${presetName} typography activated!`);
      fetchTypographyPresets();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Failed to activate typography preset');
    }
  };

  const handleDeleteTypography = async (presetId: number, presetName: string) => {
    if (!confirm(`Are you sure you want to delete "${presetName}"?`)) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE}/api/typography/${presetId}/delete/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Typography preset deleted');
      fetchTypographyPresets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete typography preset');
    }
  };

  const activePalette = palettes.find(p => p.is_active);
  const activeTypography = typographyPresets.find(p => p.is_active);

  if (loading) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
          <span className="ml-2 text-slate-600">Loading theme settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={applyTheme.page()}>
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color Palettes
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          {/* Active Palette Banner */}
      {activePalette && (
        <Card className="bg-gradient-to-r from-palette-accent-3 to-blue-50 border-palette-accent-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  Active Theme: {activePalette.name}
                </h3>
                <p className="text-sm text-slate-600">{activePalette.description}</p>
              </div>
              <div className="flex space-x-2">
                {[activePalette.primary_color, activePalette.secondary_color, activePalette.accent_1, activePalette.accent_2, activePalette.accent_3].map((color, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-lg border-2 border-white shadow-md"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Palette */}
      <Card className={applyTheme.card()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={applyTheme.text('primary')}>
                <Palette className="h-5 w-5 inline mr-2" />
                Theme Palettes
              </CardTitle>
              <CardDescription className={applyTheme.text('secondary')}>
                Manage color palettes for your application
              </CardDescription>
            </div>
            <Button
              onClick={() => setCreating(!creating)}
              className="bg-palette-primary hover:bg-palette-primary-hover text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Palette
            </Button>
          </div>
        </CardHeader>

        {creating && (
          <CardContent className="border-t border-slate-200 pt-6">
            <div className="space-y-4 max-w-2xl">
              <div>
                <Label>Palette Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Ocean Blue"
                  className="bg-white border-slate-300"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this palette"
                  className="bg-white border-slate-300"
                />
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                {[
                  { key: 'primary_color', label: 'Primary' },
                  { key: 'secondary_color', label: 'Secondary' },
                  { key: 'accent_1', label: 'Accent 1' },
                  { key: 'accent_2', label: 'Accent 2' },
                  { key: 'accent_3', label: 'Accent 3' },
                ].map((field) => (
                  <div key={field.key}>
                    <Label className="text-xs">{field.label}</Label>
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className="w-full h-20 rounded-lg border-2 border-slate-300 cursor-pointer"
                        style={{ backgroundColor: formData[field.key as keyof typeof formData] }}
                        onClick={() => document.getElementById(field.key)?.click()}
                      />
                      <input
                        id={field.key}
                        type="color"
                        value={formData[field.key as keyof typeof formData]}
                        onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                        className="w-full h-8"
                      />
                      <Input
                        value={formData[field.key as keyof typeof formData]}
                        onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                        className="text-xs text-center bg-white"
                        maxLength={7}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 text-white">
                  <Check className="h-4 w-4 mr-2" />
                  Create Palette
                </Button>
                <Button onClick={() => { setCreating(false); resetForm(); }} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Palettes List */}
      {palettes.length === 0 && !loading && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-8 text-center">
            <Palette className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Palettes Found</h3>
            <p className="text-slate-600 mb-4">
              The backend database hasn't been setup yet.
            </p>
            <div className="bg-white border border-yellow-300 rounded-lg p-4 text-left max-w-2xl mx-auto">
              <p className="text-sm font-semibold text-slate-700 mb-2">Run these commands in your backend terminal:</p>
              <pre className="text-xs bg-slate-900 text-green-400 p-3 rounded overflow-x-auto">
{`cd backend
.\\venv\\Scripts\\Activate.ps1
python manage.py makemigrations settings
python manage.py migrate settings
python manage.py setup_default_palette
python manage.py runserver`}
              </pre>
              <p className="text-xs text-slate-500 mt-2">Then refresh this page to see the palettes.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {palettes.map((palette) => (
          <Card key={palette.id} className={`${applyTheme.card()} ${palette.is_active ? 'ring-2 ring-green-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    {palette.name}
                    {palette.is_active && (
                      <Badge className="ml-2 bg-green-600 text-white">Active</Badge>
                    )}
                    {palette.is_system && (
                      <Badge className="ml-2 bg-blue-600 text-white">System</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{palette.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Color Swatches */}
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { color: palette.primary_color, label: 'Primary' },
                    { color: palette.secondary_color, label: 'Secondary' },
                    { color: palette.accent_1, label: 'Accent 1' },
                    { color: palette.accent_2, label: 'Accent 2' },
                    { color: palette.accent_3, label: 'Accent 3' },
                  ].map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className="w-full h-16 rounded-lg border-2 border-slate-200 mb-1"
                        style={{ backgroundColor: item.color }}
                        title={item.color}
                      />
                      <span className="text-xs text-slate-600">{item.label}</span>
                      <div className="text-xs text-slate-400 font-mono">{item.color}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    By {palette.created_by_username || 'System'}
                  </span>
                  <div className="flex space-x-2">
                    {!palette.is_active && (
                      <Button
                        size="sm"
                        onClick={() => handleActivate(palette.id, palette.name)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    {!palette.is_system && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(palette.id, palette.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          {/* Active Typography Banner */}
          {activeTypography && (
            <Card className="bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                      <Check className="h-5 w-5 text-green-600 mr-2" />
                      Active Typography: {activeTypography.name}
                    </h3>
                    <p className="text-sm text-slate-600">{activeTypography.description}</p>
                    <div className="mt-2 text-xs text-slate-500">
                      Body: {activeTypography.font_size_base} | H1: {activeTypography.font_size_h1} | Line Height: {activeTypography.line_height_base}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create New Typography Preset */}
          <Card className={applyTheme.card()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={applyTheme.text('primary')}>
                    <Type className="h-5 w-5 inline mr-2" />
                    Typography Presets
                  </CardTitle>
                  <CardDescription className={applyTheme.text('secondary')}>
                    Manage font families and sizes
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setCreatingTypography(!creatingTypography)}
                  className="bg-palette-primary hover:bg-palette-primary-hover text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Preset
                </Button>
              </div>
            </CardHeader>

            {creatingTypography && (
              <CardContent className="border-t border-slate-200 pt-6">
                <div className="space-y-4 max-w-3xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Preset Name</Label>
                      <Input
                        value={typographyFormData.name}
                        onChange={(e) => setTypographyFormData({...typographyFormData, name: e.target.value})}
                        placeholder="e.g., Compact"
                        className="bg-white border-slate-300"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={typographyFormData.description}
                        onChange={(e) => setTypographyFormData({...typographyFormData, description: e.target.value})}
                        placeholder="Brief description"
                        className="bg-white border-slate-300"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Body Font</Label>
                      <select
                        value={typographyFormData.body_font}
                        onChange={(e) => setTypographyFormData({...typographyFormData, body_font: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-palette-primary"
                      >
                        {AVAILABLE_FONTS.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        {AVAILABLE_FONTS.find(f => f.value === typographyFormData.body_font)?.languages}
                      </p>
                    </div>
                    <div>
                      <Label>Heading Font</Label>
                      <select
                        value={typographyFormData.heading_font}
                        onChange={(e) => setTypographyFormData({...typographyFormData, heading_font: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-palette-primary"
                      >
                        {AVAILABLE_FONTS.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        {AVAILABLE_FONTS.find(f => f.value === typographyFormData.heading_font)?.languages}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { key: 'font_size_base', label: 'Body Size' },
                      { key: 'font_size_h1', label: 'H1 Size' },
                      { key: 'font_size_h2', label: 'H2 Size' },
                      { key: 'font_size_h3', label: 'H3 Size' },
                      { key: 'font_size_h4', label: 'H4 Size' },
                      { key: 'font_size_h5', label: 'H5 Size' },
                      { key: 'font_size_h6', label: 'H6 Size' },
                      { key: 'line_height_base', label: 'Line Height' },
                    ].map((field) => (
                      <div key={field.key}>
                        <Label className="text-xs">{field.label}</Label>
                        <Input
                          value={typographyFormData[field.key as keyof typeof typographyFormData]}
                          onChange={(e) => setTypographyFormData({...typographyFormData, [field.key]: e.target.value})}
                          className="text-sm bg-white border-slate-300"
                          placeholder="16px"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleCreateTypography} className="bg-green-600 hover:bg-green-700 text-white">
                      <Check className="h-4 w-4 mr-2" />
                      Create Preset
                    </Button>
                    <Button onClick={() => { setCreatingTypography(false); resetTypographyForm(); }} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Typography Presets List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {typographyPresets.map((preset) => (
              <Card key={preset.id} className={`${applyTheme.card()} ${preset.is_active ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {preset.name}
                        {preset.is_active && (
                          <Badge className="ml-2 bg-green-600 text-white">Active</Badge>
                        )}
                        {preset.is_system && (
                          <Badge className="ml-2 bg-blue-600 text-white">System</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{preset.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Typography Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Body Font</p>
                        <p className="font-medium text-slate-800 truncate">{preset.body_font.split(',')[0]}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Heading Font</p>
                        <p className="font-medium text-slate-800 truncate">{preset.heading_font.split(',')[0]}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Body Size</p>
                        <p className="font-medium text-slate-800">{preset.font_size_base}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">H1 Size</p>
                        <p className="font-medium text-slate-800">{preset.font_size_h1}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">H2-H6</p>
                        <p className="font-medium text-slate-800 text-xs">{preset.font_size_h2}, {preset.font_size_h3}, {preset.font_size_h4}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Line Height</p>
                        <p className="font-medium text-slate-800">{preset.line_height_base}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <span className="text-xs text-slate-500">
                        By {preset.created_by_username || 'System'}
                      </span>
                      <div className="flex space-x-2">
                        {!preset.is_active && (
                          <Button
                            size="sm"
                            onClick={() => handleActivateTypography(preset.id, preset.name)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        )}
                        {!preset.is_system && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTypography(preset.id, preset.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

