/**
 * THEMES ENGINE - Motor de Estilo
 *
 * Define as "personalidades" visuais que o sistema pode adotar.
 * Cada tema inclui cores, fontes, border radius e estilo de componentes.
 */
export const THEMES = {
    corporate: {
        id: 'corporate',
        name: 'Enterprise Blue',
        colors: {
            primary: '#0f172a', // Slate 900
            secondary: '#64748b', // Slate 500
            accent: '#3b82f6', // Blue 500
            background: '#f8fafc', // Slate 50
            surface: '#ffffff',
            text: '#1e293b'
        },
        borderRadius: '0.25rem',
        fontFamily: 'Inter, sans-serif',
        componentStyle: 'bordered'
    },
    startup: {
        id: 'startup',
        name: 'Modern SaaS',
        colors: {
            primary: '#6366f1', // Indigo 500
            secondary: '#a855f7', // Purple 500
            accent: '#ec4899', // Pink 500
            background: '#ffffff',
            surface: '#f9fafb', // Gray 50
            text: '#111827'
        },
        borderRadius: '0.75rem',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        componentStyle: 'shadow'
    },
    industrial: {
        id: 'industrial',
        name: 'Dark Operations',
        colors: {
            primary: '#f59e0b', // Amber 500
            secondary: '#404040', // Neutral 700
            accent: '#ef4444', // Red 500
            background: '#171717', // Neutral 900
            surface: '#262626', // Neutral 800
            text: '#e5e5e5'
        },
        borderRadius: '0px',
        fontFamily: 'Roboto Mono, monospace',
        componentStyle: 'flat'
    },
    elegant: {
        id: 'elegant',
        name: 'Serene',
        colors: {
            primary: '#059669', // Emerald 600
            secondary: '#10b981', // Emerald 500
            accent: '#d97706', // Amber 600
            background: '#f0fdf4', // Emerald 50
            surface: '#ffffff',
            text: '#064e3b'
        },
        borderRadius: '1rem',
        fontFamily: 'Merriweather, serif',
        componentStyle: 'shadow'
    },
    creative: {
        id: 'creative',
        name: 'Vibrant',
        colors: {
            primary: '#ec4899', // Pink 500
            secondary: '#f59e0b', // Amber 500
            accent: '#8b5cf6', // Violet 500
            background: '#fff1f2', // Rose 50
            surface: '#ffffff',
            text: '#831843'
        },
        borderRadius: '1rem',
        fontFamily: 'Poppins, sans-serif',
        componentStyle: 'shadow'
    }
};
/**
 * Seleciona o tema baseado na indústria
 */
export function selectTheme(industry) {
    const industryLower = (industry || '').toLowerCase();
    switch (industryLower) {
        case 'finance':
        case 'financial':
        case 'banking':
        case 'healthcare':
        case 'legal':
        case 'law':
            return THEMES.corporate;
        case 'saas':
        case 'software':
        case 'tech':
        case 'technology':
        case 'marketing':
        case 'advertising':
            return THEMES.startup;
        case 'manufacturing':
        case 'logistics':
        case 'operations':
        case 'industrial':
            return THEMES.industrial;
        case 'design':
        case 'creative':
        case 'agency':
        case 'art':
            return THEMES.creative;
        case 'education':
        case 'wellness':
        case 'sustainability':
            return THEMES.elegant;
        default:
            return THEMES.startup; // Default modern SaaS
    }
}
/**
 * Obtém todos os temas disponíveis
 */
export function getAllThemes() {
    return Object.values(THEMES);
}
/**
 * Obtém um tema por ID
 */
export function getThemeById(id) {
    return THEMES[id] || null;
}
