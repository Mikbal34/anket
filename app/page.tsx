'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RankingQuestion from '@/components/RankingQuestion';
import { Send, Loader2, CheckCircle, User, Skull, BarChart3, ChevronLeft } from 'lucide-react';

const NAMES = ['Babbolat', 'Egemit', 'LD', 'Berk', 'Cabibi', 'Tacizbal'];

interface SurveyData {
  // Bölüm 1
  wealth: string[];
  difficulty: string[];
  relationships: string[];
  social: string[];
  housing: string[];
  // Bölüm 2
  gaddar: string[];
  frequency: string[];
  quality: string[];
}

export default function Home() {
  const [currentVoter, setCurrentVoter] = useState<string | null>(null);
  const [selectedSurveyType, setSelectedSurveyType] = useState<'GENERAL' | 'OC' | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<SurveyData>({
    wealth: [],
    difficulty: [],
    relationships: [],
    social: [],
    housing: [],
    gaddar: [],
    frequency: [],
    quality: [],
  });

  const handleRankingChange = (category: keyof SurveyData, rankedItems: string[]) => {
    setAnswers((prev) => ({ ...prev, [category]: rankedItems }));
  };

  const isGeneralValid = () => {
    return (
      answers.wealth.length === NAMES.length &&
      answers.difficulty.length === NAMES.length &&
      answers.relationships.length === NAMES.length &&
      answers.social.length === NAMES.length &&
      answers.housing.length === NAMES.length
    );
  };

  const isOCValid = () => {
    return (
      answers.gaddar.length === NAMES.length &&
      answers.frequency.length === NAMES.length &&
      answers.quality.length === NAMES.length
    );
  };

  const handleSubmit = async () => {
    if (!currentVoter || !selectedSurveyType) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        voter_name: currentVoter,
      };

      // Sadece seçili anketin verilerini ekle
      if (selectedSurveyType === 'GENERAL') {
        if (!isGeneralValid()) return;
        payload.wealth_rank = answers.wealth;
        payload.difficulty_rank = answers.difficulty;
        payload.relationships_rank = answers.relationships;
        payload.social_rank = answers.social;
        payload.housing_rank = answers.housing;
      } else if (selectedSurveyType === 'OC') {
        if (!isOCValid()) return;
        payload.gaddar_rank = answers.gaddar;
        payload.frequency_rank = answers.frequency;
        payload.quality_rank = answers.quality;
      }

      const { error: supabaseError } = await supabase.from('survey_responses').insert(payload);

      if (supabaseError) throw supabaseError;

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error submitting survey:', err);
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. GİRİŞ EKRANI (İsim Seçme)
  if (!currentVoter) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Sen Kimsin?</h1>
          <p className="text-gray-500 mb-8">
            Ankete başlamak için ismini seç.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {NAMES.map((name) => (
              <button
                key={name}
                onClick={() => setCurrentVoter(name)}
                className="bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 text-gray-700 hover:text-blue-700 font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95"
              >
                {name}
              </button>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <a href="/sonuclar" className="text-sm text-gray-400 hover:text-gray-600 underline">
              Sonuçlara Git
            </a>
          </div>
        </div>
      </main>
    );
  }

  // 2. ANKET SEÇİM EKRANI
  if (!selectedSurveyType && !isSuccess) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-8">
             <h2 className="text-2xl font-black text-gray-900">Hoşgeldin {currentVoter}</h2>
             <p className="text-gray-500">Hangi anketi doldurmak istersin?</p>
          </div>

          <button
            onClick={() => setSelectedSurveyType('GENERAL')}
            className="w-full bg-white hover:bg-blue-50 border-2 border-blue-100 hover:border-blue-500 p-6 rounded-2xl transition-all shadow-sm hover:shadow-md group text-left relative overflow-hidden"
          >
            <div className="flex items-center gap-4 z-10 relative">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700">Genel Anket</h3>
                <p className="text-sm text-gray-500">Maddiyat, İlişki, Zorluk...</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedSurveyType('OC')}
            className="w-full bg-white hover:bg-red-50 border-2 border-red-100 hover:border-red-500 p-6 rounded-2xl transition-all shadow-sm hover:shadow-md group text-left relative overflow-hidden"
          >
            <div className="flex items-center gap-4 z-10 relative">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <Skull className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-700">O.Ç. Testi</h3>
                <p className="text-sm text-gray-500">Gaddarlık, Sıklık, Kalite...</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setCurrentVoter(null)}
            className="w-full text-center text-gray-400 text-sm hover:text-gray-600"
          >
            ← İsim Değiştir
          </button>
        </div>
      </main>
    );
  }

  // 3. BAŞARI EKRANI
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Kaydedildi!</h1>
          <p className="text-gray-600 mb-8">
            Bu anketi başarıyla tamamladın. Şimdi ne yapmak istersin?
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => {
                setIsSuccess(false);
                setSelectedSurveyType(null); // Seçim ekranına dön
                // Formu sıfırla
                setAnswers({
                  wealth: [], difficulty: [], relationships: [], social: [], housing: [],
                  gaddar: [], frequency: [], quality: []
                });
              }}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors w-full"
            >
              Diğer Anketi Doldur
            </button>
            <a
              href="/sonuclar"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full block"
            >
              Sonuçları Gör
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. ANKET FORMU
  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedSurveyType(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Geri Dön
          </button>
          <span className="font-bold text-gray-900 bg-white px-4 py-2 rounded-full shadow-sm">
            {currentVoter}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* GENERAL ANKET FORMU */}
        {selectedSurveyType === 'GENERAL' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                 <BarChart3 className="w-6 h-6 text-blue-600" />
               </div>
               <h1 className="text-2xl font-black text-gray-900">Genel Anket</h1>
            </div>

            <RankingQuestion
              title="1. Maddiyata Göre Yaşam Kalitesi"
              description="Kimin yaşam standartları ve maddiyatı en iyi?"
              options={NAMES}
              onChange={(val) => handleRankingChange('wealth', val)}
            />
            <RankingQuestion
              title="2. Bölüm / Sınav Zorluk Seviyesi"
              description="Kimin bölümü veya sınavları daha zor?"
              options={NAMES}
              onChange={(val) => handleRankingChange('difficulty', val)}
            />
            <RankingQuestion
              title="3. Manita / İlişki Durumu"
              description="Aşk hayatında kim daha başarılı?"
              options={NAMES}
              onChange={(val) => handleRankingChange('relationships', val)}
            />
            <RankingQuestion
              title="4. Sosyallik ve Arkadaşlar"
              description="Kim daha sosyal, çevresi daha geniş?"
              options={NAMES}
              onChange={(val) => handleRankingChange('social', val)}
            />
            <RankingQuestion
              title="5. Barınma Durumu"
              description="Kimin kaldığı yer daha iyi?"
              options={NAMES}
              onChange={(val) => handleRankingChange('housing', val)}
            />
          </div>
        )}

        {/* OC ANKET FORMU */}
        {selectedSurveyType === 'OC' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                 <Skull className="w-6 h-6 text-red-600" />
               </div>
               <h1 className="text-2xl font-black text-red-700">O.Ç. Testi</h1>
            </div>
            
            <RankingQuestion
              title="1. En Gaddar Kim?"
              description="Kim en acımasız, en vicdansız?"
              options={NAMES}
              onChange={(val) => handleRankingChange('gaddar', val)}
            />
            <RankingQuestion
              title="2. Sıklık: Kim En Çok O.Ç'lik Yapıyor?"
              description="7/24 yapan en üste."
              options={NAMES}
              onChange={(val) => handleRankingChange('frequency', val)}
            />
            <RankingQuestion
              title="3. Kalite: Kim En Kaliteli O.Ç'lik Yapıyor?"
              description="Az yapar ama öz yapar."
              options={NAMES}
              onChange={(val) => handleRankingChange('quality', val)}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="sticky bottom-6 z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-gray-100/80 to-transparent -z-10 h-24 -top-24 pointer-events-none" />
          <button
            onClick={handleSubmit}
            disabled={(selectedSurveyType === 'GENERAL' && !isGeneralValid()) || (selectedSurveyType === 'OC' && !isOCValid()) || isSubmitting}
            className={`
              w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform
              ${((selectedSurveyType === 'GENERAL' && isGeneralValid()) || (selectedSurveyType === 'OC' && isOCValid())) && !isSubmitting
                ? 'bg-gray-900 text-white hover:bg-black hover:scale-[1.02]' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                {selectedSurveyType === 'GENERAL' ? isGeneralValid() ? 'Genel Anketi Gönder' : 'Lütfen Tüm Sıralamaları Tamamla' : ''}
                {selectedSurveyType === 'OC' ? isOCValid() ? 'O.Ç. Testini Gönder' : 'Lütfen Tüm Sıralamaları Tamamla' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
