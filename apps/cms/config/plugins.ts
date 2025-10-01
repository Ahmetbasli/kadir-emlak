export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          endpoint: env('OBJECT_STORAGE_ENDPOINT'),
          region: env('OBJECT_STORAGE_REGION', 'auto'),
          forcePathStyle: true,
          credentials: {
            accessKeyId: env('OBJECT_STORAGE_ACCESS_KEY_ID'),
            secretAccessKey: env('OBJECT_STORAGE_SECRET_ACCESS_KEY'),
          },
        },
        params: {
          Bucket: env('OBJECT_STORAGE_BUCKET_NAME'),
        },
        baseUrl: env('OBJECT_STORAGE_PUBLIC_BASE_URL'),
        rootPath: 'kadiremlak/cms',
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  documentation: {
    enabled: true,
  },
});
