// Trello Board interface
export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  url: string;
  shortUrl: string;
  prefs: {
    backgroundColor: string;
    backgroundImage?: string;
    cardAging: string;
    permissionLevel: string;
  };
  organization?: {
    id: string;
    name: string;
    displayName: string;
  };
}

// Trello Member interface
export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  url: string;
  avatarUrl?: string;
}

// Trello List interface
export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  softLimit?: number;
  idBoard: string;
  subscribed?: boolean;
}

// Trello Card interface
export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  pos: number;
  url: string;
  shortUrl: string;
  idList: string;
  idBoard: string;
  idMembers: string[];
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  due?: string;
  dueComplete: boolean;
  dateLastActivity: string;
}

// Trello API Configuration
export interface TrelloConfig {
  apiKey: string;
  token: string;
  baseUrl?: string;
  workingBoardId?: string;
}

// API Response wrapper
export interface TrelloApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
}

// HTTP Method types
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Request options for API calls
export interface TrelloRequestOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | boolean>;
  body?: any;
  headers?: Record<string, string>;
}

// Card Update Parameters interface
export interface CardUpdateParameters {
  cardId: string; // Required parameter
  name?: string;
  desc?: string;
  closed?: boolean;
  idList?: string;
  idBoard?: string;
  pos?: string | number; // "top", "bottom", or numeric position
  due?: string; // ISO 8601 date string
  start?: string; // ISO 8601 date string
  dueComplete?: boolean;
  idMembers?: string[]; // Array of member IDs
  idLabels?: string[]; // Array of label IDs
}

// Validation Error interface
export interface ValidationError {
  field: string;
  message: string;
  expectedFormat?: string;
}

// Card Update Response interface
export interface CardUpdateResponse {
  success: boolean;
  card?: TrelloCard;
  changes?: string[];
  errors?: ValidationError[];
}
