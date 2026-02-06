// Lark API Base Types

export const LARK_BASE_URL = "https://open.larksuite.com";

// OAuth Types
export interface LarkOAuthTokenResponse {
  code: number;
  msg: string;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    refresh_expires_in: number;
    scope: string;
  };
}

export interface LarkUserInfo {
  sub: string;
  name: string;
  picture: string;
  open_id: string;
  union_id: string;
  en_name: string;
  tenant_key: string;
  avatar_url: string;
  avatar_thumb: string;
  avatar_middle: string;
  avatar_big: string;
  user_id?: string;
}

export interface LarkUserInfoResponse {
  code: number;
  msg: string;
  data: LarkUserInfo;
}

// Document Types
export interface LarkCreateDocumentResponse {
  code: number;
  msg: string;
  data: {
    document: {
      document_id: string;
      revision_id: number;
      title: string;
    };
  };
}

export type LarkBlockType =
  | "page"
  | "text"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "heading7"
  | "heading8"
  | "heading9"
  | "bullet"
  | "ordered"
  | "code"
  | "quote"
  | "todo"
  | "divider"
  | "image"
  | "table"
  | "callout";

export interface LarkTextElement {
  text_run?: {
    content: string;
    text_element_style?: {
      bold?: boolean;
      italic?: boolean;
      strikethrough?: boolean;
      underline?: boolean;
      inline_code?: boolean;
      link?: {
        url: string;
      };
    };
  };
}

export interface LarkBlock {
  block_type: number;
  text?: {
    elements: LarkTextElement[];
    style?: {
      align?: number;
    };
  };
  heading1?: {
    elements: LarkTextElement[];
  };
  heading2?: {
    elements: LarkTextElement[];
  };
  heading3?: {
    elements: LarkTextElement[];
  };
  bullet?: {
    elements: LarkTextElement[];
  };
  ordered?: {
    elements: LarkTextElement[];
  };
  divider?: Record<string, never>;
  image?: {
    file_token: string;
    width?: number;
    height?: number;
  };
  // For updating image blocks
  replace_image?: {
    token: string;
  };
}

// Block type numbers (Lark uses numeric types)
export const BLOCK_TYPE = {
  PAGE: 1,
  TEXT: 2,
  HEADING1: 3,
  HEADING2: 4,
  HEADING3: 5,
  HEADING4: 6,
  HEADING5: 7,
  HEADING6: 8,
  HEADING7: 9,
  HEADING8: 10,
  HEADING9: 11,
  BULLET: 12,
  ORDERED: 13,
  CODE: 14,
  QUOTE: 15,
  TODO: 17,
  DIVIDER: 22,
  IMAGE: 27,
  TABLE: 31,
  CALLOUT: 34,
} as const;

export interface LarkCreateBlockResponse {
  code: number;
  msg: string;
  data: {
    children: Array<{
      block_id: string;
      block_type: number;
      parent_id: string;
    }>;
  };
}

// Media/File Types
export interface LarkUploadMediaResponse {
  code: number;
  msg: string;
  data: {
    file_token: string;
  };
}

// Folder Types
export interface LarkFolder {
  token: string;
  name: string;
  type: string;
  parent_token?: string;
}

export interface LarkListFoldersResponse {
  code: number;
  msg: string;
  data: {
    files: LarkFolder[];
    has_more: boolean;
    next_page_token?: string;
  };
}

export interface LarkRootFolderResponse {
  code: number;
  msg: string;
  data: {
    token: string;
    id: string;
    user_id: string;
  };
}

// Chat Types
export interface LarkChat {
  chat_id: string;
  name: string;
  avatar: string;
  description: string;
  owner_id: string;
  owner_id_type: string;
  chat_mode: string;
  chat_type: string;
  external: boolean;
}

export interface LarkListChatsResponse {
  code: number;
  msg: string;
  data: {
    items: LarkChat[];
    has_more: boolean;
    page_token?: string;
  };
}

// Message Types
export interface LarkMessageCard {
  config?: {
    wide_screen_mode?: boolean;
  };
  header?: {
    title: {
      tag: "plain_text";
      content: string;
    };
    template?: string;
  };
  elements: LarkCardElement[];
}

export type LarkCardElement =
  | {
      tag: "div";
      text: {
        tag: "plain_text" | "lark_md";
        content: string;
      };
    }
  | {
      tag: "action";
      actions: Array<{
        tag: "button";
        text: {
          tag: "plain_text";
          content: string;
        };
        type: "primary" | "default" | "danger";
        url?: string;
      }>;
    }
  | {
      tag: "hr";
    };

export interface LarkSendMessageResponse {
  code: number;
  msg: string;
  data: {
    message_id: string;
  };
}

// API Error
export interface LarkApiError {
  code: number;
  msg: string;
}

export class LarkError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = "LarkError";
  }
}

// App Settings (for reference)
export interface LarkSettings {
  appId: string;
  appSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}
