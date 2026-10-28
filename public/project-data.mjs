// Optional editorial enrichment, never a catalogue allowlist. Public identities only.
// Verification sources and availability are recorded in docs/PROJECT-LINKS.md.
export const curated = [
  { key: 'autoops', name: 'AutoOps', category: 'Operations automation', caption: 'From scattered information to work that reaches the right team.', role: 'Independent project',
    description: 'Operational challenges I encountered at Transdev and Sodexo inspired a tool that brings scattered data together, prioritizes tasks through business rules and routes work to the right teams.',
    technology: 'Python · FastAPI · JavaScript · REST APIs · Render · Resend',
    verifiedSite: 'https://autoops-8p17.onrender.com/', source: 'CV destination; HTTP 200 and matching AutoOps page on 2026-10-27',
    palette: ['#164759', '#f8f5ed', '#8fd9ec'], paletteSource: 'Live /static/style.css',
    image: 'assets/autoops.webp', imageAlt: 'AutoOps public interface showing its collection, prioritization and team-routing workflow.', motif: 'operations' },
  { key: 'vilvia', name: 'Vilvia', category: 'Family & community', caption: 'A parent’s perspective on bringing trusted family information together.', role: 'Independent project · In development',
    description: 'As a parent, I wanted a clearer place to find trusted family information. I’m developing Vilvia to bring together local events, parental-rights guidance and a supportive parent community.',
    technology: 'Flutter · FastAPI · PostgreSQL', status: 'In development',
    palette: ['#dedbd1', '#202126', '#666d63'], motif: 'family' },
  { key: 'sukna', name: 'Sukna Collection', category: 'Bilingual commerce', caption: 'Commerce, from the bilingual storefront to the backend.', role: 'Full-stack developer · Technical consultant',
    description: 'Since July 2026, I’ve worked remotely with a UAE client to translate their requirements into a bilingual commerce platform, including authentication, product management, cart and customer features.',
    technology: 'Next.js · TypeScript · FastAPI · PostgreSQL', status: 'Client work',
    palette: ['#34302f', '#f8f5ed', '#c9c0b5'], motif: 'commerce' },
  { key: 'beetlsense', name: 'StorPath', category: 'Indoor positioning', caption: 'Android sensors, pedestrian dead reckoning and in-store navigation.', captionCredit: 'Built for BeetlSense AB', role: 'Android developer · Team lead',
    description: 'At BeetlSense AB in Lund, I lead a five-person development team building in-store navigation. I coordinate technical planning, tasks and client communication as we work with Android sensors, pedestrian dead reckoning and map matching.',
    technology: 'Kotlin · Jetpack Compose · MVVM · PDR', status: 'Client work · Since October 2026',
    palette: ['#d5d9d7', '#202126', '#596762'], motif: 'indoor' },
  { key: 'staffsync', fullName: 'Yousef-martaa/staffsync', name: 'StaffSync', category: 'Employee management', caption: 'People, roles and the systems that keep access clear.', role: 'Team project · Full-stack development',
    description: 'Managing people requires clear boundaries around access. In this team project, I worked on authentication, role-based access, user management, deployment and production troubleshooting.',
    technology: 'React · TypeScript · Node.js · Express · MongoDB Atlas',
    verifiedSite: 'https://staffsync-app.vercel.app/', source: 'Public repository homepage and README; HTTP 200 on 2026-10-27',
    palette: ['#081225', '#f8f5ed', '#3b82f6'], paletteSource: 'Public client/src/App.css',
    image: 'assets/staffsync.webp', imageAlt: 'StaffSync public landing page introducing employee, task, salary and leave management.', motif: 'people' },
  { key: 'aramf', fullName: 'morganlindbom/ARAMF', name: 'AR&MF', category: 'AI-assisted development', caption: 'Rules, context and memory for considered AI-assisted development.', role: 'Collaborative project with Morgan',
    description: 'A collaborative exploration of more efficient AI-assisted development. AR&MF organizes project rules, context and durable memory for repository-aware coding agents; reducing unnecessary token consumption is a goal, not a measured result.',
    technology: 'C++17 · Qt 6 · CMake', status: 'In development', motif: 'context' }
];

export const additional = [
  { key: 'vegan', fullName: 'Yousef-martaa/VagenTillVegan', name: 'Vägen till Vegan', category: 'Restaurant discovery',
    description: 'Collecting, filtering and reviewing vegan-friendly restaurants in Sweden in one place.',
    image: 'assets/vegan.webp', imageAlt: 'Vägen till Vegan public restaurant discovery interface with rating and vegan-level controls.',
    verifiedSite: 'https://vagen-till-vegan.vercel.app/', source: 'Public repository homepage; HTTP 200 on 2026-10-27' },
  { key: 'mogges', fullName: 'FeatureDev/Mogges-Store', name: 'mogges-store.se', category: 'Commerce', role: 'Organization-owned project · FeatureDev',
    description: 'An e-commerce platform with an integrated AI chatbot, previously featured in this portfolio.',
    image: 'assets/mogges.webp', imageAlt: 'Mogges Store public Swedish storefront with fashion categories and shopping links.',
    verifiedSite: 'https://mogges-store.se/', source: 'Public FeatureDev/Mogges-Store homepage; live storefront and HTTP 200 on 2026-10-27' },
  { key: 'mental-health', fullName: 'Chatbot-Mental-Health/Mental-Health-Chatbot', name: 'Mental-Health-Chatbot',
    category: 'Conversational software', description: 'A Python project exploring supportive conversations and mood tracking.',
    role: 'Organization-owned project' }
];

export const metadata = new Map([...curated, ...additional].filter(p => p.fullName).map(p => [p.fullName.toLowerCase(), p]));
