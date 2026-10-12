/**
 * Returns the proper path for public static assets, accounting for GitHub Pages
 * repository basePath (/Mediunify-Super-admin) and local dev environments.
 */
export function getAssetPath(path) {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:')
  ) {
    return path;
  }

  let basePath = '';

  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/Mediunify-Super-admin')) {
      basePath = '/Mediunify-Super-admin';
    }
  } else if (
    process.env.GITHUB_PAGES === 'true' ||
    process.env.GITHUB_ACTIONS ||
    process.env.NEXT_PUBLIC_BASE_PATH
  ) {
    basePath = '/Mediunify-Super-admin';
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
}
