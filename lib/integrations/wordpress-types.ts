export type WordPressPermissions = {
  canCreateDrafts: boolean;
  canUpdateMeta: boolean;
  canPublish: boolean;
};

export type WordPressConnectionMetadata = {
  connectionStatus: string;
  siteUrl: string | null;
  pluginVersion: string | null;
  lastPingAt: string | null;
  permissions: WordPressPermissions | null;
};

export type WordPressCreateConnectionResponse = {
  data: {
    connection: {
      id: string;
      siteUrl: string;
      status: string;
      permissions: WordPressPermissions;
      createdAt: string;
    };
    apiKey?: string;
    apiSecret?: string;
    message?: string;
  };
};

export type WordPressPingResponse = {
  success: true;
  permissions: WordPressPermissions;
};
