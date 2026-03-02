export interface Subtitle {
  id?: string;
  sequence_number: number;
  start_time: string;
  end_time: string;
  original_text: string;
  translated_text?: string;
  tags?: string;
  is_translated?: boolean;
}

export interface SubtitleBatch {
  id: string;
  file_name: string;
  file_format: string;
  total_lines: number;
  translated_lines: number;
  status: 'pending' | 'processing' | 'completed';
  subtitles?: Subtitle[];
  created_at: string;
}

export interface LanguagePair {
  id: string;
  code: string;
  display_name: string;
  source_language: string;
  base_language: string;
  secondary_language: string;
  description?: string;
}

export interface TranslationProject {
  id: string;
  title: string;
  description?: string;
  language_pair_id: string;
  created_at: string;
  updated_at: string;
  batches?: SubtitleBatch[];
}