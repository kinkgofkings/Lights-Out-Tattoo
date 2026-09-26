import { ArtCategoryKey, TattooCategoryKey } from '../types';

export const CATEGORY_LABELS: Record<ArtCategoryKey, string> = {
  all: 'All Masterpieces',
  black_and_grey: 'Black & Grey',
  realism: 'Realism',
  color: 'Color',
  traditional: 'Traditional',
  coverups: 'Cover-ups',
  tribal: 'Tribal',
  mechanical: 'Mechanical',
  steampunk: 'Steampunk',
  new_skool: 'New Skool',
  portraits: 'Portraits',
  artwork: 'Artwork',
  photography: 'Photography',
  digital_graphics: 'Digital Graphics',
  miscellaneous: 'Miscellaneous'
};

export const CATEGORY_OPTIONS: { value: TattooCategoryKey; label: string }[] = [
  { value: 'black_and_grey', label: 'Black & Grey' },
  { value: 'realism', label: 'Realism' },
  { value: 'color', label: 'Color' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'coverups', label: 'Cover-ups' },
  { value: 'tribal', label: 'Tribal' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'steampunk', label: 'Steampunk' },
  { value: 'new_skool', label: 'New Skool' },
  { value: 'portraits', label: 'Portraits' },
  { value: 'artwork', label: 'Artwork' },
  { value: 'photography', label: 'Photography' },
  { value: 'digital_graphics', label: 'Digital Graphics' },
  { value: 'miscellaneous', label: 'Miscellaneous' }
];
