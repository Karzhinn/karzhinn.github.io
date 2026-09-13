/**
 * All personal content lives here, so copy can be edited without touching
 * layout or animation code.
 */

export const site = {
  name: 'Karzhin Kamal',
  firstName: 'Karzhin',
  role: 'Software Engineer',
  headline: 'Software Engineer & Computer Science Graduate',
  statement: 'I turn ideas into software that’s engineered to hold up and designed to feel effortless.',
  title: 'Karzhin Kamal · Software Engineer',
  description:
    'Karzhin Kamal is a Software Engineer and Computer Science graduate from the University of Kurdistan Hewler. He builds web platforms and mobile apps with a strong focus on design.',
  currentRole: { title: 'Software Engineer', org: 'Base Agency' },
  education: {
    degree: 'BSc Computer Science',
    school: 'University of Kurdistan Hewler',
    short: 'UKH',
  },
  email: 'kurdkajo@gmail.com',
  // TODO: replace the LinkedIn placeholder with your real profile URL before deploying.
  links: {
    github: 'https://github.com/Karzhinn',
    linkedin: 'https://www.linkedin.com/in/YOUR-PROFILE',
  },
} as const;

export const socials = [
  { label: 'GitHub', href: site.links.github, external: true },
  { label: 'LinkedIn', href: site.links.linkedin, external: true },
  { label: 'Email', href: `mailto:${site.email}`, external: false },
] as const;

if (import.meta.env.PROD && Object.values(site.links).some((href) => href.includes('YOUR-'))) {
  console.warn('[site] Placeholder social links detected in src/data/site.ts. Update them before deploying.');
}

export const nav = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
] as const;

/** About section: the intro and the three chapters that drive the 3D scene. */
export const about = {
  title: 'I build software from the database to the last pixel.',
  lead: 'I care about the parts of a product people never see, and the parts they touch every day. Here’s the short version.',
  chapters: [
    {
      key: 'Studied',
      title: 'Computer Science at UKH',
      body: 'My degree from the University of Kurdistan Hewler gave me the fundamentals I still lean on every day: algorithms, data structures, databases and how larger systems fit together.',
    },
    {
      key: 'Working',
      title: 'Software Engineer at Base Agency',
      body: 'I work mostly on the web, helping design and build a custom CRM platform that makes everyday business work simpler for the people who use it.',
    },
    {
      key: 'Building',
      title: 'Apps of my own',
      body: 'I also design and build mobile apps. One connects people with therapists. Another, Zman, teaches English to Kurdish speakers through short daily lessons.',
    },
  ],
} as const;

export type Experience = {
  org: string;
  role: string;
  /** Leave as a label ("Present", "Internship") or add real dates, e.g. "2023 to 2024". */
  period: string;
  current?: boolean;
  summary: string;
  details: string[];
  tags: string[];
};

export const experience: Experience[] = [
  {
    org: 'Base Agency',
    role: 'Software Engineer',
    period: 'Present',
    current: true,
    summary: 'Web development and a custom CRM platform.',
    details: [
      'Building and evolving a custom CRM platform, with most of my work on the web.',
      'Designing and developing systems that make everyday business workflows faster and clearer.',
      'Paying attention to the details that make an internal tool pleasant to use every day.',
    ],
    tags: ['Web development', 'CRM', 'System design', 'UX'],
  },
  {
    org: 'Kurdistan Parliament',
    role: 'Software Engineer Intern',
    period: 'Internship',
    summary: 'A Document Management System built with Spring Boot.',
    details: [
      'Worked on a Document Management System for organising institutional documents and the workflows around them.',
      'Built backend features with Java and Spring Boot.',
      'Learned how software works inside a real institution, where permissions, process and records have to be right.',
    ],
    tags: ['Java', 'Spring Boot', 'Backend'],
  },
  {
    org: 'Kurdistan Women’s Union',
    role: 'Freelance Web Developer',
    period: 'Freelance',
    summary: 'Designed and built the website for their e-Library.',
    details: [
      'Designed and developed the website for the Union’s e-Library system, end to end.',
      'Focused on an accessible, clear browsing experience that works for every visitor.',
      'Balanced a polished visual identity with fast, dependable pages.',
    ],
    tags: ['Web design', 'Front-end', 'Accessibility'],
  },
];

export type Project = {
  id: 'zman' | 'mind' | 'library';
  index: string;
  kind: 'Mobile app' | 'Website';
  /** Short label shown on the visual. */
  label: string;
  title: string;
  tagline: string;
  description: string;
  meta: { label: string; value: string }[];
  highlights?: string[];
  link: { href: string; label: string };
};

export const projects: Project[] = [
  {
    id: 'zman',
    index: '01',
    kind: 'Mobile app',
    label: 'Coming soon to Android & iOS',
    title: 'Zman',
    tagline: 'English lessons in your own language.',
    description:
      'A free, game-like app that teaches English to Sorani Kurdish speakers through short daily lessons, with every explanation written in Kurdish.',
    meta: [
      { label: 'Role', value: 'Design & development' },
      { label: 'Platform', value: 'Android & iOS' },
      { label: 'Status', value: 'Launching soon on Google Play and the App Store' },
    ],
    highlights: [
      '100 units, 310 lessons and 1,310 exercises',
      'Speaking practice with speech recognition',
      'Works offline, with streaks, levels and weekly leaderboards',
    ],
    link: { href: 'https://karzhinn.github.io/zman-site/index.html', label: 'Visit the Zman website' },
  },
  {
    id: 'mind',
    index: '02',
    kind: 'Mobile app',
    label: 'Graduation project',
    title: 'Mental Health Services and Support',
    tagline: 'Finding support, made simpler.',
    description:
      'A mobile app that connects people with verified therapists. Users can find a therapist, book sessions and talk through encrypted chat, while therapists manage their availability and requests.',
    meta: [
      { label: 'Role', value: 'Design & development' },
      { label: 'Platform', value: 'Mobile, in Kurdish and English' },
      { label: 'Built with', value: 'Flutter · Dart · Firebase' },
    ],
    highlights: [
      'Therapist verification, availability and booking requests',
      'Encrypted chat between users and therapists',
      'Weekly mood tracking and a personal journal',
    ],
    link: { href: 'https://github.com/Karzhinn/fyp', label: 'View the code on GitHub' },
  },
  {
    id: 'library',
    index: '03',
    kind: 'Website',
    label: 'Live website',
    title: 'e-Library',
    tagline: 'A digital library for the Kurdistan Women’s Union.',
    description:
      'The online library of the Union’s Zin Cultural Center. Visitors can read books and PDFs or listen to audiobooks in Kurdish, from any device.',
    meta: [
      { label: 'Role', value: 'Freelance design & development' },
      { label: 'Client', value: 'Kurdistan Women’s Union' },
      { label: 'Platform', value: 'Responsive website, Kurdish (right to left)' },
    ],
    highlights: ['500+ printed books, 120+ audiobooks and 80+ PDFs', 'Reading and listening on any device'],
    link: { href: 'https://partukyak.org/', label: 'Visit partukyak.org' },
  },
];

export const stack = [
  { group: 'Languages', items: ['Java', 'Dart', 'Python', 'JavaScript'] },
  { group: 'Frameworks & Development', items: ['Spring Boot', 'Flutter', 'Web Development'] },
  { group: 'Databases & Backend', items: ['PostgreSQL', 'Firebase'] },
  { group: 'Tools', items: ['Git', 'GitHub', 'Figma', 'VS Code', 'Android Studio'] },
] as const;

export const principles = [
  { title: 'UI / UX', body: 'Clear paths, fewer decisions, no dead ends.' },
  { title: 'Interaction design', body: 'Every click, tap and hover should answer back.' },
  { title: 'Visual hierarchy', body: 'The eye should know where to go before the mind has to think.' },
  { title: 'Motion', body: 'Animation that explains what happened, never decoration for its own sake.' },
  { title: 'Accessibility', body: 'Keyboard, screen readers and contrast are part of the build, not a final pass.' },
  { title: 'Simplicity', body: 'Most good interfaces are the result of things removed.' },
  { title: 'Product thinking', body: 'Start from the problem and the person. The components come later.' },
] as const;
