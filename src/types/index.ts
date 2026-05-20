export interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  bullets: string[];
}

export interface ResumeData {
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: string[];
}

export interface OptimizationProposal {
  id: number;
  section: "summary" | "experience";
  item_index: number;
  bullet_index: number | null;
  original_line: string;
  proposed_line: string;
  keyword_added: string;
}

export interface OptimizationResult {
  message: string;
  file_name: string;
  download_url: string;
  cover_letter: string;
}

export interface LocationState {
  proposals: OptimizationProposal[];
  outputFileName: string;
}
