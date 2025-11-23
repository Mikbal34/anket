'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trophy, BarChart3, Loader2, Eye, Lock, Clock, AlertCircle, Crown, Skull } from 'lucide-react';

// Tipler
interface ResponseRow {
  voter_name?: string;
  // Bölüm 1 (Optional)
  wealth_rank: string[] | null;
  difficulty_rank: string[] | null;
  relationships_rank: string[] | null;
  social_rank: string[] | null;
  housing_rank: string[] | null;
  // Bölüm 2 (Optional)
  gaddar_rank: string[] | null;
  frequency_rank: string[] | null;
  quality_rank: string[] | null;
}

interface RankResult {
  name: string;
  score: number;
}

const NAMES = ['Babbolat', 'Egemit', 'LD', 'Berk', 'Cabibi', 'Tacizbal'];

// Kategoriler
const GENERAL_CATEGORIES = [
  { key: 'wealth', label: '🤑 Maddiyat' },
  { key: 'difficulty', label: '📚 Zorluk' },
  { key: 'relationships', label: '❤️ İlişki' },
  { key: 'social', label: '🎉 Sosyallik' },
  { key: 'housing', label: '🏠 Barınma' },
];

const OC_CATEGORIES = [
  { key: 'gaddar', label: '💀 En Gaddar' },
  { key: 'frequency', label: '⏱️ Sıklık' },
  { key: 'quality', label: '💎 Kalite' },
];

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<ResponseRow[]>([]);
  const [results, setResults] = useState<{ [key: string]: RankResult[] }>({});
  
  const [isLocked, setIsLocked] = useState(true);
  
  // Eksik Listeleri
  const [missingGeneral, setMissingGeneral] = useState<string[]>([]);
  const [missingOC, setMissingOC] = useState<string[]>([]);

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
        setRawData(responses);

        // KİMLER HANGİ ANKETİ DOLDURMAMIŞ?
        // Bir kişinin birden fazla satırı olabilir (farklı zamanlarda farklı anketleri doldurmuş olabilir)
        // Bu yüzden önce her kişi için tüm kayıtları birleştirelim veya kontrol edelim.
        
        const votersGeneral = new Set<string>();
        const votersOC = new Set<string>();

        responses.forEach(r => {
          if (r.voter_name && r.wealth_rank) votersGeneral.add(r.voter_name);
          if (r.voter_name && r.gaddar_rank) votersOC.add(r.voter_name);
        });

        const missingG = NAMES.filter(name => !votersGeneral.has(name));
        const missingO = NAMES.filter(name => !votersOC.has(name));
        
        setMissingGeneral(missingG);
        setMissingOC(missingO);

        // Eğer HERHANGİ BİRİ eksikse kilitli kalır
        if (missingG.length > 0 || missingO.length > 0) {
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
    
    // Puan Tutucular
    const generalScores: { [name: string]: number } = {};
    const generalCounts: { [name: string]: number } = {}; // Kaç kişi oy vermiş (ortalama için)

    const ocScores: { [name: string]: number } = {};
    const ocCounts: { [name: string]: number } = {};
    
    NAMES.forEach((name) => {
      generalScores[name] = 0;
      generalCounts[name] = 0; // unused but kept for structure
      ocScores[name] = 0;
      ocCounts[name] = 0;
    });

    // 1. GENEL KATEGORİLERİ HESAPLA
    GENERAL_CATEGORIES.forEach((cat) => {
      const scores: { [name: string]: number } = {};
      let voteCount = 0;
      NAMES.forEach((name) => (scores[name] = 0));

      data.forEach((row) => {
        // @ts-ignore
        const rankList = row[`${cat.key}_rank`] as string[];
        if (Array.isArray(rankList) && rankList.length > 0) {
          voteCount++;
          rankList.forEach((name, index) => {
            if (scores[name] !== undefined) {
              let points = index + 1;
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
          score: voteCount > 0 ? totalScore / voteCount : 0,
        }))
        .sort((a, b) => a.score - b.score);
    });

    // 2. O.Ç. KATEGORİLERİNİ HESAPLA
    OC_CATEGORIES.forEach((cat) => {
      const scores: { [name: string]: number } = {};
      let voteCount = 0;
      NAMES.forEach((name) => (scores[name] = 0));

      data.forEach((row) => {
        // @ts-ignore
        const rankList = row[`${cat.key}_rank`] as string[];
        if (Array.isArray(rankList) && rankList.length > 0) {
          voteCount++;
          rankList.forEach((name, index) => {
            if (scores[name] !== undefined) {
              scores[name] += index + 1;
              ocScores[name] += index + 1;
            }
          });
        }
      });

      finalResults[cat.key] = Object.entries(scores)
        .map(([name, totalScore]) => ({
          name,
          score: voteCount > 0 ? totalScore / voteCount : 0,
        }))
        .sort((a, b) => a.score - b.score);
    });

    // GENEL PUAN HESAPLAMALARI (TOPLAM OY SAYISINA GÖRE ORTALAMA)
    // Not: Burada basitlik için "herkes oy verdi" varsayımıyla (voteCount=NAMES.length) bölüyoruz.
    // Kilit sistemi sayesinde zaten herkes oy vermeden burası çalışmaz.

    // 3. GENEL SIRALAMA (SADECE İLK 5 SORU)
    finalResults['GENERAL'] = Object.entries(generalScores)
      .map(([name, totalScore]) => ({
        name,
        score: totalScore / (NAMES.length * GENERAL_CATEGORIES.length),
      }))
      .sort((a, b) => a.score - b.score);

    // 4. O.Ç. ŞAMPİYONU (SADECE SON 3 SORU)
    finalResults['OC_CHAMPION'] = Object.entries(ocScores)
      .map(([name, totalScore]) => ({
        name,
        score: totalScore / (NAMES.length * OC_CATEGORIES.length),
      }))
      .sort((a, b) => a.score - b.score);

    return finalResults;
  };

  // Render Helper: Podyum Bileşeni
  const Podium = ({ title, data, colorClass, icon }: any) => (
    <div className={`bg-gradient-to-b ${colorClass} rounded-2xl p-1 shadow-2xl max-w-4xl mx-auto overflow-hidden mb-12`}>
      <div className="bg-gray-900/90 backdrop-blur p-6 sm:p-8 rounded-xl">
          <h3 className="text-2xl font-black text-center text-white mb-8 flex items-center justify-center gap-3">
            {icon} {title} {icon}
          </h3>
          
          <div className="flex flex-col sm:flex-row items-end justify-center gap-4 mb-8 h-auto sm:h-64 pb-4">
            {/* 2. Sıra */}
            {data[1] && (
              <div className="order-2 sm:order-1 flex flex-col items-center w-full sm:w-1/3">
                <div className="mb-2 text-gray-400 font-bold text-lg">#2</div>
                <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-gray-500 flex items-center justify-center text-2xl font-black text-gray-700 mb-3 shadow-lg">
                  {data[1].name.substring(0, 2)}
                </div>
                <div className="bg-gray-700 w-full h-32 rounded-t-xl flex flex-col items-center justify-start pt-4 border-t-4 border-gray-400">
                  <div className="font-bold text-white text-xl">{data[1].name}</div>
                  <div className="text-gray-400 text-sm font-mono">{data[1].score.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* 1. Sıra */}
            {data[0] && (
              <div className="order-1 sm:order-2 flex flex-col items-center w-full sm:w-1/3 -mt-8 z-10">
                <Crown className="w-12 h-12 text-yellow-400 fill-yellow-400 mb-2 animate-bounce" />
                <div className="w-24 h-24 rounded-full bg-yellow-400 border-4 border-yellow-600 flex items-center justify-center text-3xl font-black text-yellow-900 mb-3 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                  {data[0].name.substring(0, 2)}
                </div>
                <div className="bg-yellow-600 w-full h-40 rounded-t-xl flex flex-col items-center justify-start pt-6 border-t-4 border-yellow-400 shadow-xl">
                  <div className="font-black text-white text-2xl">{data[0].name}</div>
                  <div className="text-yellow-200 font-bold font-mono">{data[0].score.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* 3. Sıra */}
            {data[2] && (
              <div className="order-3 flex flex-col items-center w-full sm:w-1/3">
                <div className="mb-2 text-yellow-700 font-bold text-lg">#3</div>
                <div className="w-20 h-20 rounded-full bg-orange-300 border-4 border-orange-500 flex items-center justify-center text-2xl font-black text-orange-800 mb-3 shadow-lg">
                  {data[2].name.substring(0, 2)}
                </div>
                <div className="bg-orange-800 w-full h-24 rounded-t-xl flex flex-col items-center justify-start pt-4 border-t-4 border-orange-600">
                  <div className="font-bold text-white text-xl">{data[2].name}</div>
                  <div className="text-orange-200 text-sm font-mono">{data[2].score.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-gray-400" /></div>;

  // KİLİT EKRANI
  if (isLocked) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-700">
          <Lock className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-black text-white mb-4">Oylama Sürüyor</h1>
          <p className="text-gray-400 mb-6">Sonuçları görmek için herkesin her iki anketi de tamamlaması lazım.</p>
          
          {missingGeneral.length > 0 && (
            <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-xl text-left mb-4">
               <div className="text-blue-300 text-xs font-bold mb-2 flex items-center gap-2">
                 <BarChart3 className="w-3 h-3" /> GENEL ANKET EKSİKLERİ:
               </div>
               <div className="flex flex-wrap gap-2">
                 {missingGeneral.map(name => (
                   <span key={name} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm font-bold">{name}</span>
                 ))}
               </div>
            </div>
          )}

          {missingOC.length > 0 && (
            <div className="bg-red-900/30 border border-red-800 p-4 rounded-xl text-left mb-6">
               <div className="text-red-400 text-xs font-bold mb-2 flex items-center gap-2">
                 <Skull className="w-3 h-3" /> O.Ç. TESTİ EKSİKLERİ:
               </div>
               <div className="flex flex-wrap gap-2">
                 {missingOC.map(name => (
                   <span key={name} className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm font-bold">{name}</span>
                 ))}
               </div>
            </div>
          )}

          <button onClick={() => window.location.reload()} className="text-gray-500 hover:text-white transition-colors text-sm flex items-center justify-center gap-2 w-full">
            <Clock className="w-4 h-4" /> Durumu Yenile
          </button>
        </div>
      </main>
    );
  }

  const generalRank = results['GENERAL'] || [];
  const ocRank = results['OC_CHAMPION'] || [];
  const ALL_CATEGORIES = [...GENERAL_CATEGORIES, ...OC_CATEGORIES];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-900 mb-4">BÜYÜK FİNAL</h1>
          <p className="text-xl text-gray-600">Tüm oylar kullanıldı. Maskeler düşüyor.</p>
        </div>

        {/* GENEL KLASMAN LİDERİ */}
        <Podium 
          title="GENEL KLASMAN LİDERLERİ" 
          data={generalRank} 
          colorClass="from-blue-900 to-gray-900" 
          icon={<Trophy className="w-8 h-8 text-yellow-400" />} 
        />

        {/* O.Ç. ŞAMPİYONU */}
        <Podium 
          title="O.Ç. ŞAMPİYONLAR LİGİ" 
          data={ocRank} 
          colorClass="from-red-900 to-gray-900" 
          icon={<Skull className="w-8 h-8 text-red-500" />} 
        />

        {/* TÜM DETAYLAR */}
        <h2 className="text-3xl font-black text-center mb-8">DETAYLI ANALİZ</h2>
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden mb-12">
          <div className="flex overflow-x-auto bg-gray-50 border-b p-2 gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedDetailCategory(cat.key)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                  selectedDetailCategory === cat.key ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3">Oy Veren</th>
                  <th className="px-6 py-3 text-center">1.</th>
                  <th className="px-6 py-3 text-center">2.</th>
                  <th className="px-6 py-3 text-center">3.</th>
                  <th className="px-6 py-3 text-center">4.</th>
                  <th className="px-6 py-3 text-center">5.</th>
                  <th className="px-6 py-3 text-center">6.</th>
                </tr>
              </thead>
              <tbody>
                {rawData.map((row, idx) => {
                  // @ts-ignore
                  const userRanks = row[`${selectedDetailCategory}_rank`] as string[];
                  // Eğer o kategoride veri yoksa (anket doldurulmadıysa) satırı gösterme veya tire koy
                  if (!userRanks) return null;

                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold">{row.voter_name}</td>
                      {userRanks.map((r, i) => (
                        <td key={i} className={`px-6 py-4 text-center ${i===0 ? 'font-black text-black' : 'text-gray-600'}`}>
                          {r}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center pb-12">
            <a href="/" className="text-blue-600 hover:underline font-bold text-lg">← Ankete Dön</a>
        </div>
      </div>
    </main>
  );
}
