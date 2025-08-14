import React, { useState } from 'react';
import { ChatMode } from '../types';

interface SofiAvatarProps {
    size: 'small' | 'medium' | 'large';
    chatMode: ChatMode;
    isAnimating?: boolean;
}

const SofiAvatar: React.FC<SofiAvatarProps> = ({ size, chatMode, isAnimating = false }) => {
    const isSofiMode = chatMode === ChatMode.Sofi || chatMode === ChatMode.Live;
    const [imageError, setImageError] = useState(false);

    const sizeClasses = {
        small: `w-8 h-8 ${!isSofiMode || imageError ? 'text-lg' : ''}`,
        medium: `w-10 h-10 ${!isSofiMode || imageError ? 'text-xl' : ''}`,
        large: `w-24 h-24 ${!isSofiMode || imageError ? 'text-5xl' : ''}`,
    };
    
    const handleImageError = () => {
        setImageError(true);
    };

    const getTheme = () => {
        switch(chatMode) {
            case ChatMode.Psychologist:
                return { icon: '🧠', bg: 'bg-gradient-to-br from-sky-400 to-teal-500' };
            case ChatMode.Artist:
                return { icon: '🎨', bg: 'bg-gradient-to-br from-purple-400 to-indigo-500' };
            case ChatMode.Chef:
                return { icon: '🍳', bg: 'bg-gradient-to-br from-orange-400 to-amber-500' };
            case ChatMode.DJ:
                return { icon: '🎶', bg: 'bg-gradient-to-br from-sky-400 to-cyan-500' };
            case ChatMode.Coding:
                return { icon: '💻', bg: 'bg-gradient-to-br from-indigo-500 to-purple-600' };
            case ChatMode.Sofi:
            case ChatMode.Live:
            default:
                if (imageError) {
                    return { icon: '💖', bg: 'bg-gradient-to-br from-rose-400 to-pink-500' };
                }
                return { 
                    icon: <img src="/sofi_avatar.png" alt="Sofi" className="w-full h-full object-cover" onError={handleImageError} />, 
                    bg: 'bg-transparent' 
                };
        }
    }
    const { icon, bg: backgroundClass } = getTheme();

    const getAnimationClass = () => {
        if (isAnimating && (size === 'large' || chatMode === ChatMode.Sofi)) {
             return 'animate-gentle-wiggle';
        }
        
        if (!isAnimating && size === 'medium') {
            switch(chatMode) {
                case ChatMode.Psychologist: return 'animate-psychologist-pulse';
                case ChatMode.Artist: return 'animate-artist-sway';
                case ChatMode.Chef: return 'animate-chef-jiggle';
                case ChatMode.DJ: return 'animate-dj-beat';
                case ChatMode.Coding: return 'animate-coding-typing';
                case ChatMode.Sofi:
                case ChatMode.Live:
                default: 
                    return imageError ? '' : 'animate-subtle-bob';
            }
        }
        return '';
    };
    
    const animationClass = getAnimationClass();

    return (
        <div className={`flex items-center justify-center rounded-full text-white shadow-md transition-all duration-300 ${sizeClasses[size]} ${backgroundClass} ${animationClass} ${isSofiMode && !imageError ? 'overflow-hidden' : ''}`}>
            {icon}
        </div>
    );
}

export default SofiAvatar;