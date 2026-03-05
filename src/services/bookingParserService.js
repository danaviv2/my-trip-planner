const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || window.env?.REACT_APP_GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * מפענח מייל הזמנה ומחלץ פרטים מובנים
 * @returns {object|null} booking object or null if not a booking
 */
export const parseBookingEmail = async ({ subject, from, date, body }) => {
  if (!GEMINI_API_KEY) throw new Error('NO_API_KEY');

  const prompt = `You are a travel booking email parser. Extract booking details from this email.
Return ONLY a valid JSON object (no markdown, no explanation). If this is NOT a travel booking confirmation, return the exact string: null

Email From: ${from}
Email Date: ${date}
Subject: ${subject}
Content: ${body.slice(0, 3500)}

Return this exact JSON structure if it IS a booking:
{
  "type": "hotel" | "flight" | "car_rental" | "activity",
  "status": "confirmed" | "pending" | "cancelled",
  "confirmationNumber": "booking/confirmation reference number",
  "name": "Hotel name / Airline + flight number / Car company",
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "destination": "city or destination name",
  "address": "full address (for hotels)",
  "from": "departure city (for flights)",
  "to": "arrival city (for flights)",
  "flightNumber": "flight number if applicable",
  "price": "total price with currency symbol",
  "nights": 3,
  "passengers": 2,
  "notes": "any important notes like breakfast included, free cancellation etc"
}`;

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

  if (text === 'null' || !text || text.toLowerCase().includes('"type"') === false) return null;

  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    // הוסף id ייחודי ומטא-דאטה
    return {
      ...parsed,
      id: `booking_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      emailSubject: subject,
      emailFrom: from,
      parsedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

/** אמוג'י לפי סוג הזמנה */
export const bookingEmoji = (type) => {
  const map = { hotel: '🏨', flight: '✈️', car_rental: '🚗', activity: '🎫' };
  return map[type] || '📋';
};

/** צבע לפי סוג הזמנה */
export const bookingColor = (type) => {
  const map = { hotel: '#4CAF50', flight: '#2196F3', car_rental: '#FF9800', activity: '#9C27B0' };
  return map[type] || '#667eea';
};

/** תווית עברית לסוג */
export const bookingLabel = (type) => {
  const map = { hotel: 'מלון', flight: 'טיסה', car_rental: 'השכרת רכב', activity: 'פעילות' };
  return map[type] || 'הזמנה';
};
