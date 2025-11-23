'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RankingQuestion from '@/components/RankingQuestion';
import { Send, Loader2, CheckCircle, User } from 'lucide-react';

const NAMES = ['Babbolat', 'Egemit', 'LD', 'Berk', 'Cabibi', 'Tacizbal'];

interface SurveyData {
  wealth: string[];
  difficulty: string[];
  relationships: string[];
  social: string[];
  housing: string[];
}

export default function Home() {
  // State
  const [currentVoter, setCurrentVoter] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<SurveyData>({
    wealth: [],
    difficulty: [],
    relationships: [],
    social: [],
    housing: [],
  });

  const handleRankingChange = (category: keyof SurveyData, rankedItems: string[]) => {
    setAnswers((prev) => ({ ...prev, [category]: rankedItems }));
  };

  const isFormValid = () => {
    return (
      answers.wealth.length === NAMES.length &&
      answers.difficulty.length === NAMES.length &&
      answers.relationships.length === NAMES.length &&
      answers.social.length === NAMES.length &&
      answers.housing.length === NAMES.length
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || !currentVoter) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Önce bu kişinin daha önce oy verip vermediğini kontrol edelim (İsteğe bağlı, şimdilik kapalı)
      // const { data: existingVote } = await supabase.from('survey_responses').select('id').eq('voter_name', currentVoter).single();
      // if (existingVote) throw new Error('Sen zaten oy kullanmışsın! Çakallık yapma :)');

      const { error: supabaseError } = await supabase.from('survey_responses').insert({
        voter_name: currentVoter,
        wealth_rank: answers.wealth,
        difficulty_rank: answers.difficulty,
        relationships_rank: answers.relationships,
        social_rank: answers.social,
        housing_rank: answers.housing,
      });

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
            Ankete başlamak için ismini seç. Dürüst ol, başkasının yerine girme :)
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
              Ben sadece sonuçlara bakmaya geldim
            </a>
          </div>
        </div>
      </main>
    );
  }

  // 2. BAŞARI EKRANI
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Eyvallah {currentVoter}!</h1>
          <p className="text-gray-600 mb-8">
            Oylarını kaydettik. Bakalım grup ne düşünüyor?
          </p>
          <div className="flex flex-col gap-3 w-full">
            <a
              href="/sonuclar"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full block"
            >
              Sonuçları Gör
            </a>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors w-full"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. ANKET EKRANI
  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
           <div>
             <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Arkadaş Anketi
            </h1>
            <p className="text-sm text-gray-500">
              Oy veren: <span className="font-bold text-blue-600">{currentVoter}</span>
            </p>
           </div>
           <button 
            onClick={() => setCurrentVoter(null)}
            className="text-xs text-red-500 hover:underline"
           >
             Değiştir
           </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          <RankingQuestion
            title="1. Maddiyata Göre Yaşam Kalitesi"
            description="Kimin yaşam standartları ve maddiyatı en iyi? En zenginden fakire doğru sırala."
            options={NAMES}
            onChange={(val) => handleRankingChange('wealth', val)}
          />

          <RankingQuestion
            title="2. Bölüm / Sınav Zorluk Seviyesi"
            description="Kimin bölümü veya sınavları daha zor? En zordan kolaya doğru sırala."
            options={NAMES}
            onChange={(val) => handleRankingChange('difficulty', val)}
          />

          <RankingQuestion
            title="3. Manita / İlişki Durumu"
            description="Aşk hayatında kim daha başarılı veya aktif? En hızlıdan en yavaşa :)"
            options={NAMES}
            onChange={(val) => handleRankingChange('relationships', val)}
          />

          <RankingQuestion
            title="4. Sosyallik ve Arkadaşlar"
            description="Kim daha sosyal, çevresi daha geniş? En sosyalden en asosyele."
            options={NAMES}
            onChange={(val) => handleRankingChange('social', val)}
          />

          <RankingQuestion
            title="5. Barınma Durumu"
            description="Kimin evi/yurdu/kaldığı yer daha iyi? En kral daireden en kötüye."
            options={NAMES}
            onChange={(val) => handleRankingChange('housing', val)}
          />
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-6 z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-gray-100/80 to-transparent -z-10 h-24 -top-24 pointer-events-none" />
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className={`
              w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform
              ${isFormValid() && !isSubmitting
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
                {isFormValid() ? 'Anketi Tamamla ve Gönder' : 'Lütfen Tüm Sıralamaları Tamamlayın'}
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
