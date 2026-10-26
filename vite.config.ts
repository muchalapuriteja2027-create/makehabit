import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export default defineConfig(({ mode }) => {
  // These are public site identifiers, not private API secrets.
  // They are injected into the generated HTML only when explicitly configured.
  const env = loadEnv(mode, process.cwd(), '');
  const rawClarityProjectId = env.VITE_CLARITY_PROJECT_ID?.trim() || '';
  const clarityProjectId = /^[a-zA-Z0-9]+$/.test(rawClarityProjectId)
    ? rawClarityProjectId
    : '';
  const googleSiteVerification = env.VITE_GOOGLE_SITE_VERIFICATION?.trim() || '';

  const siteIntegrationsPlugin = {
    name: 'makehabit-site-integrations',
    transformIndexHtml(html: string) {
      let output = html;

      if (googleSiteVerification) {
        const verificationTag = `<meta name="google-site-verification" content="${escapeHtmlAttribute(googleSiteVerification)}" />`;
        const existingTag = /<meta\s+name=["']google-site-verification["'][^>]*>/i;
        if (existingTag.test(output)) {
          output = output.replace(existingTag, verificationTag);
        } else {
          output = output.replace('</head>', `    ${verificationTag}\n  </head>`);
        }
      }

      if (clarityProjectId && !output.includes('https://www.clarity.ms/tag/')) {
        const clarityScript = `<!-- Microsoft Clarity -->\n<script type="text/javascript">\n(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", ${JSON.stringify(clarityProjectId)});\n</script>`;
        output = output.replace('</head>', `    ${clarityScript}\n  </head>`);
      }

      return output;
    },
  };

  return {
    base: '/',
    plugins: [react(), tailwindcss(), siteIntegrationsPlugin],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
