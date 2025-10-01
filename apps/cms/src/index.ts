// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // Ensure locales exist
    const desiredLocales = [
      { code: 'en', name: 'English (en)' },
      { code: 'tr', name: 'Türkçe (tr)' },
      { code: 'ru', name: 'Русский (ru)' },
    ];

    try {
      const existing = await strapi.plugins['i18n'].services.locales.find();
      const existingCodes = new Set(existing.map((l: any) => l.code));

      for (const locale of desiredLocales) {
        if (!existingCodes.has(locale.code)) {
          await strapi.plugins['i18n'].services.locales.create(locale);
        }
      }
    } catch (err) {
      strapi.log.warn('i18n plugin not initialized yet or error ensuring locales');
    }
  },
};
