// import type { Core } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: any }) {
    const docsRootCandidates = [
      // When compiled, JSONs are emitted under dist/src/...
      path.resolve(__dirname, 'src', 'extensions', 'documentation', 'documentation'),
      // When running in dev, fall back to source path
      path.resolve(process.cwd(), 'src', 'extensions', 'documentation', 'documentation'),
    ];

    const resolveDocFile = (version: string) => {
      for (const root of docsRootCandidates) {
        const fullPath = path.join(root, version, 'full_documentation.json');
        if (fs.existsSync(fullPath)) return fullPath;
      }
      return null;
    };

    const listAvailableVersions = (): string[] => {
      for (const root of docsRootCandidates) {
        if (fs.existsSync(root)) {
          try {
            return fs
              .readdirSync(root, { withFileTypes: true })
              .filter((d) => d.isDirectory())
              .map((d) => d.name)
              .sort((a, b) => {
                const pa = a.split('.').map((n) => parseInt(n, 10));
                const pb = b.split('.').map((n) => parseInt(n, 10));
                for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
                  const da = pa[i] || 0;
                  const db = pb[i] || 0;
                  if (da !== db) return da - db;
                }
                return 0;
              });
          } catch (e) {}
        }
      }
      return [];
    };

    const getLatestVersion = (): string | null => {
      const versions = listAvailableVersions();
      if (!versions.length) return null;
      return versions[versions.length - 1];
    };

    const serveSpec = async (ctx: any, version?: string) => {
      const effectiveVersion = version || getLatestVersion();
      if (!effectiveVersion) {
        ctx.status = 404;
        ctx.body = { data: null, error: { status: 404, name: 'NotFoundError', message: 'Documentation not found', details: {} } };
        return;
      }
      const filePath = resolveDocFile(effectiveVersion);
      if (!filePath) {
        ctx.status = 404;
        ctx.body = { data: null, error: { status: 404, name: 'NotFoundError', message: 'Documentation not found', details: {} } };
        return;
      }
      try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Parse spec and augment it so content types are visible in Swagger
        let spec: any;
        try {
          spec = JSON.parse(content);
        } catch {
          spec = {};
        }

        // Initialize required OpenAPI structure if missing
        spec.openapi = spec.openapi || '3.0.0';
        spec.info = spec.info || { title: 'Strapi API', version: '1.0.0' };
        spec.paths = spec.paths || {};
        spec.components = spec.components || {};
        spec.components.securitySchemes = spec.components.securitySchemes || {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        };
        spec.security = spec.security || [{ bearerAuth: [] }];
        spec.tags = spec.tags || [];

        const ensureTag = (name: string) => {
          if (!spec.tags.find((t: any) => t.name === name)) {
            spec.tags.push({ name });
          }
        };

        const contentTypes: Record<string, any> = (strapi as any).contentTypes || {};

        for (const [uid, ct] of Object.entries(contentTypes)) {
          // Only include application APIs (skip core/plugin CTs)
          if (!uid.startsWith('api::')) continue;
          const info = (ct as any).info || {};
          const pluralName = info.pluralName || (ct as any).collectionName || uid.split('.')[1];
          const display = info.displayName || pluralName;
          const basePath = `/api/${pluralName}`;

          ensureTag(display);

          // ---- Build component schemas for this content-type
          const singular = info.singularName || display;
          const schemaBaseName = singular
            .replace(/\s+/g, '')
            .replace(/^[a-z]/, (c: string) => c.toUpperCase());

          const attributes: Record<string, any> = (ct as any).attributes || {};
          const properties: Record<string, any> = {};
          const required: string[] = [];

          const mapAttr = (name: string, def: any): any => {
            if (def?.required) required.push(name);
            switch (def?.type) {
              case 'string':
              case 'text':
              case 'richtext':
              case 'uid':
                return { type: 'string' };
              case 'email':
                return { type: 'string', format: 'email' };
              case 'integer':
                return { type: 'integer' };
              case 'biginteger':
                return { type: 'integer' };
              case 'decimal':
              case 'float':
              case 'number':
                return { type: 'number' };
              case 'boolean':
                return { type: 'boolean' };
              case 'enumeration':
                return { type: 'string', enum: Array.isArray(def?.enum) ? def.enum : [] };
              case 'json':
                return { type: 'object' };
              case 'media':
                if (def?.multiple) {
                  return { type: 'object' };
                }
                return { type: 'object' };
              case 'component':
                return { type: 'object' };
              case 'relation':
                return { type: 'object' };
              default:
                return { type: 'object' };
            }
          };

          for (const [attrName, attrDef] of Object.entries(attributes)) {
            properties[attrName] = mapAttr(attrName, attrDef);
          }

          const attributesSchemaName = `${schemaBaseName}Attributes`;
          const entrySchemaName = schemaBaseName;
          const listResponseName = `${schemaBaseName}ListResponse`;
          const singleResponseName = `${schemaBaseName}Response`;
          const writeRequestName = `${schemaBaseName}WriteRequest`;

          spec.components.schemas[attributesSchemaName] = {
            type: 'object',
            properties,
            ...(required.length ? { required } : {}),
          };

          spec.components.schemas[entrySchemaName] = {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              attributes: { $ref: `#/components/schemas/${attributesSchemaName}` },
            },
          };

          spec.components.schemas[listResponseName] = {
            type: 'object',
            properties: {
              data: { type: 'array', items: { $ref: `#/components/schemas/${entrySchemaName}` } },
              meta: { type: 'object' },
            },
          };

          spec.components.schemas[singleResponseName] = {
            type: 'object',
            properties: {
              data: { $ref: `#/components/schemas/${entrySchemaName}` },
              meta: { type: 'object' },
            },
          };

          spec.components.schemas[writeRequestName] = {
            type: 'object',
            properties: {
              data: { $ref: `#/components/schemas/${attributesSchemaName}` },
            },
            required: ['data'],
          };

          // Collection path: GET list, POST create
          if (!spec.paths[basePath]) spec.paths[basePath] = {};
          spec.paths[basePath].get = spec.paths[basePath].get || {
            tags: [display],
            summary: `List ${display}`,
            responses: {
              200: {
                description: 'List response',
                content: { 'application/json': { schema: { $ref: `#/components/schemas/${listResponseName}` } } },
              },
            },
          };
          spec.paths[basePath].post = spec.paths[basePath].post || {
            tags: [display],
            summary: `Create ${info.singularName || display}`,
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${writeRequestName}` } } } },
            responses: {
              201: {
                description: 'Created',
                content: { 'application/json': { schema: { $ref: `#/components/schemas/${singleResponseName}` } } },
              },
            },
          };

          // Single path: GET one, PUT update, DELETE remove
          const singlePath = `${basePath}/{id}`;
          if (!spec.paths[singlePath]) spec.paths[singlePath] = {};
          const idParam = [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ];
          spec.paths[singlePath].get = spec.paths[singlePath].get || {
            tags: [display],
            summary: `Get ${info.singularName || display}`,
            parameters: idParam,
            responses: {
              200: { description: 'OK', content: { 'application/json': { schema: { $ref: `#/components/schemas/${singleResponseName}` } } } },
            },
          };
          spec.paths[singlePath].put = spec.paths[singlePath].put || {
            tags: [display],
            summary: `Update ${info.singularName || display}`,
            parameters: idParam,
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${writeRequestName}` } } } },
            responses: {
              200: { description: 'Updated', content: { 'application/json': { schema: { $ref: `#/components/schemas/${singleResponseName}` } } } },
            },
          };
          spec.paths[singlePath].delete = spec.paths[singlePath].delete || {
            tags: [display],
            summary: `Delete ${info.singularName || display}`,
            parameters: idParam,
            responses: {
              200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: `#/components/schemas/${singleResponseName}` } } } },
            },
          };
        }

        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify(spec);
      } catch (err) {
        ctx.status = 500;
        ctx.body = { data: null, error: { status: 500, name: 'ServerError', message: 'Failed to read documentation', details: {} } };
      }
    };

    // Expose JSON endpoints for the generated documentation
    strapi.server.routes([
      {
        method: 'GET',
        path: '/documentation/:version/openapi.json',
        handler: async (ctx: any) => {
          await serveSpec(ctx, ctx.params?.version);
        },
        config: { auth: false },
      },
      {
        method: 'GET',
        path: '/documentation/:version/full_documentation.json',
        handler: async (ctx: any) => {
          await serveSpec(ctx, ctx.params?.version);
        },
        config: { auth: false },
      },
      {
        method: 'GET',
        path: '/documentation/openapi.json',
        handler: async (ctx: any) => {
          await serveSpec(ctx);
        },
        config: { auth: false },
      },
      {
        method: 'GET',
        path: '/documentation-json',
        handler: async (ctx: any) => {
          await serveSpec(ctx);
        },
        config: { auth: false },
      },
    ]);
  },

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
