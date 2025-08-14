import React, { useState } from 'react';
import { ChatMode } from '../types';
import type { UserInfo } from '../types';
import SofiAvatar from './SofiAvatar';

interface UserInfoFormProps {
  onStart: (info: UserInfo) => void;
  isLoading: boolean;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({ onStart, isLoading }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && gender && birthDate) {
      onStart({ name, gender, birthDate });
    }
  };
  
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-pop-in">
      <SofiAvatar size="large" chatMode={ChatMode.Sofi} isAnimating={true} />
      <h1 className="text-3xl font-bold text-rose-500 mt-4">Olá, eu sou a Sofi! 💖</h1>
      <p className="text-gray-600 mt-2 mb-8 max-w-md">Para a gente se conhecer melhor, conta-me um pouquinho sobre ti? Prometo que vai ser divertido! ✨</p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="name" className="block text-left text-sm font-medium text-gray-700 mb-1">O teu nome fofo:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como te posso chamar?"
            required
            className="w-full px-4 py-2 border border-rose-200 rounded-full focus:ring-2 focus:ring-rose-400 focus:outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-left text-sm font-medium text-gray-700 mb-1">O teu género:</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            className="w-full px-4 py-2 border border-rose-200 rounded-full focus:ring-2 focus:ring-rose-400 focus:outline-none transition bg-white"
          >
            <option value="" disabled>Seleciona uma opção</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Não-binário">Não-binário</option>
            <option value="Prefiro não dizer">Prefiro não dizer</option>
          </select>
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-left text-sm font-medium text-gray-700 mb-1">Quando nasceste?</label>
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
            max={today}
            className="w-full px-4 py-2 border border-rose-200 rounded-full focus:ring-2 focus:ring-rose-400 focus:outline-none transition"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !name || !gender || !birthDate}
          className="w-full bg-rose-500 text-white font-bold py-3 px-4 rounded-full hover:bg-rose-600 transition-transform transform hover:scale-105 active:scale-95 disabled:bg-rose-300 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
        >
          {isLoading ? 'Um momentinho... ✨' : 'Começar a conversa!'}
        </button>
      </form>
    </div>
  );
};

export default UserInfoForm;