import React from 'react';

interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  steps: string[];
}

interface RecipeCardProps {
  data: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ data }) => {
  return (
    <div className="bg-white/80 rounded-lg p-4 text-gray-800 w-full max-w-sm">
      <h3 className="text-lg font-bold text-orange-600 flex items-center gap-2">
        <span className="text-xl">🍳</span> {data.recipeName}
      </h3>
      <p className="text-sm italic text-gray-600 mt-1 mb-3">{data.description}</p>
      
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-semibold mb-1 flex items-center gap-1.5 text-orange-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4"/><path d="M9 15v- attuale.5A2.5 2.5 0 0 1 11.5 10h1A2.5 2.5 0 0 1 15 12.5V15"/><path d="M6 21v-2a2 2 0 0 0-2-2H3v4h3Z"/><path d="M18 21v-2a2 2 0 0 1 2-2h1v4h-3Z"/><path d="M12 10V7a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v3"/><path d="M14 5a2 2 0 1 0-4 0"/></svg>
            Ingredientes:
          </h4>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-gray-700">
            {data.ingredients.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-1 flex items-center gap-1.5 text-orange-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
            Preparação:
          </h4>
          <ol className="list-decimal list-inside space-y-1 pl-2 text-gray-700">
            {data.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
