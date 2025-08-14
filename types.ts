export enum Sender {
  User = 'user',
  Sofi = 'sofi',
}

export enum ChatMode {
  Sofi = 'sofi',
  Psychologist = 'psychologist',
  Live = 'live',
  Artist = 'artist',
  Chef = 'chef',
  DJ = 'dj',
  Coding = 'coding',
}

export enum DataType {
  Recipe = 'recipe',
  Playlist = 'playlist',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  imageUrl?: string;
  structuredData?: any;
  dataType?: DataType;
}

export interface UserInfo {
  name: string;
  gender: string;
  birthDate: string;
}

export interface Task {
  id:string;
  text: string;
  completed: boolean;
}

// UserData now stores messages in a structured way for each mode.
export interface UserData {
  userInfo: UserInfo;
  passwordHash: string; // Kept for potential future use or migration, but not actively used.
  messagesByMode: Partial<Record<ChatMode, Message[]>>;
  diaryEntries: Record<string, string>;
  notes: string;
  tasks: Task[];
}