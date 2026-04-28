export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type RightsWorkflowStep = {
  title: string;
  summary: string;
  actions: string[];
};

export type JurisdictionNote = {
  region: string;
  title: string;
  detail: string;
  emphasis: string;
};

export type EvidenceItem = {
  title: string;
  detail: string;
  status: 'critical' | 'recommended' | 'optional';
};

export type PlaybookSection = {
  title: string;
  summary: string;
  bullets: string[];
};

export type TemplateCard = {
  title: string;
  detail: string;
  snippet: string;
};

export type PricingTier = {
  name: string;
  monthly: number;
  annual: number;
  audience: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: 'Ownership Signal',
    value: 'Human-authored layers',
    detail: 'Original lyrics, vocal takes, arrangement edits, and mix revisions create the strongest claim surface.',
  },
  {
    label: 'Release Risk',
    value: 'Platform terms first',
    detail: 'Commercial permission can change by plan tier even when the track itself is not fully copyrightable.',
  },
  {
    label: 'Evidence Priority',
    value: 'Session trail',
    detail: 'Prompts, stems, DAW files, collaborator contracts, and release notes matter more than screenshots alone.',
  },
];

export const rightsLanes = [
  {
    title: 'Composition Rights',
    summary: 'Protect the human-authored pieces: lyrics, topline melody refinements, structure, and arrangement notes.',
  },
  {
    title: 'Master Recording Rights',
    summary: 'Claim the human contribution in performances, editing, mixing, stem layering, and post-production decisions.',
  },
  {
    title: 'Platform License Rights',
    summary: 'Read the generator’s terms separately so you know who can monetize, distribute, revoke, or retrain on the output.',
  },
];

export const workflowSteps: RightsWorkflowStep[] = [
  {
    title: 'Before generation',
    summary: 'Define what you will create yourself before you touch the model.',
    actions: [
      'Write or outline original lyrics, topline ideas, and arrangement intent.',
      'Choose the exact plan tier on the generator and save the pricing/terms snapshot.',
      'Set up a project folder for prompts, exports, stems, agreements, and revision notes.',
    ],
  },
  {
    title: 'During generation',
    summary: 'Document what the model did and what you directed.',
    actions: [
      'Save prompts, output versions, and rejected takes.',
      'Mark which lines, hooks, or motifs came from you versus the tool.',
      'Capture platform URLs used for terms, usage rules, and commercial allowances.',
    ],
  },
  {
    title: 'After editing',
    summary: 'Increase the human-authorship footprint before release.',
    actions: [
      'Add live vocals, live instruments, arrangement edits, or substantial DAW restructuring.',
      'Keep timestamped session files showing creative decisions and revisions.',
      'Collect split sheets and work-for-hire language from collaborators.',
    ],
  },
  {
    title: 'Before release',
    summary: 'Package the evidence trail into a clean rights memo.',
    actions: [
      'Prepare a one-page summary of what is human-authored and what is AI-assisted.',
      'Disclose AI-generated portions accurately in registration or distributor forms.',
      'Confirm plan-tier rights, sampling/training restrictions, and territorial limits.',
    ],
  },
];

export const jurisdictions: JurisdictionNote[] = [
  {
    region: 'United States',
    title: 'Human authorship remains the anchor',
    detail: 'US registration generally excludes purely AI-generated material. Claim the human-authored lyrics, performances, arrangement, and production choices.',
    emphasis: 'Best practice: document exactly what you contributed and disclaim the rest.',
  },
  {
    region: 'European Union',
    title: 'Original intellectual creation standard',
    detail: 'Rights depend on whether the final work reflects the author’s own creative choices rather than output delivered with minimal intervention.',
    emphasis: 'Best practice: show meaningful selection, editing, and post-generation creativity.',
  },
  {
    region: 'United Kingdom',
    title: 'Computer-generated rules still matter',
    detail: 'UK law can treat computer-generated works differently, but practical ownership still turns on contracts, terms, and demonstrable human direction.',
    emphasis: 'Best practice: pair platform rights review with collaborator contracts and release notes.',
  },
];

export const evidenceChecklist: EvidenceItem[] = [
  {
    title: 'Original lyric drafts or topline sketches',
    detail: 'These are the clearest proof that the composition contains human-authored expression.',
    status: 'critical',
  },
  {
    title: 'Prompt log and generation history',
    detail: 'Useful for context, but stronger when paired with revisions and human edits.',
    status: 'recommended',
  },
  {
    title: 'DAW sessions, stems, and revision exports',
    detail: 'Shows the human role in arrangement, mixing, and transformation of the raw output.',
    status: 'critical',
  },
  {
    title: 'Vocalist, producer, and instrumentalist agreements',
    detail: 'Clarifies chain of title for every human contributor attached to the release.',
    status: 'critical',
  },
  {
    title: 'Platform ToS snapshot and plan receipt',
    detail: 'Commercial rights often depend on the exact subscription level in force at creation time.',
    status: 'critical',
  },
  {
    title: 'Release memo for distributors or counsel',
    detail: 'A concise explanation of AI use, human edits, and rights boundaries prevents confusion later.',
    status: 'recommended',
  },
];

export const quickPrompts = [
  'I used Suno Pro, wrote all the lyrics myself, and added vocals in Ableton. What can I claim?',
  'Can I register a sound recording if the instrumental started in Udio but I rebuilt the arrangement?',
  'What clauses should I verify before releasing an AI-assisted track on streaming platforms?',
  'Help me draft a rights memo for a label reviewing an AI-generated demo.',
];

export const playbookSections: PlaybookSection[] = [
  {
    title: 'Track intake',
    summary: 'Start every song with a simple rights intake so nobody guesses later.',
    bullets: [
      'Name the generator, plan tier, output date, and relevant terms URL.',
      'List every human contributor and whether they are work-for-hire, featured, or co-authors.',
      'Record whether lyrics, melody, stems, arrangement, or final mix were materially changed by humans.',
    ],
  },
  {
    title: 'Ownership framing',
    summary: 'Separate ownership into layers instead of asking one blunt question.',
    bullets: [
      'Composition: lyrics, melody refinements, structure, and arrangement choices.',
      'Master: performances, recordings, engineering, mix, and edits added by humans.',
      'License: what the platform grants, restricts, or retains regardless of authorship.',
    ],
  },
  {
    title: 'Release readiness',
    summary: 'Prepare for distribution, publishing, and registration before the song goes public.',
    bullets: [
      'Check whether the platform limits raw output uploads or unpaid commercial use.',
      'Keep a concise disclosure describing the AI role and the human-authored contribution.',
      'Make sure split sheets, work-for-hire language, and session ownership are signed.',
    ],
  },
  {
    title: 'Escalation triggers',
    summary: 'Certain scenarios deserve counsel review before release.',
    bullets: [
      'High-value sync, label acquisition, catalog sale, or investor diligence.',
      'Ambiguous terms around ownership, training reuse, or exclusivity.',
      'Multiple collaborators disagreeing on whether the output is transformatively human-authored.',
    ],
  },
];

export const templateCards: TemplateCard[] = [
  {
    title: 'Rights memo opener',
    detail: 'Use this in internal release notes or when briefing counsel.',
    snippet: 'This track incorporates AI-generated material from [platform] under the [plan tier] terms dated [date]. Human-authored contributions include [lyrics / vocals / arrangement / mix decisions], which are documented in the attached session files and drafts.',
  },
  {
    title: 'Work-for-hire clarification',
    detail: 'Good for vocalists, editors, and co-producers contributing to an AI-assisted release.',
    snippet: 'Contributor confirms that all performances, recordings, and edits delivered for this release are specially commissioned for the project and assigned to the project owner, subject to any separately listed retained rights.',
  },
  {
    title: 'Distributor disclosure note',
    detail: 'Useful when a platform or distributor asks whether AI was involved.',
    snippet: 'AI tools were used in the ideation or source-generation process, and the final commercial release includes substantial human-authored lyrics, arrangement, performance, and production elements documented in the project files.',
  },
];

export const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    monthly: 0,
    annual: 0,
    audience: 'Independent artists validating a release',
    description: 'A clean entry point for basic platform checks, rights framing, and agent guidance.',
    features: [
      'Rights dashboard and workflow checklists',
      'Platform intelligence database access',
      'Guided AI rights agent sessions',
      'Basic export-ready release memo outline',
    ],
    cta: 'Open workspace',
    href: '/agent',
  },
  {
    name: 'Pro',
    monthly: 24,
    annual: 20,
    audience: 'Creators shipping songs regularly',
    description: 'Deeper analysis for repeated releases, stronger evidence packets, and faster review workflows.',
    features: [
      'Everything in Starter',
      'Expanded platform comparison and watchlists',
      'Rights memo templates and release packet guidance',
      'Priority platform analysis workflows',
      'Track-by-track preparation for registration or distributor review',
    ],
    cta: 'Launch Pro workflow',
    href: '/playbooks',
    featured: true,
  },
  {
    name: 'Studio',
    monthly: 79,
    annual: 65,
    audience: 'Labels, managers, and catalog teams',
    description: 'A structured review layer for larger rosters, multiple collaborators, and higher-stakes releases.',
    features: [
      'Everything in Pro',
      'Multi-track review playbooks',
      'Counsel-ready evidence packaging',
      'Team-facing summaries for A&R and release ops',
      'Advanced support for custom generator policies',
    ],
    cta: 'Talk to the agent',
    href: '/agent',
  },
];

export const pricingFaq = [
  {
    question: 'Does RightsGuard AI replace a music lawyer?',
    answer: 'No. It helps you prepare, document, and understand the likely rights picture so formal counsel can review high-stakes matters faster.',
  },
  {
    question: 'Why separate copyright from platform rights?',
    answer: 'Because a platform can grant you commercial usage rights while the underlying AI-generated output still lacks standard copyright protection on its own.',
  },
  {
    question: 'What makes a release packet stronger?',
    answer: 'Human-authored lyrics, session evidence, collaborator paperwork, and a clear explanation of what the AI generated versus what the team changed.',
  },
];
