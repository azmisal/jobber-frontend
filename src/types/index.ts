
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

// src/types/index.ts

/**
 * =========================================================
 * UNIVERSAL RESUME TYPES
 * =========================================================
 *
 * IMPORTANT:
 * This architecture is intentionally dynamic.
 *
 * Different professions have different resume structures.
 *
 * We DO NOT hardcode:
 * - experience
 * - projects
 * - education
 * - skills
 *
 * Instead:
 * EVERYTHING becomes dynamic sections.
 *
 * This makes Jobber:
 * - profession agnostic
 * - future proof
 * - ATS scalable
 * - layout independent
 * - AI friendly
 *
 * =========================================================
 */

/* =========================================================
   BASICS
========================================================= */

export interface ResumeLink {
  label: string;
  url: string;
}

export interface ResumeBasics {
  full_name: string;

  headline: string;

  emails: string[];

  phones: string[];

  location: string;

  links: ResumeLink[];
}

/* =========================================================
   UNIVERSAL RESUME ITEM
========================================================= */

/**
 * Dynamic object for ANY profession.
 *
 * Examples:
 *
 * Software Engineer:
 * {
 *   title: "Backend Developer",
 *   subtitle: "Google",
 *   duration: "2022 - Present",
 *   bullets: []
 * }
 *
 * Doctor:
 * {
 *   title: "Cardiologist",
 *   hospital: "Apollo"
 * }
 *
 * Pilot:
 * {
 *   aircraft: "Boeing 737",
 *   hours: "3000"
 * }
 *
 * Researcher:
 * {
 *   paper: "AI in Medicine",
 *   conference: "NeurIPS"
 * }
 */

export interface ResumeItem {
  [key: string]: any;
}

/* =========================================================
   UNIVERSAL SECTION
========================================================= */

export interface ResumeSection {
  /**
   * Unique section id
   */
  id: string;

  /**
   * Original or AI-detected heading
   *
   * Examples:
   * - Experience
   * - Projects
   * - Publications
   * - Awards
   * - Skills
   * - Certifications
   */
  title: string;

  /**
   * Internal normalized type
   *
   * Examples:
   * - experience
   * - skills
   * - projects
   * - education
   * - custom
   */
  type: string;

  /**
   * Dynamic section content
   *
   * Can contain:
   * - strings
   * - objects
   */
  content: Array<string | ResumeItem>;

  /**
   * Original raw extracted text
   */
  raw_text: string;
}

/* =========================================================
   METADATA
========================================================= */

export interface ResumeMetadata {
  /**
   * Original resume section ordering
   */
  section_order: string[];

  /**
   * Optional parser confidence
   */
  parsing_confidence: number;

  embedded_links?: ResumeLink[];

  plain_resume_text?: string;
}

/* =========================================================
   MAIN RESUME DATA
========================================================= */

export interface ResumeData {
  basics: ResumeBasics;

  sections: ResumeSection[];

  metadata: ResumeMetadata;

  raw_resume_text: string;
}

/* =========================================================
   OPTIMIZATION
========================================================= */

export interface OptimizationProposal {
  id: number;

  /**
   * Section where modification happened
   */
  section_id: string;

  /**
   * Which content item changed
   */
  content_index: number;

  /**
   * Original line
   */
  original_text: string;

  /**
   * AI optimized line
   */
  proposed_text: string;

  /**
   * Keyword inserted
   */
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

/* =========================================================
   OPTIONAL HELPERS
========================================================= */

export interface ApiErrorResponse {
  detail?: string;

  message?: string;
}

export interface UploadResumeResponse {
  message: string;

  profile: ResumeData;
}

export interface GetProfileResponse {
  has_profile: boolean;

  data?: ResumeData;
}

export interface KeywordsResponse {
  keywords: string[];
}

export interface ProposalsResponse {
  proposals: OptimizationProposal[];
}
