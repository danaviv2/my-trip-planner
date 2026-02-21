import type { API_KEYS } from './apiManager';
import { API_KEYS as KEYS } from './apiManager';
import type { SmartAdvice, UserPreferences, AIRecommendation } from '../types/index';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * OpenAI based AI recommendations service
 * Provides smart recommendations for trips, attractions, restaurants and more
 */
class AIRecommendationsService {
  private apiKey: string;
  private apiUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = KEYS.openai || '';
  }

  /**
   * Generic OpenAI API call
   */
  private async callOpenAI(
    messages: OpenAIMessage[],
    temperature: number = 0.7
  ): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          temperature: temperature,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error in OpenAI call:', error);
      throw error;
    }
  }

  /**
   * Personalized itinerary recommendations
   */
  async getPersonalizedItinerary(
    origin: string,
    destination: string,
    days: number,
    preferences: Partial<UserPreferences> = {}
  ): Promise<any> {
    const {
      budget = 'medium',
      interests = [],
      travelStyle = 'balanced',
      groupType = 'solo'
    } = preferences;

    const prompt = `אתה מומחה תכנון טיולים. צור תכנית טיול מפורטת ומותאמת אישית.

פרטי הטיול:
- מוצא: ${origin}
- יעד: ${destination}
- משך: ${days} ימים
- תקציב: ${budget === 'low' ? 'נמוך' : budget === 'medium' ? 'בינוני' : 'גבוה'}
- תחומי עניין: ${interests.join(', ') || 'כללי'}
- סגנון טיול: ${
        travelStyle === 'adventure' ? 'הרפתקה' :
        travelStyle === 'cultural' ? 'תרבות' :
        travelStyle === 'relaxation' ? 'הנחה' :
        travelStyle === 'luxury' ? 'שפע' : 'מאוזן'
      }
- סוג קבוצה: ${groupType === 'solo' ? 'יחיד' : groupType === 'couple' ? 'זוג' : groupType === 'family' ? 'משפחה' : 'חברים'}

צור תכנית מפורטת שתכלול:
1. סקירה כללית של הטיול
2. תכנית יומית (לכל יום):
   - בוקר: פעילויות מומלצות
   - צהריים: מסעדות/מקומות לאכול
   - אחר הצהריים: אטרקציות
   - ערב: פעילויות/מסעדות
3. טיפים חשובים
4. הערכת עלויות

פורמט התשובה ב-JSON:
{
  "overview": "סקירה כללית",
  "dailyPlan": [
    {
      "day": 1,
      "morning": "פעילות בוקר",
      "lunch": "המלצת צהריים",
      "afternoon": "פעילות אחר הצהריים",
      "dinner": "המלצת ערב",
      "highlights": ["נקודה מעניינת 1", "נקודה מעניינת 2"]
    }
  ],
  "tips": ["טיפ 1", "טיפ 2"],
  "estimatedCost": "הערכת עלות כוללת"
}`;

    const messages = [
      {
        role: 'system' as const,
        content: 'אתה מומחה תכנון טיולים מנוסה המתמחה ביצירת תכניות טיול מותאמות אישית. תמיד תגיב בעברית ובפורמט JSON תקין.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    try {
      const response = await this.callOpenAI(messages, 0.8);
      
      // ניסיון לפרסר JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // אם לא מצאנו JSON, נחזיר את התשובה כטקסט
      return {
        overview: response,
        dailyPlan: [],
        tips: [],
        estimatedCost: 'לא זמין'
      };
    } catch (error) {
      console.error('❌ שגיאה בקבלת המלצות מסלול:', error);
      throw error;
    }
  }

  /**
   * Attraction recommendations
   */
  async getAttractionRecommendations(
    location: string,
    userPreferences: Partial<UserPreferences> = {}
  ): Promise<any> {
    const prompt = `אתה מדריך טיולים מומחה. המלץ על 5 האטרקציות המובילות ב${location}.

תחומי עניין: ${userPreferences.interests?.join(', ') || 'כללי'}
תקציב: ${userPreferences.budget || 'בינוני'}

עבור כל אטרקציה ספק:
1. שם האטרקציה
2. תיאור קצר (2-3 משפטים)
3. למה זה מומלץ
4. משך זמן מומלץ לביקור
5. טווח מחירים

פורמט JSON:
{
  "attractions": [
    {
      "name": "שם",
      "description": "תיאור",
      "whyVisit": "למה כדאי",
      "duration": "זמן מומלץ",
      "priceRange": "טווח מחיר"
    }
  ]
}`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system' as const,
        content: 'אתה מדריך טיולים מומחה. תגיב תמיד בעברית ובפורמט JSON.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    try {
      const response = await this.callOpenAI(messages);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { attractions: [] };
    } catch (error) {
      console.error('❌ שגיאה בקבלת המלצות אטרקציות:', error);
      throw error;
    }
  }

  /**
   * Restaurant recommendations
   */
  async getRestaurantRecommendations(
    location: string,
    cuisine: string = 'any',
    budget: string = 'medium'
  ): Promise<any> {
    const prompt = `המלץ על 5 מסעדות מובילות ב${location}.

סוג מטבח: ${cuisine === 'any' ? 'כל סוג' : cuisine}
תקציב: ${budget === 'low' ? 'זול' : budget === 'medium' ? 'בינוני' : 'יוקרתי'}

עבור כל מסעדה:
1. שם המסעדה
2. סוג המטבח
3. מה מיוחד בה
4. מנה מומלצת
5. טווח מחירים

JSON:
{
  "restaurants": [
    {
      "name": "שם",
      "cuisine": "סוג מטבח",
      "specialty": "מה מיוחד",
      "recommended": "מנה מומלצת",
      "priceRange": "₪₪"
    }
  ]
}`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system' as const,
        content: 'אתה מערכת הערכה חכמה של תכניות טיול. תגיב בעברית ובפורמט JSON.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    try {
      const response = await this.callOpenAI(messages);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { restaurants: [] };
    } catch (error) {
      console.error('❌ שגיאה בקבלת המלצות מסעדות:', error);
      throw error;
    }
  }

  /**
   * Smart advice for trip
   */
  async getSmartAdvice(tripPlan: any): Promise<SmartAdvice> {
    const prompt = `אתה יועץ טיולים מומחה. נתח את תכנית הטיול הבאה וספק המלצות לשיפור:

תכנית נוכחית:
- מסלול: ${tripPlan.route?.name || 'לא נבחר'}
- אטרקציות: ${tripPlan.attractions?.length || 0}
- מסעדות: ${tripPlan.restaurants?.length || 0}
- מלונות: ${tripPlan.hotels?.length || 0}

ספק:
1. הערכה כללית של התכנית
2. 3 המלצות לשיפור
3. אזהרות או דברים לשים לב אליהם
4. טיפים חשובים

JSON:
{
  "evaluation": "הערכה כללית",
  "improvements": ["שיפור 1", "שיפור 2", "שיפור 3"],
  "warnings": ["אזהרה 1", "אזהרה 2"],
  "tips": ["טיפ 1", "טיפ 2", "טיפ 3"]
}`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system' as const,
        content: 'אתה יועץ טיולים מומחה. תגיב בעברית ובפורמט JSON.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    try {
      const response = await this.callOpenAI(messages);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {
        evaluation: response,
        improvements: [],
        warnings: [],
        tips: []
      };
    } catch (error) {
      console.error('❌ שגיאה בקבלת ייעוץ חכם:', error);
      throw error;
    }
  }

  /**
   * Generate place description
   */
  async generatePlaceDescription(
    placeName: string,
    placeType: string
  ): Promise<string> {
    const prompt = `כתוב תיאור קצר ומרתק (2-3 משפטים) על ${placeName} - ${placeType}.
התיאור צריך להיות מעניין, אינפורמטיבי ולגרום לאנשים לרצות לבקר במקום.`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system' as const,
        content: 'אתה כותב טיפוס טיולים. תגיב בעברית.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    try {
      return await this.callOpenAI(messages, 0.9);
    } catch (error) {
      console.error('❌ שגיאה ביצירת תיאור:', error);
      return '';
    }
  }
}

export default new AIRecommendationsService();
