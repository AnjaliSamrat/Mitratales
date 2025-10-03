// Minimal i18n utility with in-memory dictionaries
// Usage: import { t, setLocale, register } from './i18n';
// t('post.like')

let currentLocale = 'en';
const dictionaries = {
  en: {
    'post.actions': 'Post actions',
    'post.like': 'Like',
    'post.comment': 'Comment',
    'post.loading': 'Loading…',
    'post.loading_comments': 'Loading comments…',
    'post.retry': 'Retry',
    'post.write_comment': 'Write a comment...',
    'post.post': 'Post',
    'post.posting': 'Posting…',
    'post.edit': 'Edit',
    'post.delete': 'Delete',
    'post.delete_title': 'Delete post?',
    'post.delete_message': 'This action cannot be undone.',
    'common.cancel': 'Cancel',
    'common.load_more': 'Load more',
    'feed.title': 'Feed',
    'feed.empty': 'No posts yet.',
    'errors.could_not_load_feed': 'Could not load feed.',
    'errors.could_not_load_more': 'Could not load more posts.',
    'errors.could_not_load_timeline': 'Could not load timeline.',
    'profile.no_posts': 'No posts yet.',
    'about.title': 'About',
    'friends.coming_soon': 'Friends list coming soon…',
    'photos.coming_soon': 'Photos coming soon…',
    'tabs.timeline': 'Timeline',
    'tabs.about': 'About',
    'tabs.friends': 'Friends',
    'tabs.photos': 'Photos',
    'about.name': 'Name',
    'about.gender': 'Gender',
    'about.dob': 'DOB',
    'about.bio': 'Bio',
    // Header & search
    'brand.title': 'Mitratales',
    'search.placeholder': 'Search users',
    'search.clear': 'Clear search',
    'search.recents': 'Recent searches',
    'search.no_recents': 'No recent searches',
    'search.recent': 'Recent',
    'search.clear_recents': 'Clear recent searches',
    'search.no_results': 'No results',
    // Nav
    'nav.home': 'Home',
    'nav.messenger': 'Messenger',
    'nav.groups': 'Groups',
    'nav.watch': 'Watch',
    'nav.marketplace': 'Marketplace',
    'nav.profile': 'Profile',
    'nav.logout': 'Log out',
    'nav.gallery': 'Gallery',
    'toast.logged_out': 'Logged out',
    // Auth/messages
    'auth.login_required': 'Please log in to continue.',
    'errors.session_expired': 'Session expired. Please log in again.',
    'errors.network': 'Network error',
    // Post/comment actions
    'success.post_published': 'Post published',
    'errors.failed_create_post': 'Failed to create post',
    'success.post_updated': 'Post updated',
    'errors.failed_update_post': 'Failed to update post',
    'success.post_deleted': 'Post deleted',
    'errors.failed_delete_post': 'Failed to delete post',
    'errors.failed_like': 'Failed to like post',
    'success.comment_added': 'Comment added',
    'errors.failed_add_comment': 'Failed to add comment',
    // Login
    'login.hero_title': 'mitratales',
    'login.hero_line1': 'Connect with friends and the world',
    'login.hero_line2': 'around you on Mitratales.',
    'login.title': 'Log in to Mitratales',
    'login.email_placeholder': 'Email or phone number',
    'login.password_placeholder': 'Password',
    'login.submit': 'Log in',
    'login.forgot': 'Forgot password?',
    'login.create_account': 'Create new account',
    'login.footer_note': 'Create a Page for a celebrity, brand or business.',
    'login.success': 'Login successful',
    'login.failed': 'Login failed',
    // Home and rails
    'home.sponsored': 'Sponsored',
    'home.birthdays': 'Birthdays',
    'home.contacts': 'Contacts',
    'home.online': 'Online',
    'home.friend_requests': 'Friend Requests',
    'home.notifications': 'Notifications',
    'left.friends': 'Friends',
    'left.groups': 'Groups',
    'left.marketplace': 'Marketplace',
    'left.watch': 'Watch',
    'left.memories': 'Memories',
  },
};

export function t(key, fallback) {
  const dict = dictionaries[currentLocale] || dictionaries.en;
  return dict[key] || fallback || key;
}

export function setLocale(locale) {
  currentLocale = locale in dictionaries ? locale : 'en';
}

export function register(locale, dict) {
  dictionaries[locale] = { ...(dictionaries[locale] || {}), ...dict };
}
