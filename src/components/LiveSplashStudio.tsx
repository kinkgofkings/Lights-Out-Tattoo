import { uploadLargeMedia } from "../services/mediaStore";
import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Image,
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Smartphone,
  Monitor,
  RefreshCw,
  Save,
  CheckCircle2,
  Edit3,
  Layers,
  Zap,
  Power,
  X
} from 'lucide-react';
import { SplashScreenSettings, SplashScreenScene, ShowcasePhoto, GalleryItem } from '../types';
import { storageService } from '../services/storage';
import { MatrixSplashScreen } from './MatrixSplashScreen';

interface LiveSplashStudioProps {
  galleryItems: GalleryItem[];
  onShowNotification: (msg: string) => void;
  onSettingsUpdated?: (settings: SplashScreenSettings) => void;
}

export const LiveSplashStudio: React.FC<LiveSplashStudioProps> = ({
  galleryItems,
  onShowNotification,
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<SplashScreenSettings>(() => storageService.getSplashScreenSettings());
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);

  // Photo upload form state
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('Realism');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);

  // Save changes to storage
  const handleSaveSettings = (newSettings: SplashScreenSettings) => {
    setSettings(newSettings);
    storageService.saveSplashScreenSettings(newSettings);
    if (onSettingsUpdated) onSettingsUpdated(newSettings);
    onShowNotification('Live Splash Screen Studio settings saved!');
  };

  const handleSliderChange = (field: keyof SplashScreenSettings, value: any) => {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    storageService.saveSplashScreenSettings(updated);
    if (onSettingsUpdated) onSettingsUpdated(updated);
  };

  const handleResetDefaults = () => {
    // Note: window.confirm is blocked in some iframe environments, bypassing for now
    const reset = storageService.resetSplashScreenSettings();
    setSettings(reset);
    if (onSettingsUpdated) onSettingsUpdated(reset);
    onShowNotification('Splash Screen settings restored to studio defaults.');
  };

  // Scene editing handler
  const handleUpdateCurrentScene = (field: keyof SplashScreenScene, value: any) => {
    const scenes = [...settings.scenes];
    scenes[activeSceneIndex] = {
      ...scenes[activeSceneIndex],
      [field]: value
    };
    const updated = { ...settings, scenes };
    setSettings(updated);
  };

  const handleUpdateBulletPoint = (index: number, text: string) => {
    const scenes = [...settings.scenes];
    const bullets = [...scenes[activeSceneIndex].bulletPoints];
    bullets[index] = text;
    scenes[activeSceneIndex] = {
      ...scenes[activeSceneIndex],
      bulletPoints: bullets
    };
    const updated = { ...settings, scenes };
    setSettings(updated);
  };

  const handleAddBulletPoint = () => {
    const scenes = [...settings.scenes];
    const bullets = [...scenes[activeSceneIndex].bulletPoints, 'New studio highlight'];
    scenes[activeSceneIndex] = {
      ...scenes[activeSceneIndex],
      bulletPoints: bullets
    };
    const updated = { ...settings, scenes };
    setSettings(updated);
  };

  const handleRemoveBulletPoint = (index: number) => {
    const scenes = [...settings.scenes];
    const bullets = scenes[activeSceneIndex].bulletPoints.filter((_, i) => i !== index);
    scenes[activeSceneIndex] = {
      ...scenes[activeSceneIndex],
      bulletPoints: bullets
    };
    const updated = { ...settings, scenes };
    setSettings(updated);
  };

  // Photo management handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await uploadLargeMedia(file);
      setNewPhotoUrl(base64);
    } catch (err) {
      console.error(err);
      onShowNotification('Failed to read image file.');
    }
  };

  const handleAddShowcasePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) {
      onShowNotification('Please provide an image file or URL.');
      return;
    }

    const newPhoto: ShowcasePhoto = {
      id: `photo-${Date.now()}`,
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'Lights Out Studio Piece',
      category: newPhotoCategory.trim() || 'Custom'
    };

    const updated = {
      ...settings,
      showcasePhotos: [newPhoto, ...settings.showcasePhotos]
    };
    handleSaveSettings(updated);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setIsAddingPhoto(false);
  };

  const handleDeletePhoto = (id: string) => {
    // Note: window.confirm is blocked in some iframe environments, bypassing for now
    const updated = {
      ...settings,
      showcasePhotos: settings.showcasePhotos.filter(p => p.id !== id)
    };
    handleSaveSettings(updated);
  };

  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    const photos = [...settings.showcasePhotos];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    const temp = photos[index];
    photos[index] = photos[targetIdx];
    photos[targetIdx] = temp;
    const updated = { ...settings, showcasePhotos: photos };
    handleSaveSettings(updated);
  };

  const handleImportFromGallery = (item: GalleryItem) => {
    const newPhoto: ShowcasePhoto = {
      id: `photo-gal-${item.id}-${Date.now()}`,
      url: item.imageUrl,
      caption: item.title,
      category: item.categoryLabel
    };
    const updated = {
      ...settings,
      showcasePhotos: [newPhoto, ...settings.showcasePhotos]
    };
    handleSaveSettings(updated);
    onShowNotification(`Added "${item.title}" to background showcase!`);
  };

  const activeScene = settings.scenes[activeSceneIndex] || settings.scenes[0];

  return (
    <div className="space-y-6" id="live-splash-studio">
      {/* Studio Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#071329] via-[#081b3b] to-[#040817] border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#00f0ff] shrink-0">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-lg sm:text-xl text-white tracking-wider">
                LIVE SPLASH SCREEN STUDIO
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                CYBERPUNK ENGINE
              </span>
            </div>
            <p className="text-xs text-gray-300 font-tech mt-1">
              Customize the Matrix rain canvas, dual-column scrolling tattoo feed, and scene messaging.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFullscreenPreviewOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-heading font-bold text-xs uppercase tracking-wider hover:opacity-90 transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            <Eye className="w-4 h-4" />
            <span>Fullscreen Preview</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
            title="Reset to defaults"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Studio 2-Column Layout: Controls & Live Preview Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 Cols): Studio Controls, Sliders & Scene Editor */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: BOOT BEHAVIOR & VISUAL SLIDERS */}
          <div className="p-5 rounded-2xl bg-[#080e1c] border border-cyan-500/30 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                  Engine & Visual Controls
                </h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-mono text-gray-300">
                  {settings.enabled ? 'Splash Enabled' : 'Splash Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={e => handleSliderChange('enabled', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Boot Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSliderChange('showMode', 'always')}
                className={`p-3 rounded-xl border text-left transition ${
                  settings.showMode === 'always'
                    ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">Every Launch</span>
                  {settings.showMode === 'always' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-gray-400 font-tech mt-1">
                  Shows the animated splash screen every time anyone visits or refreshes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSliderChange('showMode', 'first_time_only')}
                className={`p-3 rounded-xl border text-left transition ${
                  settings.showMode === 'first_time_only'
                    ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'bg-black/40 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">First-Time Visitors Only</span>
                  {settings.showMode === 'first_time_only' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-gray-400 font-tech mt-1">
                  Welcomes new clients and PWA installations once, then boots directly to studio.
                </p>
              </button>
            </div>

            {/* Profile Avatar URL */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-cyan-400" />
                  Profile Avatar URL
                </span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  placeholder="Paste URL or upload image"
                  value={settings.avatarUrl || ''}
                  onChange={e => handleSliderChange('avatarUrl', e.target.value)}
                  className="flex-1 bg-black/60 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-tech"
                />
                <label className="shrink-0 p-2 rounded-xl bg-cyan-950 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-900 transition cursor-pointer flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const base64 = await uploadLargeMedia(file);
                        handleSliderChange('avatarUrl', base64);
                        onShowNotification('Avatar image uploaded successfully!');
                      } catch (err) {
                        console.error(err);
                        onShowNotification('Failed to read image file.');
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Artwork Visibility Slider (20% to 95%) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Artwork Visibility (Dual-Column Stream)
                </span>
                <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/40">
                  {settings.artworkVisibility}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="5"
                value={settings.artworkVisibility}
                onChange={e => handleSliderChange('artworkVisibility', Number(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                <span>Subtle (20%)</span>
                <span>Balanced (65%)</span>
                <span>Vivid Punch (95%)</span>
              </div>
            </div>

            {/* Overlay Darkness Slider (10% to 80%) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Radial Overlay Darkness
                </span>
                <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/40">
                  {settings.overlayDarkness}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={settings.overlayDarkness}
                onChange={e => handleSliderChange('overlayDarkness', Number(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                <span>Light Vignette (10%)</span>
                <span>Optimal Legibility (35%)</span>
                <span>Dark Obsidian (80%)</span>
              </div>
            </div>

            {/* Visual Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-gray-800 text-xs font-mono cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showMatrixRain}
                  onChange={e => handleSliderChange('showMatrixRain', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
                <span className="text-gray-300">Matrix Rain</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-gray-800 text-xs font-mono cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showDualFeed}
                  onChange={e => handleSliderChange('showDualFeed', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
                <span className="text-gray-300">Dual Artwork Feed</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-gray-800 text-xs font-mono cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showScanlines}
                  onChange={e => handleSliderChange('showScanlines', e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
                <span className="text-gray-300">CRT Scanlines</span>
              </label>
            </div>
          </div>

          {/* SECTION 2: SCENE MESSAGING & BULLET EDITOR */}
          <div className="p-5 rounded-2xl bg-[#080e1c] border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                  Animated Scene Content (5 Scenes)
                </h4>
              </div>
              <button
                onClick={() => handleSaveSettings(settings)}
                className="px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Scenes</span>
              </button>
            </div>

            {/* Scene Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {settings.scenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  onClick={() => setActiveSceneIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap border transition ${
                    activeSceneIndex === idx
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-black/50 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  Scene 0{idx + 1}: {scene.title.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Active Scene Editor Form */}
            {activeScene && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">
                    TOP BADGE / PILL TEXT:
                  </label>
                  <input
                    type="text"
                    value={activeScene.badge}
                    onChange={e => handleUpdateCurrentScene('badge', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-cyan-300 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">
                    MAIN HEADLINE TITLE:
                  </label>
                  <input
                    type="text"
                    value={activeScene.title}
                    onChange={e => handleUpdateCurrentScene('title', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-white font-heading font-bold text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">
                    SUBTITLE DESCRIPTION:
                  </label>
                  <textarea
                    rows={2}
                    value={activeScene.subtitle}
                    onChange={e => handleUpdateCurrentScene('subtitle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-gray-300 font-tech text-xs focus:outline-none"
                  />
                </div>

                {/* Bullet Points */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-mono text-gray-400">
                      FEATURE BULLET POINTS:
                    </label>
                    <button
                      type="button"
                      onClick={handleAddBulletPoint}
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Bullet
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activeScene.bulletPoints.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bullet}
                          onChange={e => handleUpdateBulletPoint(bIdx, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-gray-800 focus:border-cyan-400 text-xs font-mono text-gray-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBulletPoint(bIdx)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Button Text & Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      PRIMARY BUTTON TEXT:
                    </label>
                    <input
                      type="text"
                      value={activeScene.ctaText}
                      onChange={e => handleUpdateCurrentScene('ctaText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      DESTINATION ACTION:
                    </label>
                    <select
                      value={activeScene.ctaAction}
                      onChange={e => handleUpdateCurrentScene('ctaAction', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-gray-800 focus:border-cyan-400 text-cyan-300 font-mono text-xs focus:outline-none"
                    >
                      <option value="enter">Enter Studio (Home)</option>
                      <option value="booking">Direct to Booking (-15%)</option>
                      <option value="gallery">Direct to Flash & Gallery</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: SHOWCASE PHOTOS REORDER & UPLOAD */}
          <div className="p-5 rounded-2xl bg-[#080e1c] border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-cyan-400" />
                <h4 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                  Showcase Photos ({settings.showcasePhotos.length})
                </h4>
              </div>
              <button
                onClick={() => setIsAddingPhoto(!isAddingPhoto)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-bold text-xs uppercase tracking-wider hover:opacity-90 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
            </div>

            {/* Quick Upload Modal / Accordion */}
            {isAddingPhoto && (
              <form onSubmit={handleAddShowcasePhoto} className="p-4 rounded-xl bg-black/60 border border-cyan-400/40 space-y-3">
                <h5 className="text-xs font-mono font-bold text-cyan-300">ADD NEW SHOWCASE PHOTO</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      CAPTION / TITLE:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Skull Sleeve by Tex"
                      value={newPhotoCaption}
                      onChange={e => setNewPhotoCaption(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#080d1a] border border-gray-700 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      TAG / CATEGORY:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Realism, Cover-Up, Studio"
                      value={newPhotoCategory}
                      onChange={e => setNewPhotoCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#080d1a] border border-gray-700 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">
                    UPLOAD FROM CHROMEBOOK / PHONE:
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
                  />
                </div>

                {newPhotoUrl && (
                  <div className="flex items-center gap-3 pt-1">
                    <img src={newPhotoUrl} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-cyan-400" />
                    <span className="text-xs font-mono text-emerald-400">Ready to add!</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingPhoto(false)}
                    className="px-3 py-1 rounded-lg text-xs font-mono text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs hover:opacity-90"
                  >
                    Save Photo
                  </button>
                </div>
              </form>
            )}

            {/* Quick 1-Click Import from Existing Portfolio */}
            {galleryItems.length > 0 && (
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <span className="text-[11px] font-mono text-gray-400 block mb-2">
                  QUICK ADD FROM EXISTING PORTFOLIO:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {(galleryItems || []).slice(0, 10).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleImportFromGallery(item)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-cyan-950 border border-gray-700 hover:border-cyan-400 text-[10px] font-mono text-gray-300 hover:text-cyan-300 transition whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3 h-3 text-cyan-400" />
                      <span>{item.title.substring(0, 20)}...</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo List with Reorder and Delete Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {settings.showcasePhotos.map((photo, pIdx) => (
                <div
                  key={photo.id}
                  className="p-2.5 rounded-xl bg-black/50 border border-gray-800 hover:border-cyan-500/40 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-12 h-12 rounded-lg object-cover border border-cyan-400/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-gray-200 truncate">
                        {photo.caption}
                      </p>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {photo.category || 'Tattoo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={pIdx === 0}
                      onClick={() => handleMovePhoto(pIdx, 'up')}
                      className="p-1 rounded bg-gray-900 text-gray-400 hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={pIdx === settings.showcasePhotos.length - 1}
                      onClick={() => handleMovePhoto(pIdx, 'down')}
                      className="p-1 rounded bg-gray-900 text-gray-400 hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1 rounded bg-gray-900 text-gray-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Real-Time Live Preview Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#080e1c] border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h4 className="font-heading font-bold text-xs text-white uppercase tracking-wider">
                Live Engine Preview
              </h4>
            </div>

            {/* Mobile / Desktop Simulator Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-gray-800">
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  previewMode === 'mobile'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Mobile 9:16 Aspect Ratio"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono">9:16</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  previewMode === 'desktop'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Desktop Responsive"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono">Full</span>
              </button>
            </div>
          </div>

          {/* Interactive Preview Container */}
          <div className="flex justify-center items-center w-full">
            {previewMode === 'mobile' ? (
              // Realistic Cyberpunk Smartphone Frame
              <div className="w-full max-w-[340px] aspect-[9/18.5] rounded-[36px] p-2.5 bg-black border-4 border-gray-800 shadow-[0_0_40px_rgba(0,240,255,0.25)] relative overflow-hidden flex flex-col">
                {/* Phone Speaker & Camera Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-gray-900 rounded-full z-40 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-black border border-cyan-500/40" />
                </div>

                <div className="w-full h-full rounded-[26px] overflow-hidden relative">
                  <MatrixSplashScreen
                    settings={settings}
                    onEnter={dest => onShowNotification(`Simulated Enter: ${dest || 'home'}`)}
                    isPreview={true}
                  />
                </div>
              </div>
            ) : (
              // Desktop Aspect Ratio Frame
              <div className="w-full h-[580px] rounded-2xl overflow-hidden relative border-2 border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <MatrixSplashScreen
                  settings={settings}
                  onEnter={dest => onShowNotification(`Simulated Enter: ${dest || 'home'}`)}
                  isPreview={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      {isFullscreenPreviewOpen && (
        <div className="fixed inset-0 z-[120] bg-black">
          <MatrixSplashScreen
            settings={settings}
            onEnter={() => setIsFullscreenPreviewOpen(false)}
            isPreview={true}
            onClosePreview={() => setIsFullscreenPreviewOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
