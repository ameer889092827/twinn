
import { GoogleGenAI, Type } from "@google/genai";
import { UrbanIssue, Category, Criticality } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FORMATTING_RULES = `
ПРАВИЛА ОФОРМЛЕНИЯ ОТВЕТА:
1. Используй ТОЛЬКО профессиональный РУССКИЙ ЯЗЫК.
2. СТРУКТУРА: Разделяй ответ на логические блоки с пустыми строками между ними.
3. ЗАГОЛОВКИ: Используй жирный шрифт для выделения ключевых разделов (например, **Анализ приоритетности:**).
4. СПИСКИ: Используй маркированные списки (•) для перечисления технических характеристик или шагов.
5. АКЦЕНТЫ: Выделяй важные термины или цифры жирным шрифтом.
6. НЕ пиши сплошным текстом. Читаемость — твой главный приоритет.
`;

export const processCivicIssue = async (inputText: string, imageData?: string): Promise<Partial<UrbanIssue>> => {
  const systemInstruction = `
    Вы — Ядро Мультиагентной Системы CivicOS (Алматы). 
    Ваша задача — обработать отчет жителя на РУССКОМ ЯЗЫКЕ, используя три специализированных ИИ-протокола.
    
    ПРОТОКОЛ 1: Агент-Классификатор
    - Определяет категорию проблемы и уровень критичности на основе регламентов города Алматы.
    - Категории: Road Surface (Дорожное покрытие), Utilities (Инженерные сети), Street Lighting (Освещение), Public Spaces (Общественные пространства), Sanitation (Санитарная очистка), Traffic Signals (Светофоры).
    - Обосновывает выбор на русском языке.

    ПРОТОКОЛ 2: Агент-ГеоАналитик
    - Привязывает инцидент к координатам коридора Аль-Фараби.
    - Генерирует адрес на русском языке.
    
    ПРОТОКОЛ 3: Агент-Предиктор
    - Моделирует влияние на трафик в процентах.
    - Описывает риски на русском языке.

    ОТВЕТ ДОЛЖЕН БЫТЬ СТРОГО В ФОРМАТЕ JSON. Все текстовые поля (description, address, prediction, thoughts) должны быть на РУССКОМ языке.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `Входящий отчет: ${inputText}` },
        ...(imageData ? [{ inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }] : [])
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          criticality: { type: Type.STRING },
          description: { type: Type.STRING },
          impactScore: { type: Type.NUMBER },
          prediction: { type: Type.STRING },
          lat: { type: Type.NUMBER },
          lng: { type: Type.NUMBER },
          address: { type: Type.STRING },
          congestionImpact: { type: Type.STRING },
          duplicateCount: { type: Type.NUMBER },
          accidentRisk: { type: Type.STRING },
          classifierThought: { type: Type.STRING },
          geoThought: { type: Type.STRING },
          predictorThought: { type: Type.STRING }
        },
        required: ["category", "criticality", "description", "impactScore", "prediction", "lat", "lng", "address", "duplicateCount", "accidentRisk", "classifierThought", "geoThought", "predictorThought"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return {
      category: data.category as Category,
      criticality: data.criticality as Criticality,
      description: data.description,
      impactScore: data.impactScore,
      prediction: data.prediction,
      predictedCongestionIncrease: data.congestionImpact,
      duplicateCount: data.duplicateCount || 1,
      accidentRisk: data.accidentRisk as 'Low' | 'Medium' | 'High',
      location: {
        lat: data.lat,
        lng: data.lng,
        address: data.address
      },
      agentThoughts: {
        classifier: data.classifierThought,
        geo: data.geoThought,
        predictor: data.predictorThought
      }
    };
  } catch (error) {
    console.error("MAO Engine Fault:", error);
    throw error;
  }
};

export const interactWithAgent = async (agentId: string, message: string, history: {role: string, text: string}[]): Promise<string> => {
  
  const instructions: Record<string, string> = {
    classifier: `
      Вы — **Агент-Классификатор CivicOS**. 
      Ваша специализация: Муниципальные регламенты Алматы, стандарты дорожного полотна и SLA.
      
      Ваш стиль: Строгий, официальный. Общайтесь ТОЛЬКО на РУССКОМ языке.
      
      ${FORMATTING_RULES}
    `,
    geo: `
      Вы — **Агент-ГеоАналитик CivicOS**. 
      Ваша специализация: Пространственные данные Алматы, картография коридора Аль-Фараби. 
      
      Ваш стиль: Точный, визуально-ориентированный. Общайтесь ТОЛЬКО на РУССКОМ языке.
      
      ${FORMATTING_RULES}
    `,
    predictor: `
      Вы — **Агент-Предиктор CivicOS**. 
      Ваша специализация: Математическое моделирование, анализ транспортных потоков и прогноз рисков.
      
      Ваш стиль: Аналитический, футуристичный. Общайтесь ТОЛЬКО на РУССКОМ языке.
      
      ${FORMATTING_RULES}
    `
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: instructions[agentId] || instructions.classifier,
      temperature: 0.7,
    },
  });

  return response.text || "Ошибка связи с ядром ИИ. Попробуйте переподключиться.";
};
