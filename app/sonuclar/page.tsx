'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trophy, BarChart3, Loader2, Eye, Lock, Clock, AlertCircle, Crown, Star } from 'lucide-react';

// Tipler
interface ResponseRow {
  voter_name?: string;
  wealth_rank: string[];
  difficulty_rank: string[];
  relationships_rank: string[];
  social_rank: string[];
  housing_rank: string[];
}

interface RankResult {
  name: string;
  score: number; // Düşük skor daha iyi
}

const NAMES = ['Egemit', 'LD', 'Berk', 'Cabibi', 'Tacizbal'];
const CATEGORIES = [
  { key: 'wealth', label: '🤑 Maddiyat' },
  { key: 'difficulty', label: '📚 Zorluk' },
  { key: 'relationships', label: '❤️ İlişki' },
  { key: 'social', label: '🎉 Sosyallik' },
  { key: 'housing', label: '🏠 Barınma' },
];

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<ResponseRow[]>([]);
  const [results, setResults] = useState<{ [key: string]: RankResult[] }>({});
  
  // Kilit Durumu
  const [isLocked, setIsLocked] = useState(true);
  const [missingVoters, setMissingVoters] = useState<string[]>([]);
  const [votersList, setVotersList] = useState<string[]>([]);

  const [selectedDetailCategory, setSelectedDetailCategory] = useState<string>('wealth');

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase.from('survey_responses').select('*');
      if (error) throw error;

      if (data) {
        const responses = data as ResponseRow[];
        const voters = Array.from(new Set(responses.map(r => r.voter_name).filter(Boolean))) as string[];
        const missing = NAMES.filter(name => !voters.includes(name));
        
        setVotersList(voters);
        setMissingVoters(missing);
        setRawData(responses);

        if (missing.length > 0) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
          const calculated = calculateResults(responses);
          setResults(calculated);
        }
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateResults = (data: ResponseRow[]) => {
    const finalResults: { [key: string]: RankResult[] } = {};
    const generalScores: { [name: string]: number } = {};
    NAMES.forEach((name) => (generalScores[name] = 0));

    CATEGORIES.forEach((cat) => {
      const scores: { [name: string]: number } = {};
      NAMES.forEach((name) => (scores[name] = 0));

      data.forEach((row) => {
        // @ts-ignore
        const rankList = row[`${cat.key}_rank`] as string[];
        if (Array.isArray(rankList)) {
          rankList.forEach((name, index) => {
            if (scores[name] !== undefined) {
              // Puan Hesaplama: Normalde 1. sıra = 1 Puan
              let points = index + 1;

              // ZORLUK İÇİN TERS HESAPLAMA:
              // 1. sıradaki (En zor) = En yüksek puanı almalı (Kötü etkilemeli)
              // Formül: (Kişi Sayısı + 1) - Sıralama
              // Örnek 6 kişi için: 1. sıra -> 7-1=6 puan, 6. sıra -> 7-6=1 puan
              if (cat.key === 'difficulty') {
                 points = (NAMES.length + 1) - (index + 1);
              }

              scores[name] += points;
              generalScores[name] += points;
            }
          });
        }
      });

      finalResults[cat.key] = Object.entries(scores)
        .map(([name, totalScore]) => ({
          name,
          score: data.length > 0 ? totalScore / data.length : 0,
        }))
        .sort((a, b) => a.score - b.score);
    });

    // GENEL PUAN HESAPLAMA
    finalResults['GENERAL'] = Object.entries(generalScores)
      .map(([name, totalScore]) => ({
        name,
        score: data.length > 0 ? (totalScore / (data.length * CATEGORIES.length)) : 0,
      }))
      .sort((a, b) => a.score - b.score);

    return finalResults;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  // KİLİTLİ EKRAN
  if (isLocked) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-700">
          <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Lock className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Sonuçlar Kilitli</h1>
          <p className="text-gray-400 mb-8">
            Sonuçların açılması için herkesin oy kullanması gerekiyor.
          </p>

          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 mb-6 text-left">
            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
              <span className="text-sm font-bold text-gray-400 uppercase">Durum</span>
              <span className="text-yellow-500 font-mono font-bold">{votersList.length} / {NAMES.length}</span>
            </div>
            
            {missingVoters.length > 0 && (
              <div>
                <p className="text-xs text-red-400 font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  BEKLENENLER:
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingVoters.map(name => (
                    <span key={name} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-bold animate-pulse">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {votersList.length > 0 && (
               <div className="mt-4">
                <p className="text-xs text-green-400 font-bold mb-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  TAMAMLAYANLAR:
                </p>
                <div className="flex flex-wrap gap-2">
                  {votersList.map(name => (
                    <span key={name} className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="text-gray-500 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 w-full"
          >
            <Clock className="w-4 h-4" />
            Sayfayı Yenile
          </button>
        </div>
      </main>
    );
  }

  // SONUÇLAR AÇIK
  const generalRank = results['GENERAL'] || [];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Eye className="w-4 h-4" />
            Sonuçlar Açık
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Canlı Sonuçlar</h1>
          <p className="text-gray-600">
            Tüm oylar işlendi. İşte arkadaş grubunun gerçekleri!
          </p>
        </div>

        {/* --- YENİ: GENEL LİDERLİK TABLOSU (ZİRVE) --- */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-8 flex items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            GENEL KLASMAN LİDERLERİ
            <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </h2>

          <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-1 shadow-2xl max-w-4xl mx-auto overflow-hidden">
            <div className="bg-gray-800/50 backdrop-blur p-6 sm:p-8 rounded-xl">
               {/* İlk 3 Podyum */}
               <div className="flex flex-col sm:flex-row items-end justify-center gap-4 mb-8 h-auto sm:h-64 pb-4">
                  {/* 2. Sıra */}
                  {generalRank[1] && (
                    <div className="order-2 sm:order-1 flex flex-col items-center w-full sm:w-1/3">
                      <div className="mb-2 text-gray-400 font-bold text-lg">#2</div>
                      <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-gray-500 flex items-center justify-center text-2xl font-black text-gray-700 mb-3 shadow-lg">
                        {generalRank[1].name.substring(0, 2)}
                      </div>
                      <div className="bg-gray-700 w-full h-32 rounded-t-xl flex flex-col items-center justify-start pt-4 border-t-4 border-gray-400">
                        <div className="font-bold text-white text-xl">{generalRank[1].name}</div>
                        <div className="text-gray-400 text-sm font-mono">Puan: {generalRank[1].score.toFixed(2)}</div>
                      </div>
                    </div>
                  )}

                  {/* 1. Sıra (Şampiyon) */}
                  {generalRank[0] && (
                    <div className="order-1 sm:order-2 flex flex-col items-center w-full sm:w-1/3 -mt-8 z-10">
                      <Crown className="w-12 h-12 text-yellow-400 fill-yellow-400 mb-2 animate-bounce" />
                      <div className="w-24 h-24 rounded-full bg-yellow-400 border-4 border-yellow-600 flex items-center justify-center text-3xl font-black text-yellow-900 mb-3 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                        {generalRank[0].name.substring(0, 2)}
                      </div>
                      <div className="bg-yellow-600 w-full h-40 rounded-t-xl flex flex-col items-center justify-start pt-6 border-t-4 border-yellow-400 shadow-xl">
                        <div className="font-black text-white text-2xl">{generalRank[0].name}</div>
                        <div className="text-yellow-200 font-bold font-mono">Puan: {generalRank[0].score.toFixed(2)}</div>
                        <div className="mt-2 px-3 py-1 bg-yellow-800/30 rounded-full text-xs text-yellow-100 font-bold">
                          👑 GOAT
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Sıra */}
                  {generalRank[2] && (
                    <div className="order-3 flex flex-col items-center w-full sm:w-1/3">
                      <div className="mb-2 text-yellow-700 font-bold text-lg">#3</div>
                      <div className="w-20 h-20 rounded-full bg-orange-300 border-4 border-orange-500 flex items-center justify-center text-2xl font-black text-orange-800 mb-3 shadow-lg">
                        {generalRank[2].name.substring(0, 2)}
                      </div>
                      <div className="bg-orange-800 w-full h-24 rounded-t-xl flex flex-col items-center justify-start pt-4 border-t-4 border-orange-600">
                        <div className="font-bold text-white text-xl">{generalRank[2].name}</div>
                        <div className="text-orange-200 text-sm font-mono">Puan: {generalRank[2].score.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
               </div>

               {/* Diğer Sıralamalar Listesi */}
               <div className="space-y-2 mt-4 border-t border-gray-700 pt-4">
                 {generalRank.slice(3).map((rank, idx) => (
                   <div key={rank.name} className="flex items-center bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors">
                      <span className="text-gray-400 font-bold w-8">#{idx + 4}</span>
                      <span className="text-white font-medium flex-1">{rank.name}</span>
                      <span className="text-gray-400 font-mono text-sm">{rank.score.toFixed(2)}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* 1. Bölüm: Kategori Bazlı Sıralamalar */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
          <BarChart3 className="w-6 h-6" />
          Kategori Bazlı Sıralamalar
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {CATEGORIES.map((cat) => {
             const ranks = results[cat.key] || [];
             return (
              <div key={cat.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-gray-900 text-white p-3 font-bold text-center">
                  {cat.label}
                </div>
                <div className="p-3 flex-1">
                  {ranks.map((rank, index) => (
                    <div
                      key={rank.name}
                      className={`flex items-center p-2 rounded-lg mb-1.5 text-sm ${
                        index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center font-bold mr-3 text-xs
                        ${index === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-600'}
                      `}>
                        {index + 1}
                      </div>
                      <div className="flex-1 font-medium text-gray-800 truncate">
                        {rank.name}
                      </div>
                      <div className="text-xs font-mono text-gray-500">
                        {rank.score.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
             );
          })}
        </div>

        {/* 2. Bölüm: Detaylı Analiz (Kim ne demiş?) */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
          <Eye className="w-6 h-6" />
          Kim Kime Ne Demiş?
        </h2>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Kategori Seçici Tablar */}
          <div className="flex overflow-x-auto bg-gray-50 border-b border-gray-200 p-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedDetailCategory(cat.key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors
                  ${selectedDetailCategory === cat.key 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Detay Tablosu */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 w-32">Oy Veren</th>
                  <th className="px-6 py-3 text-center w-10 bg-yellow-50">1.</th>
                  <th className="px-6 py-3 text-center w-10">2.</th>
                  <th className="px-6 py-3 text-center w-10">3.</th>
                  <th className="px-6 py-3 text-center w-10">4.</th>
                  <th className="px-6 py-3 text-center w-10">5.</th>
                  <th className="px-6 py-3 text-center w-10 text-red-500">Sonuncu</th>
                </tr>
              </thead>
              <tbody>
                {rawData.map((row, idx) => {
                  // @ts-ignore
                  const userRanks = row[`${selectedDetailCategory}_rank`] as string[];
                  if (!userRanks || userRanks.length === 0) return null;

                  return (
                    <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {row.voter_name || <span className="text-gray-400 italic">İsimsiz</span>}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-yellow-600 bg-yellow-50/50">
                        {userRanks[0]}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {userRanks[1]}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {userRanks[2]}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {userRanks[3]}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {userRanks[4]}
                      </td>
                      <td className="px-6 py-4 text-center text-red-400 font-medium">
                        {userRanks[5]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="text-center mt-12 pb-12">
            <a href="/" className="text-blue-600 hover:underline font-medium">← Ankete Dön</a>
        </div>
      </div>
    </main>
  );
}
