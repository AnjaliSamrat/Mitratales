import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import './Header.css';
import { t, setLocale, register } from './i18n';
import en from '../locales/en';
import hi from '../locales/hi';
import es from '../locales/es';
import fr from '../locales/fr';
import de from '../locales/de';

export default function Header() {
  const username = localStorage.getItem('username');
  const displayName = username || 'John Doe';
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const { notify } = useToast();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recents, setRecents] = useState([]);
  const [locale, setLocaleState] = useState(localStorage.getItem('locale') || 'en');

  useEffect(() => {
    // Initialize theme from localStorage
    try {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      setTheme(savedTheme);
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.dataset.theme = savedTheme;
      }
    } catch {}

    const onDocClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    // Minimal Hindi registration
    register('hi', {
      'brand.title': 'Mitratales',
      'search.placeholder': 'à¤‰à¤ªà¤¯à¥‹à¤—à¤•à¤°à¥à¤¤à¤¾ à¤–à¥‹à¤œà¥‡à¤‚',
      'search.clear': 'à¤–à¥‹à¤œ à¤¸à¤¾à¤« à¤•à¤°à¥‡à¤‚',
      'search.recents': 'à¤¹à¤¾à¤² à¤•à¥€ à¤–à¥‹à¤œà¥‡à¤‚',
      'search.no_recents': 'à¤•à¥‹à¤ˆ à¤¹à¤¾à¤² à¤•à¥€ à¤–à¥‹à¤œ à¤¨à¤¹à¥€à¤‚',
      'search.recent': 'à¤¹à¤¾à¤² à¤•à¥€',
      'search.clear_recents': 'à¤¹à¤¾à¤² à¤•à¥€ à¤–à¥‹à¤œà¥‡à¤‚ à¤®à¤¿à¤Ÿà¤¾à¤à¤',
      'search.no_results': 'à¤•à¥‹à¤ˆ à¤ªà¤°à¤¿à¤£à¤¾à¤® à¤¨à¤¹à¥€à¤‚',
      'nav.home': 'à¤¹à¥‹à¤®',
      'nav.messenger': 'à¤®à¥ˆà¤¸à¥‡à¤‚à¤œà¤°',
      'nav.groups': 'à¤¸à¤®à¥‚à¤¹',
      'nav.watch': 'à¤µà¥‰à¤š',
      'nav.marketplace': 'à¤®à¤¾à¤°à¥à¤•à¥‡à¤Ÿà¤ªà¥à¤²à¥‡à¤¸',
      'nav.gallery': 'à¤—à¥ˆà¤²à¤°à¥€',
      'nav.profile': 'à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤²',
      'nav.logout': 'à¤²à¥‰à¤— à¤†à¤‰à¤Ÿ',
      'toast.logged_out': 'à¤²à¥‰à¤— à¤†à¤‰à¤Ÿ à¤¹à¥‹ à¤—à¤',
      'feed.title': 'à¤«à¤¼à¥€à¤¡',
      'feed.empty': 'à¤…à¤­à¥€ à¤•à¥‹à¤ˆ à¤ªà¥‹à¤¸à¥à¤Ÿ à¤¨à¤¹à¥€à¤‚à¥¤',
      'common.load_more': 'à¤”à¤° à¤²à¥‹à¤¡ à¤•à¤°à¥‡à¤‚',
      'post.loading': 'à¤²à¥‹à¤¡ à¤¹à¥‹ à¤°à¤¹à¤¾ à¤¹à¥ˆâ€¦',
      'post.retry': 'à¤ªà¥à¤¨à¤ƒ à¤ªà¥à¤°à¤¯à¤¾à¤¸ à¤•à¤°à¥‡à¤‚',
      // Profile tabs
      'tabs.timeline': 'à¤¸à¤®à¤¾à¤šà¤¾à¤° à¤«à¤¼à¥€à¤¡',
      'tabs.about': 'à¤ªà¤°à¤¿à¤šà¤¯',
      'tabs.friends': 'à¤¦à¥‹à¤¸à¥à¤¤',
      'tabs.photos': 'à¤«à¤¼à¥‹à¤Ÿà¥‹',
      // About labels
      'about.title': 'à¤ªà¤°à¤¿à¤šà¤¯',
      'about.name': 'à¤¨à¤¾à¤®',
      'about.gender': 'à¤²à¤¿à¤‚à¤—',
      'about.dob': 'à¤œà¤¨à¥à¤®à¤¤à¤¿à¤¥à¤¿',
      'about.bio': 'à¤¬à¤¾à¤¯à¥‹',
      'friends.coming_soon': 'à¤¦à¥‹à¤¸à¥à¤¤à¥‹à¤‚ à¤•à¥€ à¤¸à¥‚à¤šà¥€ à¤œà¤²à¥à¤¦ à¤† à¤°à¤¹à¥€ à¤¹à¥ˆâ€¦',
      'photos.coming_soon': 'à¤«à¤¼à¥‹à¤Ÿà¥‹ à¤œà¤²à¥à¤¦ à¤† à¤°à¤¹à¥‡ à¤¹à¥ˆà¤‚â€¦',
      'profile.no_posts': 'à¤…à¤­à¥€ à¤•à¥‹à¤ˆ à¤ªà¥‹à¤¸à¥à¤Ÿ à¤¨à¤¹à¥€à¤‚à¥¤',
      // PostCard actions
      'post.actions': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤•à¥à¤°à¤¿à¤¯à¤¾à¤à¤',
      'post.like': 'à¤ªà¤¸à¤‚à¤¦',
      'post.comment': 'à¤Ÿà¤¿à¤ªà¥à¤ªà¤£à¥€',
      'post.loading_comments': 'à¤Ÿà¤¿à¤ªà¥à¤ªà¤£à¤¿à¤¯à¤¾à¤ à¤²à¥‹à¤¡ à¤¹à¥‹ à¤°à¤¹à¥€ à¤¹à¥ˆà¤‚â€¦',
      'post.write_comment': 'à¤à¤• à¤Ÿà¤¿à¤ªà¥à¤ªà¤£à¥€ à¤²à¤¿à¤–à¥‡à¤‚...',
      'post.post': 'à¤ªà¥‹à¤¸à¥à¤Ÿ',
      'post.posting': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤¹à¥‹ à¤°à¤¹à¤¾ à¤¹à¥ˆâ€¦',
      'post.edit': 'à¤¸à¤‚à¤ªà¤¾à¤¦à¤¿à¤¤ à¤•à¤°à¥‡à¤‚',
      'post.delete': 'à¤¹à¤Ÿà¤¾à¤à¤',
      'post.delete_title': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤¹à¤Ÿà¤¾à¤à¤?',
      'post.delete_message': 'à¤¯à¤¹ à¤•à¤¾à¤°à¥à¤°à¤µà¤¾à¤ˆ à¤µà¤¾à¤ªà¤¸ à¤¨à¤¹à¥€à¤‚ à¤²à¥€ à¤œà¤¾ à¤¸à¤•à¤¤à¥€à¥¤',
      // Errors and success toasts
      'errors.could_not_load_feed': 'à¤«à¤¼à¥€à¤¡ à¤²à¥‹à¤¡ à¤¨à¤¹à¥€à¤‚ à¤¹à¥‹ à¤¸à¤•à¤¾à¥¤',
      'errors.could_not_load_more': 'à¤…à¤§à¤¿à¤• à¤ªà¥‹à¤¸à¥à¤Ÿ à¤²à¥‹à¤¡ à¤¨à¤¹à¥€à¤‚ à¤¹à¥‹ à¤¸à¤•à¥€à¤‚à¥¤',
      'errors.could_not_load_timeline': 'à¤Ÿà¤¾à¤‡à¤®à¤²à¤¾à¤‡à¤¨ à¤²à¥‹à¤¡ à¤¨à¤¹à¥€à¤‚ à¤¹à¥‹ à¤¸à¤•à¥€à¥¤',
      'auth.login_required': 'à¤œà¤¾à¤°à¥€ à¤°à¤–à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤²à¥‰à¤— à¤‡à¤¨ à¤•à¤°à¥‡à¤‚à¥¤',
      'errors.session_expired': 'à¤¸à¤¤à¥à¤° à¤¸à¤®à¤¾à¤ªà¥à¤¤ à¤¹à¥‹ à¤—à¤¯à¤¾à¥¤ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤«à¤¿à¤° à¤¸à¥‡ à¤²à¥‰à¤— à¤‡à¤¨ à¤•à¤°à¥‡à¤‚à¥¤',
      'errors.network': 'à¤¨à¥‡à¤Ÿà¤µà¤°à¥à¤• à¤¤à¥à¤°à¥à¤Ÿà¤¿',
      'success.post_published': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤¹à¥à¤ˆ',
      'errors.failed_create_post': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤¬à¤¨à¤¾à¤¨à¥‡ à¤®à¥‡à¤‚ à¤µà¤¿à¤«à¤²',
      'success.post_updated': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¹à¥à¤ˆ',
      'errors.failed_update_post': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤•à¤°à¤¨à¥‡ à¤®à¥‡à¤‚ à¤µà¤¿à¤«à¤²',
      'success.post_deleted': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤¹à¤Ÿà¤¾à¤ˆ à¤—à¤ˆ',
      'errors.failed_delete_post': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤¹à¤Ÿà¤¾à¤¨à¥‡ à¤®à¥‡à¤‚ à¤µà¤¿à¤«à¤²',
      'errors.failed_like': 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤ªà¤¸à¤‚à¤¦ à¤•à¤°à¤¨à¥‡ à¤®à¥‡à¤‚ à¤µà¤¿à¤«à¤²',
      'success.comment_added': 'à¤Ÿà¤¿à¤ªà¥à¤ªà¤£à¥€ à¤œà¥‹à¤¡à¤¼à¥€ à¤—à¤ˆ',
      'errors.failed_add_comment': 'à¤Ÿà¤¿à¤ªà¥à¤ªà¤£à¥€ à¤œà¥‹à¤¡à¤¼à¤¨à¥‡ à¤®à¥‡à¤‚ à¤µà¤¿à¤«à¤²',
      // Login
      'login.hero_title': 'mitratales',
      'login.hero_line1': 'à¤®à¤¿à¤¤à¥à¤°à¥‹à¤‚ à¤”à¤° à¤¦à¥à¤¨à¤¿à¤¯à¤¾ à¤¸à¥‡ à¤œà¥à¤¡à¤¼à¥‡à¤‚',
      'login.hero_line2': 'Mitratales à¤ªà¤° à¤…à¤ªà¤¨à¥‡ à¤†à¤¸à¤ªà¤¾à¤¸à¥¤',
      'login.title': 'Mitratales à¤®à¥‡à¤‚ à¤²à¥‰à¤— à¤‡à¤¨ à¤•à¤°à¥‡à¤‚',
      'login.email_placeholder': 'à¤ˆà¤®à¥‡à¤² à¤¯à¤¾ à¤«à¤¼à¥‹à¤¨ à¤¨à¤‚à¤¬à¤°',
      'login.password_placeholder': 'à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡',
      'login.submit': 'à¤²à¥‰à¤— à¤‡à¤¨',
      'login.forgot': 'à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤­à¥‚à¤² à¤—à¤?',
      'login.create_account': 'à¤¨à¤¯à¤¾ à¤–à¤¾à¤¤à¤¾ à¤¬à¤¨à¤¾à¤à¤‚',
      'login.footer_note': 'à¤•à¤¿à¤¸à¥€ à¤¸à¥‡à¤²à¤¿à¤¬à¥à¤°à¤¿à¤Ÿà¥€, à¤¬à¥à¤°à¤¾à¤‚à¤¡ à¤¯à¤¾ à¤µà¥à¤¯à¤µà¤¸à¤¾à¤¯ à¤•à¥‡ à¤²à¤¿à¤ à¤ªà¥‡à¤œ à¤¬à¤¨à¤¾à¤à¤‚à¥¤',
      'login.success': 'à¤²à¥‰à¤— à¤‡à¤¨ à¤¸à¤«à¤²',
      'login.failed': 'à¤²à¥‰à¤— à¤‡à¤¨ à¤µà¤¿à¤«à¤²',
    });
    // Minimal French registration
    register('fr', {
      'brand.title': 'Mitratales',
      'search.placeholder': 'Rechercher des utilisateurs',
      'search.clear': 'Effacer la recherche',
      'search.recents': 'Recherches rÃ©centes',
      'search.no_recents': 'Aucune recherche rÃ©cente',
      'search.recent': 'RÃ©cent',
      'search.clear_recents': 'Effacer les recherches rÃ©centes',
      'search.no_results': 'Aucun rÃ©sultat',
      'nav.home': 'Accueil',
      'nav.messenger': 'Messenger',
      'nav.groups': 'Groupes',
      'nav.watch': 'Watch',
      'nav.marketplace': 'Marketplace',
      'nav.gallery': 'Galerie',
      'nav.profile': 'Profil',
      'nav.logout': 'Se dÃ©connecter',
      'toast.logged_out': 'DÃ©connectÃ©',
      'feed.title': 'Fil',
      'feed.empty': 'Aucune publication.',
      'common.load_more': 'Charger plus',
      'post.loading': 'Chargementâ€¦',
      'post.retry': 'RÃ©essayer',
      'tabs.timeline': 'Journal',
      'tabs.about': 'Ã€ propos',
      'tabs.friends': 'Amis',
      'tabs.photos': 'Photos',
      'about.title': 'Ã€ propos',
      'about.name': 'Nom',
      'about.gender': 'Genre',
      'about.dob': 'Date de naissance',
      'about.bio': 'Bio',
      'friends.coming_soon': 'Liste dâ€™amis bientÃ´tâ€¦',
      'photos.coming_soon': 'Photos bientÃ´tâ€¦',
      'profile.no_posts': 'Aucune publication.',
      'post.actions': 'Actions de la publication',
      'post.like': 'Jâ€™aime',
      'post.comment': 'Commenter',
      'post.loading_comments': 'Chargement des commentairesâ€¦',
      'post.write_comment': 'Ã‰crire un commentaireâ€¦',
      'post.post': 'Publier',
      'post.posting': 'Publicationâ€¦',
      'post.edit': 'Modifier',
      'post.delete': 'Supprimer',
      'post.delete_title': 'Supprimer la publicationÂ ?',
      'post.delete_message': 'Cette action est irrÃ©versible.',
      'errors.could_not_load_feed': 'Impossible de charger le fil.',
      'errors.could_not_load_more': 'Impossible de charger plus de publications.',
      'errors.could_not_load_timeline': 'Impossible de charger le journal.',
      'auth.login_required': 'Veuillez vous connecter pour continuer.',
      'errors.session_expired': 'Session expirÃ©e. Veuillez vous reconnecter.',
      'errors.network': 'Erreur rÃ©seau',
      'success.post_published': 'Publication crÃ©Ã©e',
      'errors.failed_create_post': 'Ã‰chec de la crÃ©ation de la publication',
      'success.post_updated': 'Publication mise Ã  jour',
      'errors.failed_update_post': 'Ã‰chec de la mise Ã  jour de la publication',
      'success.post_deleted': 'Publication supprimÃ©e',
      'errors.failed_delete_post': 'Ã‰chec de la suppression de la publication',
      'errors.failed_like': 'Ã‰chec du Â«Â Jâ€™aimeÂ Â»',
      'success.comment_added': 'Commentaire ajoutÃ©',
      'errors.failed_add_comment': 'Ã‰chec de lâ€™ajout du commentaire',
      'login.hero_title': 'mitratales',
      'login.hero_line1': 'Restez en contact avec vos amis et le monde',
      'login.hero_line2': 'qui vous entoure sur Mitratales.',
      'login.title': 'Se connecter Ã  Mitratales',
      'login.email_placeholder': 'E-mail ou numÃ©ro de tÃ©lÃ©phone',
      'login.password_placeholder': 'Mot de passe',
      'login.submit': 'Se connecter',
      'login.forgot': 'Mot de passe oubliÃ©Â ?',
      'login.create_account': 'CrÃ©er un compte',
      'login.footer_note': 'CrÃ©ez une Page pour une cÃ©lÃ©britÃ©, une marque ou une entreprise.',
      'login.success': 'Connexion rÃ©ussie',
      'login.failed': 'Ã‰chec de la connexion',
    });

    // Minimal German registration
    register('de', {
      'brand.title': 'Mitratales',
      'search.placeholder': 'Benutzer suchen',
      'search.clear': 'Suche lÃ¶schen',
      'search.recents': 'Letzte Suchanfragen',
      'search.no_recents': 'Keine letzten Suchanfragen',
      'search.recent': 'Zuletzt',
      'search.clear_recents': 'Letzte Suchanfragen lÃ¶schen',
      'search.no_results': 'Keine Ergebnisse',
      'nav.home': 'Startseite',
      'nav.messenger': 'Messenger',
      'nav.groups': 'Gruppen',
      'nav.watch': 'Watch',
      'nav.marketplace': 'Marketplace',
      'nav.profile': 'Profil',
      'nav.logout': 'Abmelden',
      'toast.logged_out': 'Abgemeldet',
      'feed.title': 'Feed',
      'feed.empty': 'Keine BeitrÃ¤ge.',
      'common.load_more': 'Mehr laden',
      'post.loading': 'Ladenâ€¦',
      'post.retry': 'Erneut versuchen',
      'tabs.timeline': 'Chronik',
      'tabs.about': 'Info',
      'tabs.friends': 'Freunde',
      'tabs.photos': 'Fotos',
      'about.title': 'Info',
      'about.name': 'Name',
      'about.gender': 'Geschlecht',
      'about.dob': 'Geburtsdatum',
      'about.bio': 'Bio',
      'friends.coming_soon': 'Freundesliste bald verfÃ¼gbarâ€¦',
      'photos.coming_soon': 'Fotos bald verfÃ¼gbarâ€¦',
      'profile.no_posts': 'Keine BeitrÃ¤ge.',
      'post.actions': 'Beitragsaktionen',
      'post.like': 'GefÃ¤llt mir',
      'post.comment': 'Kommentieren',
      'post.loading_comments': 'Kommentare werden geladenâ€¦',
      'post.write_comment': 'Einen Kommentar schreiben...',
      'post.post': 'Posten',
      'post.posting': 'Wird gepostetâ€¦',
      'post.edit': 'Bearbeiten',
      'post.delete': 'LÃ¶schen',
      'post.delete_title': 'Beitrag lÃ¶schen?',
      'post.delete_message': 'Diese Aktion kann nicht rÃ¼ckgÃ¤ngig gemacht werden.',
      'errors.could_not_load_feed': 'Feed konnte nicht geladen werden.',
      'errors.could_not_load_more': 'Weitere BeitrÃ¤ge konnten nicht geladen werden.',
      'errors.could_not_load_timeline': 'Chronik konnte nicht geladen werden.',
      'auth.login_required': 'Bitte melde dich an, um fortzufahren.',
      'errors.session_expired': 'Sitzung abgelaufen. Bitte erneut anmelden.',
      'errors.network': 'Netzwerkfehler',
      'success.post_published': 'Beitrag verÃ¶ffentlicht',
      'errors.failed_create_post': 'Beitrag konnte nicht erstellt werden',
      'success.post_updated': 'Beitrag aktualisiert',
      'errors.failed_update_post': 'Beitrag konnte nicht aktualisiert werden',
      'success.post_deleted': 'Beitrag gelÃ¶scht',
      'errors.failed_delete_post': 'Beitrag konnte nicht gelÃ¶scht werden',
      'errors.failed_like': 'GefÃ¤llt mir fehlgeschlagen',
      'success.comment_added': 'Kommentar hinzugefÃ¼gt',
      'errors.failed_add_comment': 'Kommentar konnte nicht hinzugefÃ¼gt werden',
      'login.hero_title': 'mitratales',
      'login.hero_line1': 'Vernetze dich mit Freunden und der Welt',
      'login.hero_line2': 'um dich herum auf Mitratales.',
      'login.title': 'Bei Mitratales anmelden',
      'login.email_placeholder': 'E-Mail oder Telefonnummer',
      'login.password_placeholder': 'Passwort',
      'login.submit': 'Anmelden',
      'login.forgot': 'Passwort vergessen?',
      'login.create_account': 'Neues Konto erstellen',
      'login.footer_note': 'Erstelle eine Seite fÃ¼r eine berÃ¼hmte Person, Marke oder ein Unternehmen.',
      'login.success': 'Anmeldung erfolgreich',
      'login.failed': 'Anmeldung fehlgeschlagen',
    });
    // Minimal Spanish registration
    register('es', {
      'brand.title': 'Mitratales',
      'search.placeholder': 'Buscar usuarios',
      'search.clear': 'Borrar bÃºsqueda',
      'search.recents': 'BÃºsquedas recientes',
      'search.no_recents': 'Sin bÃºsquedas recientes',
      'search.recent': 'Reciente',
      'search.clear_recents': 'Borrar bÃºsquedas recientes',
      'search.no_results': 'Sin resultados',
      'nav.home': 'Inicio',
      'nav.messenger': 'Messenger',
      'nav.groups': 'Grupos',
      'nav.watch': 'Watch',
      'nav.marketplace': 'Marketplace',
      'nav.profile': 'Perfil',
      'nav.logout': 'Cerrar sesiÃ³n',
      'toast.logged_out': 'SesiÃ³n cerrada',
      'feed.title': 'Noticias',
      'feed.empty': 'Sin publicaciones.',
      'common.load_more': 'Cargar mÃ¡s',
      'post.loading': 'Cargandoâ€¦',
      'post.retry': 'Reintentar',
      'tabs.timeline': 'BiografÃ­a',
      'tabs.about': 'InformaciÃ³n',
      'tabs.friends': 'Amigos',
      'tabs.photos': 'Fotos',
      'about.title': 'InformaciÃ³n',
      'about.name': 'Nombre',
      'about.gender': 'GÃ©nero',
      'about.dob': 'Fecha de nacimiento',
      'about.bio': 'BiografÃ­a',
      'friends.coming_soon': 'Lista de amigos prÃ³ximamenteâ€¦',
      'photos.coming_soon': 'Fotos prÃ³ximamenteâ€¦',
      'profile.no_posts': 'Sin publicaciones.',
      'post.actions': 'Acciones de la publicaciÃ³n',
      'post.like': 'Me gusta',
      'post.comment': 'Comentar',
      'post.loading_comments': 'Cargando comentariosâ€¦',
      'post.write_comment': 'Escribe un comentario...',
      'post.post': 'Publicar',
      'post.posting': 'Publicandoâ€¦',
      'post.edit': 'Editar',
      'post.delete': 'Eliminar',
      'post.delete_title': 'Â¿Eliminar la publicaciÃ³n?',
      'post.delete_message': 'Esta acciÃ³n no se puede deshacer.',
      'errors.could_not_load_feed': 'No se pudo cargar el feed.',
      'errors.could_not_load_more': 'No se pudieron cargar mÃ¡s publicaciones.',
      'errors.could_not_load_timeline': 'No se pudo cargar la biografÃ­a.',
      'auth.login_required': 'Inicia sesiÃ³n para continuar.',
      'errors.session_expired': 'SesiÃ³n expirada. Vuelve a iniciar sesiÃ³n.',
      'errors.network': 'Error de red',
      'success.post_published': 'PublicaciÃ³n creada',
      'errors.failed_create_post': 'Error al crear la publicaciÃ³n',
      'success.post_updated': 'PublicaciÃ³n actualizada',
      'errors.failed_update_post': 'Error al actualizar la publicaciÃ³n',
      'success.post_deleted': 'PublicaciÃ³n eliminada',
      'errors.failed_delete_post': 'Error al eliminar la publicaciÃ³n',
      'errors.failed_like': 'Error al indicar que te gusta',
      'success.comment_added': 'Comentario aÃ±adido',
      'errors.failed_add_comment': 'Error al aÃ±adir comentario',
      'login.hero_title': 'mitratales',
      'login.hero_line1': 'ConÃ©ctate con amigos y el mundo',
      'login.hero_line2': 'que te rodea en Mitratales.',
      'login.title': 'Inicia sesiÃ³n en Mitratales',
      'login.email_placeholder': 'Correo electrÃ³nico o nÃºmero de telÃ©fono',
      'login.password_placeholder': 'ContraseÃ±a',
      'login.submit': 'Iniciar sesiÃ³n',
      'login.forgot': 'Â¿Olvidaste tu contraseÃ±a?',
      'login.create_account': 'Crear cuenta nueva',
      'login.footer_note': 'Crea una pÃ¡gina para una celebridad, marca o negocio.',
      'login.success': 'Inicio de sesiÃ³n exitoso',
      'login.failed': 'Error al iniciar sesiÃ³n',
    });
    // Apply saved locale
    setLocale(locale);
  }, []);

  const changeLocale = (e) => {
    const next = e.target.value;
    setLocaleState(next);
    setLocale(next);
    try { localStorage.setItem('locale', next); } catch {}
  };

  // Notifications polling: friend requests, likes, comments
  const lastCheckRef = useRef(new Date().toISOString());
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const since = lastCheckRef.current;
      try {
        const res = await fetch(`/api/notifications/summary?since=${encodeURIComponent(since)}` ,{
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({ pendingFriendRequests:0, newLikes:0, newComments:0 }));
        if (cancelled) return;
        if (res.ok) {
          if (data.pendingFriendRequests > 0) notify('info', `You have ${data.pendingFriendRequests} friend request${data.pendingFriendRequests>1?'s':''}`);
          if (data.newLikes > 0) notify('info', `You received ${data.newLikes} new like${data.newLikes>1?'s':''}`);
          if (data.newComments > 0) notify('info', `You received ${data.newComments} new comment${data.newComments>1?'s':''}`);
        }
      } catch {}
      finally {
        lastCheckRef.current = new Date().toISOString();
      }
    };
    // initial run and interval
    poll();
    const id = setInterval(poll, 45000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('search_recents') || '[]');
      if (Array.isArray(saved)) setRecents(saved);
    } catch {}
  }, []);

  const saveRecent = (term) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recents.filter(r => r.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    setRecents(next);
    try { localStorage.setItem('search_recents', JSON.stringify(next)); } catch {}
  };

  const runSearch = async (value) => {
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      setSearchLoading(false);
      setSearchError('');
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(value)}`);
      const data = await res.json().catch(() => ({ users: [] }));

      if (!res.ok) {
        throw new Error(data.message || 'Search failed');
      }

      setResults(data.users || []);
      setShowResults(true);
      setActiveIndex(data.users && data.users.length ? 0 : -1);
    } catch (error) {
      setResults([]);
      setSearchError(error.message || 'Search failed');
      setShowResults(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const search = (value) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 250);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch {}
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dataset.theme = next;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setQ('');
      setResults([]);
      setShowResults(false);
      return;
    }
    if (!showResults || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const sel = results[activeIndex];
      if (sel) {
        setShowResults(false);
        navigate(`/profile?u=${sel.username}`);
        saveRecent(q);
      }
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    } catch {}
    setOpen(false);
    notify('info', t('toast.logged_out'));
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };
  const navItems = [
    {
      to: '/',
      label: t('nav.home'),
      icon: (
        <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
      )
    },
    {
      to: '/messenger',
      label: t('nav.messenger'),
      icon: (
        <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" /></svg>
      )
    },
    {
      to: '/groups',
      label: t('nav.groups'),
      icon: (
        <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
      )
    },
    {
      to: '/watch',
      label: t('nav.watch'),
      icon: (
        <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M10 16.5l6-4.5-6-4.5v9z M21 3H3c-1.1 0-2 .9-2 2v14a2 2 0 0 0 2 2h18c1.1 0 2-.9 2-2V5 a2 2 0 0 0-2-2z" /></svg>
      )
    },
    {
      to: '/marketplace',
      label: t('nav.marketplace'),
      icon: (
        <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16 6V5a4 4 0 0 0-8 0v1H4v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6h-4zm-6-1a2 2 0 0 1 4 0v1h-4V5zm8 15H6V8h12v12z" /></svg>
      )
    },
    {
      to: '/gallery',
      label: t('nav.gallery'),
      icon: (
        <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M21 4H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zm-1 14H4V6h16v12zm-5-9l-2.03 2.71-1.31-1.65L9 14h10l-4-5z" /></svg>
      )
    }
  ];

    const themeEmoji = theme === 'dark' ? '🌙' : '☀️';

  return (
    <header className="fb-header">
      <div className="fb-header-inner">
        <div className="fb-brand">
          <Link to="/" className="fb-logo">{t('brand.title')}</Link>
          <div className="fb-search-wrap" ref={searchRef}>
            <span className="fb-search-icon" aria-hidden="true">ðŸ”</span>
            <input
              className="fb-search"
              placeholder={t('search.placeholder')}
              value={q}
              onChange={(e) => search(e.target.value)}
              onFocus={() => { if (results.length) setShowResults(true); }}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
            {q && (
              <button
                type="button"
                className="fb-search-clear"
                aria-label={t('search.clear')}
                onClick={() => { setQ(''); setResults([]); setShowResults(false); inputRef.current && inputRef.current.focus(); }}
              >
                âœ•
              </button>
            )}
            {showResults && (
              <div className="fb-search-dropdown">
                {searchLoading ? (
                  <div className="fb-search-item muted" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{width: '16px', height: '16px', border: '2px solid #ccc', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                    Searching...
                  </div>
                ) : searchError ? (
                  <div className="fb-search-item muted" style={{color: '#d11a2a'}}>
                    {searchError}
                  </div>
                ) : q.trim() === '' ? (
                  <>
                    <div className="fb-search-item muted">{t('search.recents')}</div>
                    {recents.length === 0 ? (
                      <div className="fb-search-item muted">{t('search.no_recents')}</div>
                    ) : (
                      recents.map((r, idx) => (
                        <button
                          key={r+idx}
                          type="button"
                          className="fb-search-item"
                          onClick={() => { setQ(r); runSearch(r); inputRef.current && inputRef.current.focus(); }}
                        >
                          <span className="fb-avatar-circle">{r.charAt(0).toUpperCase()}</span>
                          <div className="fb-search-meta">
                            <div className="name">{r}</div>
                            <div className="sub">{t('search.recent')}</div>
                          </div>
                        </button>
                      ))
                    )}
                    {recents.length > 0 && (
                      <button type="button" className="fb-search-item" onClick={() => { setRecents([]); try{localStorage.removeItem('search_recents')}catch{} }}>
                        {t('search.clear_recents')}
                      </button>
                    )}
                  </>
                ) : (
                  results.length === 0 ? (
                    <div className="fb-search-item muted">{t('search.no_results')}</div>
                  ) : (
                    <>
                      <div className="fb-search-item muted" style={{fontSize: '12px', color: '#65676B'}}>
                        Users
                      </div>
                      {results.map((u, idx) => (
                        <Link key={u.username} className={`fb-search-item ${idx === activeIndex ? 'active' : ''}`} to={`/profile?u=${u.username}`} onClick={() => { setShowResults(false); saveRecent(q); }} onMouseEnter={() => setActiveIndex(idx)}>
                          <span className="fb-avatar-circle">{u.username.charAt(0).toUpperCase()}</span>
                          <div className="fb-search-meta">
                            <div className="name">{u.username}</div>
                            <div className="sub">{u.email}</div>
                          </div>
                        </Link>
                      ))}
                    </>
                  )
                )}
              </div>
            )}
          </div>
        </div>
        <nav className="fb-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) => `fb-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="fb-nav-icon">{item.icon}</span>
              <span className="fb-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="fb-right">
          <div className="fb-quick-actions">
            <div className="fb-select-wrap">
              <select aria-label="Language" value={locale} onChange={changeLocale} className="fb-select">
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="fr">FR</option>
                <option value="de">DE</option>
                <option value="es">ES</option>
              </select>
            </div>
            <button
              type="button"
              className="fb-chip"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              <span className="fb-chip-icon" aria-hidden="true">{themeEmoji}</span>
              <span className="fb-chip-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
          <button className="fb-userchip" onClick={() => setOpen(v => !v)}>
            <span className="fb-avatar-circle">{(displayName||'J').charAt(0).toUpperCase()}</span>
            <span className="fb-user-name">{displayName}</span>
          </button>
          {open && (
            <div className="fb-dropdown" onMouseLeave={() => setOpen(false)}>
              <Link to="/profile" className="fb-dropdown-item">{t('nav.profile')}</Link>
              <button className="fb-dropdown-item danger" onClick={handleLogout}>{t('nav.logout')}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}




