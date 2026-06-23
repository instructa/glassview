export type GlassviewEnv = {
  SCREENSHOTS: R2Bucket;
  GLASSVIEW_UPLOAD_TOKEN: string;
  STAGE?: string;
};

export type ScreenshotMetadata = {
  id: string;
  label?: string;
  sourceUrl?: string;
  appName?: string;
  viewport?: string;
  note?: string;
  imageKey: string;
  metaKey: string;
  contentType: string;
  size: number;
  createdAt: string;
  viewUrl: string;
  rawUrl: string;
};

export type UploadResponse = Pick<
  ScreenshotMetadata,
  "id" | "viewUrl" | "rawUrl" | "createdAt"
>;
