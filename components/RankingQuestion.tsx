'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, X, Trophy } from 'lucide-react';

interface RankingQuestionProps {
  title: string;
  description?: string;
  options: string[];
  onChange: (rankedItems: string[]) => void;
}

export default function RankingQuestion({
  title,
  description,
  options,
  onChange,
}: RankingQuestionProps) {
  const [pool, setPool] = useState<string[]>(options);
  const [ranked, setRanked] = useState<string[]>([]);

  // Sıralama değiştiğinde üst bileşene bildir
  useEffect(() => {
    onChange(ranked);
  }, [ranked, onChange]);

  const handleAddToRank = (item: string) => {
    setRanked([...ranked, item]);
    setPool(pool.filter((i) => i !== item));
  };

  const handleRemoveFromRank = (item: string) => {
    setPool([...pool, item]);
    setRanked(ranked.filter((i) => i !== item));
  };

  const isComplete = pool.length === 0;

  return (
    <div className={`p-6 bg-white rounded-xl shadow-sm border-2 transition-colors ${isComplete ? 'border-green-500/50' : 'border-gray-100'}`}>
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {title}
          {isComplete && <span className="text-green-600 text-sm font-normal">(Tamamlandı)</span>}
        </h3>
        {description && <p className="text-gray-500 text-sm">{description}</p>}
      </div>

      <div className="space-y-4">
        {/* Sıralama Alanı */}
        <div className="min-h-[120px] bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Sıralamanız (En İyiden En Kötüye)
          </p>
          
          {ranked.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              Aşağıdaki isimlere tıklayarak sıralamaya ekleyin
            </div>
          )}

          <div className="space-y-2">
            {ranked.map((item, index) => (
              <div
                key={item}
                onClick={() => handleRemoveFromRank(item)}
                className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm cursor-pointer hover:bg-red-50 border border-gray-200 group transition-all"
              >
                <span className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold
                  ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                    index === 1 ? 'bg-gray-100 text-gray-700' : 
                    index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}
                `}>
                  {index + 1}
                </span>
                <span className="font-medium text-gray-700 flex-1">{item}</span>
                <X className="w-4 h-4 text-gray-300 group-hover:text-red-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Seçenek Havuzu */}
        {pool.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Listeye Eklenecekler
            </p>
            <div className="flex flex-wrap gap-2">
              {pool.map((item) => (
                <button
                  key={item}
                  onClick={() => handleAddToRank(item)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition-all active:scale-95"
                >
                  {item}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

