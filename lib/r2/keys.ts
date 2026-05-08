/**
 * Generates safe object keys for Cloudflare R2
 */
export const R2Keys = {
  /**
   * users/{userId}/projects/{projectId}/sources/{assetId}/{filename}
   */
  sourceAsset: (userId: string, projectId: string, assetId: string, filename: string) => {
    // Sanitize filename to prevent path traversal or issues
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `users/${userId}/projects/${projectId}/sources/${assetId}/${safeFilename}`;
  },

  /**
   * users/{userId}/projects/{projectId}/exports/{exportId}/final.mp4
   */
  exportFile: (userId: string, projectId: string, exportId: string, filename: string = "final.mp4") => {
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `users/${userId}/projects/${projectId}/exports/${exportId}/${safeFilename}`;
  },
};
