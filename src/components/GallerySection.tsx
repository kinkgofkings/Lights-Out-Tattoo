import { MediaRenderer } from "./MediaRenderer";
import { CATEGORY_LABELS } from "../data/categories";
import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  PlusCircle,
  Eye,
  Layers,
  Sparkles,
  Clock,
  Tag,
  Flame,
  Trash2
} from 'lucide-react';
import { ArtCategoryKey, GalleryItem } from '../types';
import { LightboxModal } from './LightboxModal';

interface GallerySectionProps {
  items: GalleryItem[];
  onOpenAdminUpload: () => void;
  onBookSimilar: (item: GalleryItem) => void;
  isAdmin?: boolean;
  onDeleteItem?: (id: string) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  items,
  onOpenAdminUpload,
  onBookSimilar,
  isAdmin = false,
  onDeleteItem
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ArtCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLightboxItem, setActiveLightboxItem] = useState<GalleryItem | null>(null);

  const categories: { key: ArtCategoryKey; label: string; icon: string; count?: number }[] = [
    { key: 'all', label: CATEGORY_LABELS['all'], icon: '⚡' },
    { key: 'black_and_grey', label: CATEGORY_LABELS['black_and_grey'], icon: '🦅' },
    { key: 'realism', label: CATEGORY_LABELS['realism'], icon: '🗿' },
    { key: 'color', label: CATEGORY_LABELS['color'], icon: '🌈' },
    { key: 'traditional', label: CATEGORY_LABELS['traditional'], icon: '🌹' },
    { key: 'coverups', label: CATEGORY_LABELS['coverups'], icon: '🔄' },
    { key: 'tribal', label: CATEGORY_LABELS['tribal'], icon: '🛡️' },
    { key: 'mechanical', label: CATEGORY_LABELS['mechanical'], icon: '⚙️' },
    { key: 'steampunk', label: CATEGORY_LABELS['steampunk'], icon: '🕰️' },
    { key: 'new_skool', label: CATEGORY_LABELS['new_skool'], icon: '🎨' },
    { key: 'portraits', label: CATEGORY_LABELS['portraits'], icon: '👤' },
    { key: 'artwork', label: CATEGORY_LABELS['artwork'], icon: '🖼️' },
    { key: 'photography', label: CATEGORY_LABELS['photography'], icon: '📷' },
    { key: 'digital_graphics', label: CATEGORY_LABELS['digital_graphics'], icon: '💻' },
    { key: 'miscellaneous', label: CATEGORY_LABELS['miscellaneous'], icon: '🧩' }
  ];

  // Dynamic filter
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.placement && item.placement.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <section className="py-8 px-4 sm:px-6 max-w-7xl mx-auto" id="gallery-section">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-tech font-bold text-xs uppercase tracking-widest">
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>20+ Years Portfolio • {items.length} Works</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-white mt-1">
            PORTFOLIO <span className="text-cyan-400">GALLERY</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
            Tap any tattoo for high-definition lightbox, swipe features, and cover-up before/after sliders.
          </p>
        </div>

        {/* Action: Add Image / Admin Shortcut */}
        <button
          onClick={onOpenAdminUpload}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-300 text-xs font-mono font-bold transition shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        >
          <PlusCircle className="w-4 h-4 text-cyan-400" />
          <span>Upload Image to Gallery (Admin)</span>
        </button>
      </div>

      {/* Art Category Selector Pills */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max">
          {categories.map(cat => {
            const count =
              cat.key === 'all'
                ? items.length
                : items.filter(i => i.category === cat.key).length;
            const isSelected = selectedCategory === cat.key;

            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black border-cyan-300 font-bold shadow-[0_0_15px_rgba(0,240,255,0.5)] scale-105'
                    : 'bg-[#091122]/90 text-gray-300 border-cyan-500/20 hover:border-cyan-400/60 hover:text-cyan-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-black/40 text-cyan-100'
                      : 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filter Strip */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Search by keyword, skull, owl, cover-up, forearm, machine..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#091122]/80 border border-cyan-500/30 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,240,255,0.3)] font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#080e1c]/80 border border-cyan-500/20">
          <SlidersHorizontal className="w-10 h-10 text-cyan-500/50 mx-auto mb-3" />
          <h3 className="font-heading text-lg text-white font-bold">No Pieces Match This Filter</h3>
          <p className="text-xs text-gray-400 mt-1">
            Try resetting your search query or pick a different art category above.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-cyan-950 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900"
          >
            Show All Works
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => setActiveLightboxItem(item)}
              className="group relative rounded-xl bg-[#080d1a] border border-cyan-500/25 overflow-hidden shadow-lg hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all duration-300 cursor-pointer flex flex-col"
              id={`gallery-item-${item.id}`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[3/4] overflow-hidden bg-black">
                <MediaRenderer
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter contrast-105"
                />

                {/* Cyber Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-transparent to-black/20 opacity-80 group-hover:opacity-60 transition-opacity" />

                {/* Badges on Image */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-cyan-500/50 text-cyan-300">
                    {item.categoryLabel}
                  </span>
                  {item.isCoverUp && (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950/90 backdrop-blur-md border border-blue-400/60 text-cyan-200 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      <span>Before/After</span>
                    </span>
                  )}
                </div>

                {/* Admin Quick Delete Button */}
                {isAdmin && onDeleteItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-950/80 border border-red-500/60 text-red-400 hover:text-white hover:bg-red-900 transition z-20 shadow-md"
                    title="Delete piece from gallery"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Hover Eye Trigger */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-950/30 backdrop-blur-[2px]">
                  <div className="p-3 rounded-full bg-black/80 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_#00f0ff] transform scale-75 group-hover:scale-100 transition-transform">
                    <Eye className="w-6 h-6" />
                  </div>
                </div>

                {/* Bottom Details Banner on Image */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-gray-300">
                  {item.sessionHours && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 border border-gray-700">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{item.sessionHours} hrs</span>
                    </span>
                  )}
                  {item.placement && (
                    <span className="px-1.5 py-0.5 rounded bg-black/70 border border-gray-700 truncate max-w-[140px]">
                      {item.placement}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-cyan-500/15">
                  {(item.tags || []).slice(0, 3).map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal with Swipe Support */}
      <LightboxModal
        item={activeLightboxItem}
        items={filteredItems}
        isOpen={Boolean(activeLightboxItem)}
        onClose={() => setActiveLightboxItem(null)}
        onSelect={item => setActiveLightboxItem(item)}
        onBookSimilar={item => onBookSimilar(item)}
        isAdmin={isAdmin}
        onDeleteItem={onDeleteItem}
      />
    </section>
  );
};
