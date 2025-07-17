import React from 'react';
import { ChatMode } from '../types';

interface SofiAvatarProps {
    size: 'small' | 'medium' | 'large';
    chatMode: ChatMode;
    isAnimating?: boolean;
}

const SofiAvatar: React.FC<SofiAvatarProps> = ({ size, chatMode, isAnimating = false }) => {
    const sizeClasses = {
        small: 'w-8 h-8 text-lg',
        medium: 'w-10 h-10 text-xl',
        large: 'w-24 h-24 text-5xl',
    };

    const isPsychologistMode = chatMode === ChatMode.Psychologist;

    const backgroundClass = isPsychologistMode
        ? 'bg-gradient-to-br from-sky-400 to-teal-500'
        : 'bg-gradient-to-br from-rose-300 to-pink-400';
    
    const icon = isPsychologistMode ? '🧠' : '💖';

    const animationClass = isAnimating && !isPsychologistMode 
        ? 'animate-gentle-wiggle' 
        : (!isPsychologistMode && size === 'medium' && !isAnimating ? 'animate-subtle-bob' : '');

    return (
        <div className={`flex items-center justify-center rounded-full text-white shadow-md transition-all duration-300 ${sizeClasses[size]} ${backgroundClass} ${animationClass}`}>
            {icon}
        </div>
    );
}

export default SofiAvatar;