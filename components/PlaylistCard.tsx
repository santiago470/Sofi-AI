import React from 'react';

interface Song {
    title: string;
    artist: string;
}

interface Playlist {
  playlistName: string;
  description: string;
  songs: Song[];
}

interface PlaylistCardProps {
  data: Playlist;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ data }) => {
  const createSearchLink = (service: 'spotify' | 'youtube', song: Song) => {
    const query = encodeURIComponent(`${song.title} ${song.artist}`);
    if (service === 'spotify') {
      return `https://open.spotify.com/search/${query}`;
    }
    // YouTube Music
    return `https://music.youtube.com/search?q=${query}`;
  };
  
  return (
    <div className="bg-white/80 rounded-lg p-4 text-gray-800 w-full max-w-sm">
      <h3 className="text-lg font-bold text-sky-600 flex items-center gap-2">
        <span className="text-xl">🎶</span> {data.playlistName}
      </h3>
      <p className="text-sm italic text-gray-600 mt-1 mb-3">{data.description}</p>
      
      <div className="space-y-2 text-sm">
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
            {data.songs.map((song, index) => (
              <li key={index} className="ml-2 flex justify-between items-center group">
                <div className="truncate pr-2">
                  <span className="font-semibold">{song.title}</span>
                  <span className="text-gray-500"> - {song.artist}</span>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a 
                        href={createSearchLink('spotify', song)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title={`Procurar "${song.title}" no Spotify`}
                        className="text-[#1DB954] hover:text-[#1ED760] transition-transform transform hover:scale-110"
                    >
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor"><title>Spotify</title><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.923 16.223c-.27.406-.78.538-1.186.269-3.32-2.04-7.5-2.502-12.45-1.373-.496.11-.99-.17-.11-.665.11-.495.613-.8.11-.91 5.446-1.24 10.11-0.71 13.88 1.595.405.27.537.78.268 1.185zm1.53-2.502c-.336.507-.946.683-1.453.347-3.6-2.24-9-2.88-14.32-1.576-.59.146-1.16-.21-1.308-.8-.147-.59.21-1.16.8-1.308 5.91-1.44 11.85-.71 15.95 2.24.507.337.684.947.348 1.453zm.14-2.653C14.174 8.44 8.71 8.24 5.066 9.314c-.684.19-1.35-.19-1.54-.873-.19-.683.19-1.35.874-1.54 4.05-1.17 10.11-0.946 14.57 1.54.59.336.874 1.01.536 1.604-.337.59-.1.874-1.603.536z"/></svg>
                    </a>
                    <a 
                        href={createSearchLink('youtube', song)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title={`Procurar "${song.title}" no YouTube Music`}
                        className="text-[#FF0000] hover:text-red-500 transition-transform transform hover:scale-110"
                    >
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor"><title>YouTube Music</title><path d="M12.014 24C5.384 24 0 18.616 0 11.986 0 5.356 5.384 0 12.014 0c6.63 0 11.986 5.356 11.986 11.986 0 6.63-5.356 12.014-11.986 12.014zM8.83 8.057v7.62l6.35-3.82-6.35-3.8z"/></svg>
                    </a>
                </div>
              </li>
            ))}
        </ol>
      </div>
    </div>
  );
};

export default PlaylistCard;