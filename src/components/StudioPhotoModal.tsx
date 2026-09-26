import { uploadLargeMedia } from "../services/mediaStore";
import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Link as LinkIcon,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { ArtistProfile } from '../types';
import { storageService } from '../services/storage';

interface StudioPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ArtistProfile;
  onPhotoUpdated: (updatedProfile: ArtistProfile) => void;
}

export const StudioPhotoModal: React.FC<StudioPhotoModalProps> = ({
  isOpen,
  onClose,
  profile,
  onPhotoUpdated
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string>(profile.avatarUrl);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await uploadLargeMedia(file);
      setSelectedPhoto(base64);
    } catch (err) {
      console.error('Failed to read image file', err);
      alert('Could not read image file. Please try another image.');
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setSelectedPhoto(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleSave = () => {
    const updated: ArtistProfile = {
      ...profile,
      avatarUrl: selectedPhoto
    };
    storageService.saveProfile(updated);
    onPhotoUpdated(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#080d1a] border-2 border-cyan-400/60 shadow-[0_0_35px_rgba(0,240,255,0.3)] p-5 sm:p-7 my-6 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-cyan-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#00f0ff]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg sm:text-xl text-white">
              PUT MY IMAGE IN THE STUDIO
            </h3>
            <p className="text-xs text-cyan-300 font-mono">
              Update Tex's Official Studio Artist Portrait
            </p>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-black/60 border border-cyan-500/30 mb-5">
          <div className="relative w-28 h-36 rounded-xl overflow-hidden border-2 border-cyan-400 shrink-0 shadow-[0_0_20px_rgba(0,240,255,0.3)] bg-gray-950">
            <img
              src={selectedPhoto}
              alt="Tex Studio Preview"
              className="w-full h-full object-cover filter contrast-105"
            />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-cyan-300">
              PREVIEW
            </div>
          </div>

          <div className="space-y-2 text-left">
            <h4 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Tex's Studio Portrait</span>
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              This image will be featured directly in the Studio Hero, About Tex screen, live header avatar, and quote highlights.
            </p>
            {isSaved && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved to Studio & Stored Locally!</span>
              </div>
            )}
          </div>
        </div>

        {/* Action 1: Upload from Chromebook / Phone Files */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-2">
              OPTION 1: UPLOAD FROM CHROMEBOOK / PHONE FILES
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border-2 border-dashed border-cyan-400 text-cyan-300 font-heading font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Select My Image File (JPG, PNG, WEBP)</span>
            </button>
          </div>

          {/* Action 2: Or Paste Image Web Link */}
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">
              OPTION 2: OR PASTE IMAGE URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://lightsouttattoo.site/... or image link"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-black/70 border border-gray-700 text-white text-xs font-mono focus:border-cyan-400 outline-none"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-mono font-bold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 text-gray-400 text-xs font-mono hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Photo to Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
