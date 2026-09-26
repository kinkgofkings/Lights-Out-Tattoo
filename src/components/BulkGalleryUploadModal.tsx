import { uploadLargeMedia } from "../services/mediaStore";
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from "../data/categories";
import React, { useState, useRef } from 'react';
import {
  Upload,
  Layers,
  X,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertCircle,
  Tag
} from 'lucide-react';
import { storageService } from '../services/storage';
import { ArtCategoryKey, TattooCategoryKey } from '../types';

interface BulkGalleryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGalleryUpdated: () => void;
}

interface StagedImage {
  id: string;
  dataUrl: string;
  title: string;
  category: TattooCategoryKey;
  isCoverUp: boolean;
}

export const BulkGalleryUploadModal: React.FC<BulkGalleryUploadModalProps> = ({
  isOpen,
  onClose,
  onGalleryUpdated
}) => {
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<TattooCategoryKey>('realism');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<{ current: number; total: number; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savingStatus, setSavingStatus] = useState<{ current: number; total: number; title: string } | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setIsProcessing(true);
    const newStaged: StagedImage[] = [];

    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus({
        current: i + 1,
        total: files.length,
        name: file.name
      });

      try {
        const base64 = await uploadLargeMedia(file);
        // Format clean title from file name (e.g. "forearm_screech_owl.jpg" -> "Forearm Screech Owl")
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b\w/g, l => l.toUpperCase());

        const isCover = defaultCategory === 'coverups' || cleanName.toLowerCase().includes('cover');

        newStaged.push({
          id: `stage-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          dataUrl: base64,
          title: cleanName || `Tattoo Work #${stagedImages.length + i + 1}`,
          category: defaultCategory,
          isCoverUp: isCover
        });
      } catch (err) {
        console.warn('Failed to compress file (possibly unsupported format like HEIC)', file.name, err);
        failCount++;
      }

      // Small tick delay to allow DOM to paint progress smoothly
      await new Promise(resolve => setTimeout(resolve, 15));
    }

    setStagedImages(prev => [...prev, ...newStaged]);
    setIsProcessing(false);
    setProcessingStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (failCount > 0) {
      alert(`Warning: ${failCount} file(s) could not be processed. Please ensure your images are in standard web formats like JPG, PNG, or WEBP. Apple HEIC files may need to be converted first.`);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveStaged = (id: string) => {
    setStagedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleApplyCategoryToAll = (category: TattooCategoryKey) => {
    setDefaultCategory(category);
    setStagedImages(prev =>
      prev.map(item => ({
        ...item,
        category,
        isCoverUp: category === 'coverups' || item.isCoverUp
      }))
    );
  };

  const handleSaveAllToGallery = async () => {
    if (stagedImages.length === 0 || isSaving) return;

    setIsSaving(true);
    setSuccessCount(null);

    const total = stagedImages.length;
    let savedCount = 0;

    // Build payload items
    const itemsToSave = stagedImages.map(img => ({
      title: img.title.trim() || 'Custom Studio Tattoo',
      category: img.category,
      categoryLabel: CATEGORY_LABELS[img.category] || 'Black & Grey',
      imageUrl: img.dataUrl,
      description: `Custom artwork crafted by Tex at Lights Out Tattoo in Winchester, VA.`,
      sessionHours: 4,
      placement: 'Custom',
      isCoverUp: img.isCoverUp,
      tags: [img.category, 'Tex', 'WinchesterVA', 'CustomInk']
    }));

    try {
      // Use the bulk import method which commits all items to state and Firestore
      setSavingStatus({ current: 1, total, title: itemsToSave[0].title });
      await storageService.addGalleryItemsBulk(itemsToSave);
      savedCount = total;
    } catch (err) {
      console.error('Error during bulk gallery import', err);
      // Fallback to sequential save if batch fails
      for (let i = 0; i < itemsToSave.length; i++) {
        setSavingStatus({ current: i + 1, total, title: itemsToSave[i].title });
        try {
          storageService.createGalleryItem(itemsToSave[i]);
          savedCount++;
        } catch (itemErr) {
          console.error('Failed saving piece', itemsToSave[i].title, itemErr);
        }
      }
    }

    setSavingStatus(null);
    setIsSaving(false);
    setSuccessCount(savedCount);
    onGalleryUpdated();

    setTimeout(() => {
      setStagedImages([]);
      setSuccessCount(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#080d1a] border-2 border-cyan-400/60 shadow-[0_0_35px_rgba(0,240,255,0.3)] p-5 sm:p-7 my-6 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing || isSaving}
          className="absolute top-4 right-4 p-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-cyan-400 disabled:opacity-30 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#00f0ff]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg sm:text-xl text-white">
              BULK STUDIO GALLERY IMPORT
            </h3>
            <p className="text-xs text-cyan-300 font-mono">
              Upload multiple tattoo photos at once directly into your portfolio
            </p>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-xs text-gray-300 leading-relaxed mb-4">
          Select multiple images from your device (Chromebook, phone, or computer). Every image is automatically optimized for fast mobile viewing and saved to your cloud portfolio gallery. <br/>
          <span className="text-cyan-400 font-bold">Supported formats: JPG, PNG, WEBP. (Please convert Apple HEIC photos before uploading).</span>
        </p>

        {/* File Drop / Select Area */}
        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*"
            onChange={handleFilesSelected}
            className="hidden"
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isProcessing && !isSaving) fileInputRef.current?.click();
            }}
            className={`w-full py-6 px-4 rounded-xl border-2 border-dashed cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'bg-cyan-950/60 border-cyan-300 scale-[1.01]'
                : 'bg-gradient-to-r from-cyan-950/30 to-blue-950/30 hover:from-cyan-950/50 hover:to-blue-950/50 border-cyan-400/80'
            }`}
          >
            <Upload className={`w-8 h-8 text-cyan-400 ${isProcessing ? 'animate-spin' : 'animate-bounce'}`} />
            <span className="text-sm font-heading font-bold text-cyan-300 uppercase tracking-wider">
              {isDragging ? 'Drop Tattoo Photos Here' : 'Click or Drag Multiple Tattoo Photos'}
            </span>
            <span className="text-[11px] font-mono text-gray-400 font-normal text-center">
              Select 10, 20, 45+ images at once • JPG, PNG, WEBP supported
            </span>
          </div>
        </div>

        {/* Processing Progress Bar */}
        {isProcessing && processingStatus && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Preparing image {processingStatus.current} of {processingStatus.total}
              </span>
              <span>{Math.round((processingStatus.current / processingStatus.total) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-150"
                style={{ width: `${(processingStatus.current / processingStatus.total) * 100}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-gray-400 truncate">
              {processingStatus.name}
            </p>
          </div>
        )}

        {/* Saving Progress Bar */}
        {isSaving && savingStatus && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-950/80 border border-cyan-400 space-y-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Saving to portfolio {savingStatus.current} of {savingStatus.total}
              </span>
              <span>{Math.round((savingStatus.current / savingStatus.total) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-150"
                style={{ width: `${(savingStatus.current / savingStatus.total) * 100}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-gray-400 truncate">
              Publishing "{savingStatus.title}"
            </p>
          </div>
        )}

        {/* Default Category selector / Batch assign */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-2.5 rounded-xl bg-black/50 border border-gray-800">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono text-gray-400">Category for New Photos:</span>
            <select
              value={defaultCategory}
              onChange={e => handleApplyCategoryToAll(e.target.value as TattooCategoryKey)}
              className="px-2.5 py-1 rounded bg-black border border-cyan-500/40 text-xs font-mono text-cyan-300 outline-none"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {stagedImages.length > 0 && (
            <button
              type="button"
              onClick={() => handleApplyCategoryToAll(defaultCategory)}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 underline"
            >
              Set all {stagedImages.length} to this category
            </button>
          )}
        </div>

        {/* Staged Images List */}
        {stagedImages.length > 0 && (
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
              <span>{stagedImages.length} Photos Ready to Import</span>
              <button
                disabled={isSaving || isProcessing}
                onClick={() => setStagedImages([])}
                className="text-red-400 hover:underline text-[11px] disabled:opacity-40"
              >
                Clear All ({stagedImages.length})
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {stagedImages.map(img => (
                <div
                  key={img.id}
                  className="p-2 rounded-xl bg-black/60 border border-cyan-500/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={img.dataUrl}
                      alt={img.title}
                      className="w-12 h-12 rounded-lg object-cover border border-cyan-400 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={img.title}
                        disabled={isSaving}
                        onChange={e => {
                          const val = e.target.value;
                          setStagedImages(prev =>
                            prev.map(item =>
                              item.id === img.id ? { ...item, title: val } : item
                            )
                          );
                        }}
                        className="w-full px-2 py-1 rounded bg-black/80 border border-gray-700 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                        placeholder="Piece title..."
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={img.category}
                          disabled={isSaving}
                          onChange={e => {
                            const newCat = e.target.value as TattooCategoryKey;
                            setStagedImages(prev =>
                              prev.map(item =>
                                item.id === img.id
                                  ? { ...item, category: newCat, isCoverUp: newCat === 'coverups' }
                                  : item
                              )
                            );
                          }}
                          className="px-1.5 py-0.5 rounded bg-black/80 border border-gray-800 text-[10px] font-mono text-cyan-400 outline-none"
                        >
                          {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {img.isCoverUp && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 font-mono">
                            Cover-up
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isSaving}
                    onClick={() => handleRemoveStaged(img.id)}
                    className="p-1.5 rounded bg-red-950/60 border border-red-500/30 text-red-400 hover:text-white disabled:opacity-30 shrink-0"
                    title="Remove from batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Confirmation Banner */}
        {successCount !== null && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-mono flex items-center gap-2 mb-4 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Successfully published {successCount} images to your studio portfolio!</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 text-gray-400 text-xs font-mono hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={stagedImages.length === 0 || isProcessing || isSaving}
            onClick={handleSaveAllToGallery}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-40 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing to Gallery...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish {stagedImages.length} Images to Gallery</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
