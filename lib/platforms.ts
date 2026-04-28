export interface Platform {
  id: string;
  name: string;
  url: string;
  analysisNotes: string;
  commercialUse: string;
  ownershipPosition: string;
  humanAuthorshipNote: string;
  watchouts: string[];
  evidenceToKeep: string;
  riskLevel: 'lower' | 'moderate' | 'higher';
  bestFor: string;
  lastReviewed: string;
}

export const platformsDatabase: Platform[] = [
  {
    id: 'suno',
    name: 'Suno AI',
    url: 'https://suno.com',
    analysisNotes: 'Paid tiers generally expand commercial usage, but the safest position is still to treat the raw output as license-based unless you add meaningful human authorship.',
    commercialUse: 'Typically tied to paid tiers and current subscription status.',
    ownershipPosition: 'Platform terms and plan level shape your usage rights; raw output alone may not equal registrable ownership.',
    humanAuthorshipNote: 'Stronger claim when you wrote lyrics, changed structure, added vocals, or rebuilt the arrangement in a DAW.',
    watchouts: ['Free-tier limitations', 'Terms can change by subscription plan', 'Do not assume raw generations are fully registrable'],
    evidenceToKeep: 'Lyrics drafts, plan receipt, prompt history, exported stems, and post-generation session edits.',
    riskLevel: 'moderate',
    bestFor: 'Creators who can add strong human topline and production layers.',
    lastReviewed: 'Baseline guidance, verify current ToS before release.',
  },
  {
    id: 'udio',
    name: 'Udio',
    url: 'https://udio.com',
    analysisNotes: 'Commercial rights are usually linked to paid usage, but the rights picture still depends on how much of the final track reflects human-authored contributions.',
    commercialUse: 'Usually broader on paid plans; free usage can be narrower.',
    ownershipPosition: 'Platform licensing may permit monetization without granting full ownership of purely AI-generated sound.',
    humanAuthorshipNote: 'Document re-arrangement, new vocals, instrumentation, and lyric authorship before registration or release.',
    watchouts: ['Plan-based rights differences', 'Need clean disclosure for AI involvement', 'Keep a record of your edits'],
    evidenceToKeep: 'Version history, stems, lyric drafts, mix notes, and the specific terms page in force when created.',
    riskLevel: 'moderate',
    bestFor: 'Teams comfortable transforming source material into a more human-authored final master.',
    lastReviewed: 'Baseline guidance, verify current ToS before release.',
  },
  {
    id: 'boomy',
    name: 'Boomy',
    url: 'https://boomy.com',
    analysisNotes: 'Boomy is often more restrictive than creator-first tools, especially around sound recording ownership and the platform’s role in monetization.',
    commercialUse: 'Often tied to Boomy-managed release paths rather than full standalone control.',
    ownershipPosition: 'The platform may keep a stronger claim over generated recordings and publishing administration than most users expect.',
    humanAuthorshipNote: 'A heavier external production pass is especially important if you want a stronger separate ownership story.',
    watchouts: ['Platform-administered monetization', 'External ownership can be limited', 'Confirm release/distribution restrictions'],
    evidenceToKeep: 'Distribution approvals, royalty terms, collaborator agreements, and proof of any human rebuild outside the platform.',
    riskLevel: 'higher',
    bestFor: 'Users willing to work inside a platform-controlled release model.',
    lastReviewed: 'Baseline guidance, verify current ToS before release.',
  },
  {
    id: 'mubert',
    name: 'Mubert',
    url: 'https://mubert.com',
    analysisNotes: 'License tier matters heavily. Treat this as a usage-license environment first and an ownership story second.',
    commercialUse: 'Strictly depends on the purchased license tier and use case.',
    ownershipPosition: 'Underlying rights usually stay platform-centric while your usage is governed by license scope.',
    humanAuthorshipNote: 'If you transform the output into a new release, keep strong evidence of your new composition, performance, or production input.',
    watchouts: ['License scope may be narrower than expected', 'Business use can require a higher tier', 'Do not assume transfer of copyright'],
    evidenceToKeep: 'License purchase records, project brief, downstream use notes, and transformed session files.',
    riskLevel: 'moderate',
    bestFor: 'Commercial background music and controlled-use licensing scenarios.',
    lastReviewed: 'Baseline guidance, verify current ToS before release.',
  },
  {
    id: 'ai-song',
    name: 'ai-song.ai',
    url: 'https://ai-song.ai',
    analysisNotes: 'User-supplied lyrics can strengthen composition ownership, but commercial audio usage still depends on the site’s active license terms.',
    commercialUse: 'Commonly linked to paid subscriptions or higher tiers.',
    ownershipPosition: 'Lyrics you authored may remain yours, while the generated audio remains governed by license language and AI authorship limits.',
    humanAuthorshipNote: 'This is strongest when your lyrics, melody revisions, and final production meaningfully depart from the initial output.',
    watchouts: ['Paid plan may be required for release', 'Separate lyric rights from recording rights', 'Confirm current commercial clauses'],
    evidenceToKeep: 'Original lyric documents, receipts, generated exports, and notes showing what changed after generation.',
    riskLevel: 'moderate',
    bestFor: 'Songwriters bringing their own lyric and topline material into an AI workflow.',
    lastReviewed: 'Baseline guidance, verify current ToS before release.',
  },
  {
    id: 'soundraw',
    name: 'Soundraw',
    url: 'https://soundraw.io',
    analysisNotes: 'Modification often matters. Raw instrumentals can face release limits even when broader monetization is allowed under license.',
    commercialUse: 'Usually permitted within the platform’s allowed licensing framework, especially when the output is modified.',
    ownershipPosition: 'The platform may retain underlying rights while granting you a practical usage license.',
    humanAuthorshipNote: 'Adding vocals, structural edits, or live instrumentation creates a better claim story than releasing the raw export as-is.',
    watchouts: ['Raw output restrictions', 'Distribution rules can be narrower than monetization rules', 'Keep proof of modifications'],
    evidenceToKeep: 'Edited arrangement sessions, vocal tracking files, and the exact subscription terms in force.',
    riskLevel: 'moderate',
    bestFor: 'Creators using AI output as production source material rather than final release-ready masters.',
    lastReviewed: 'Baseline guidance, verify current ToS before release.',
  },
  {
    id: 'aiva',
    name: 'AIVA',
    url: 'https://www.aiva.ai',
    analysisNotes: 'Rights often depend on whether you are on a paid plan and what the service grants for commercial exploitation of generated compositions.',
    commercialUse: 'Usually expanded on paid plans and subject to the licensed scope.',
    ownershipPosition: 'Check whether the plan grants broader rights in the generated composition versus a non-exclusive license.',
    humanAuthorshipNote: 'A stronger claim exists when you meaningfully adapt, orchestrate, or rewrite the resulting composition.',
    watchouts: ['Subscription-dependent rights', 'Need clarity on exclusivity', 'Check whether attribution or licensing limits apply'],
    evidenceToKeep: 'Plan documents, score revisions, exported MIDI/session files, and arrangement notes.',
    riskLevel: 'moderate',
    bestFor: 'Composers using AI as a scoring assistant rather than a finished final author.',
    lastReviewed: 'Baseline guidance, verify current ToS before release.',
  },
  {
    id: 'beatoven',
    name: 'Beatoven.ai',
    url: 'https://www.beatoven.ai',
    analysisNotes: 'Usually positioned as licensable generated music for projects, with commercial scope tied to the selected plan and current terms.',
    commercialUse: 'Plan-based commercial rights with project-use framing.',
    ownershipPosition: 'Treat it primarily as a licensed usage environment unless the terms expressly say more.',
    humanAuthorshipNote: 'Use editing, additional arrangement, and new performances to improve your independent rights position.',
    watchouts: ['Usage license may be project-specific', 'Do not overstate ownership', 'Keep project context with the export'],
    evidenceToKeep: 'Project metadata, plan receipt, final edit sessions, and downstream licensing notes.',
    riskLevel: 'lower',
    bestFor: 'Teams needing soundtrack-style generation inside a broader human-led production workflow.',
    lastReviewed: 'Baseline guidance, verify current ToS before release.',
  },
];
