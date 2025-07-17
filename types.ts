export enum Sender {
  User = 'user',
  Sofi = 'sofi',
}

export enum ChatMode {
  Sofi = 'sofi',
  Psychologist = 'psychologist',
  Live = 'live',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
}

export interface UserInfo {
  name: string;
  gender: string;
  birthDate: string;
}