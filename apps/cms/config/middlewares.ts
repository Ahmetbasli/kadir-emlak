export default ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            env('OBJECT_STORAGE_PUBLIC_BASE_URL') ? env('OBJECT_STORAGE_PUBLIC_BASE_URL').replace(/^https?:\/\//, '') : '',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            env('OBJECT_STORAGE_PUBLIC_BASE_URL') ? env('OBJECT_STORAGE_PUBLIC_BASE_URL').replace(/^https?:\/\//, '') : '',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
