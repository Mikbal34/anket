'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trophy, BarChart3, Loader2, Eye, Lock, Clock, AlertCircle } from 'lucide-react';

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

const NAMES = ['Babbolat', 'Egemit', 'LD', 'Berk', 'Cabibi', 'Tacizbal'];
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
    
    // Sonuçları düzenli kontrol et (Real-time gibi hissettirsin)
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*');

      if (error) throw error;

      if (data) {
        const responses = data as ResponseRow[];
        
        // Kimler oy vermiş kontrol et
        const voters = Array.from(new Set(responses.map(r => r.voter_name).filter(Boolean))) as string[];
        const missing = NAMES.filter(name => !voters.includes(name));
        
        setVotersList(voters);
        setMissingVoters(missing);
        setRawData(responses);

        // EĞER EKSİK VARSA KİLİTLE
        if (missing.length > 0) {
          setIsLocked(true);
        } else {
          // Herkes tamam, sonuçları hesapla
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

    CATEGORIES.forEach((cat) => {
      const scores: { [name: string]: number } = {};
      NAMES.forEach((name) => (scores[name] = 0));

      data.forEach((row) => {
        // @ts-ignore
        const rankList = row[`${cat.key}_rank`] as string[];
        if (Array.isArray(rankList)) {
          rankList.forEach((name, index) => {
            if (scores[name] !== undefined) {
              scores[name] += index + 1;
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

    return finalResults;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  // --- EKRAN 1: KİLİTLİ EKRAN (Bekleyenler Var) ---
  if (isLocked) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-700">
          <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Lock className="w-10 h-10 text-yellow-500" />
          </div>
          
          <h1 className="text-3xl font-black text-white mb-2">Sonuçlar Kilitli</h1>
          <p className="text-gray-400 mb-8">
            Sonuçların açılması için herkesin oy kullanması gerekiyor. Heyecanı bozmayın!
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
                  BEKLENENLER (OY VERMEMİŞ):
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
          
          <div className="mt-6 pt-6 border-t border-gray-700/50">
             <a href="/" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all">
               Ankete Dön / Oy Kullan
             </a>
          </div>
        </div>
      </main>
    );
  }

  // --- EKRAN 2: SONUÇLAR AÇIK (Herkes Tamam) ---
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Eye className="w-4 h-4" />
            Sonuçlar Açık - Herkes Oy Kullandı!
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Canlı Sonuçlar</h1>
          <p className="text-gray-600">
            Tüm oylar işlendi. İşte arkadaş grubunun gerçekleri!
          </p>
        </div>

        {/* 1. Bölüm: Genel Sıralama */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
          <BarChart3 className="w-6 h-6" />
          Genel Sıralamalar (Ortalamalar)
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
          Kim Kime Ne Demiş? (Dedikodu Kazanı)
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
