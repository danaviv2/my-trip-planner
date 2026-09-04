import { callGemini, geminiEndpoint } from './geminiClient';
const GEMINI_URL = geminiEndpoint('gemini-2.5-flash');

/**
 * מפענח מייל הזמנה ומחלץ פרטים מובנים
 * @returns {object|null} booking object or null if not a booking
 */
export const parseBookingEmail = async ({ subject, from, date, body }) => {

  const prompt = `You are a travel booking email parser. Extract booking details from this email.
Return ONLY a valid JSON object (no markdown, no explanation). If this is NOT a travel booking confirmation, return the exact string: null

Email From: ${from}
Email Date: ${date}
Subject: ${subject}
Content: ${body.slice(0, 3500)}

Return this exact JSON structure if it IS a booking:
{
  "type": "hotel" | "flight" | "car_rental" | "activity" | "restaurant",
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
  "notes": "any important notes like breakfast included, free cancellation etc",
  "time": "HH:MM — שעת ההזמנה, למסעדה או לפעילות בשעה קבועה",
  "guests": 2
}

RESTAURANT RULES — added 05.09.2026 after measuring two real confirmations
in the user's own mailbox rather than guessing the format:

• Google Reserve writes "Your reservation at <NAME> is confirmed" and puts
  the address, party size and local time in the body. Tabit writes
  "הזמנתך ל<NAME> אושרה". Both already pass the subject filter, which is
  why no keyword was added — they were fetched all along and simply had
  no type to be recognised as.
• "name" is the restaurant, "address" its street address, "checkIn" the
  date, "time" the hour, "guests" the party size. There is no checkOut.
• A restaurant newsletter is NOT a booking. Ontopo sends only marketing —
  13 such mails were measured, all ending in "| פרסומת" — and a mail that
  merely recommends a restaurant must return isBooking:false. A "booking"
  invented from a newsletter would put a table that nobody reserved into
  the itinerary, which is worse than missing it.`;

  const response = await fetch(GEMINI_URL, {
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

/**
 * מחלץ מסמך נסיעה שלם — מייל אישור מכיל לרוב טיסת הלוך, טיסת חזור
 * ולעיתים גם השכרת רכב. מחזיר את המבנה שמסך "פרטי נסיעה" צורך.
 *
 * @param {string} text תוכן המייל כפי שהודבק
 * @returns {Promise<{flights: Array, carRental: object|null, isBooking: boolean}>}
 */
/**
 * הפרומפט המשותף לשני מסלולי הפענוח — טקסט שהודבק וקובץ PDF מצורף.
 * מוגדר פעם אחת כדי ששניהם יחזירו בדיוק אותו מבנה.
 */
const buildExtractionPrompt = (sourceBlock) => `You are a travel booking parser. Extract ALL bookings from this text.
Return ONLY valid JSON (no markdown). Use null for anything you cannot find — never invent values.
If the text is NOT a travel booking confirmation, return exactly: {"isBooking": false, "flights": [], "carRental": null}

${sourceBlock}

Return this exact structure:
{
  "isBooking": true,
  "status": "confirmed" or "cancelled",
  "cancelledReferences": ["booking numbers being cancelled, if any"],
  "flights": [
    {
      "type": "departure" or "return",
      "airline": "airline name",
      "flightNumber": "e.g. LY381",
      "date": "YYYY-MM-DD",
      "departureAirport": "IATA code e.g. TLV",
      "departureTime": "HH:MM",
      "arrivalAirport": "IATA code",
      "arrivalTime": "HH:MM",
      "terminal": "terminal of departure or null",
      "price": "total price with currency symbol, or null"
    }
  ],
  "carRental": {
    "category": "rental" or "transfer",
    "company": "rental company",
    "confirmationNumber": "reference",
    "pickupDate": "YYYY-MM-DD",
    "pickupTime": "HH:MM",
    "pickupLocation": "full location",
    "returnDate": "YYYY-MM-DD",
    "returnTime": "HH:MM",
    "returnLocation": "full location",
    "carType": "car model or class",
    "price": "total price with currency symbol, or null"
  },
  "insurance": {
    "provider": "insurance company name",
    "policyNumber": "policy or certificate number",
    "emergencyPhone": "24/7 assistance phone number, with country code",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "coverage": "short summary of what is covered",
    "insured": "names of the insured travellers",
    "price": "total price with currency symbol, or null"
  },
  "activities": [
    {
      "name": "attraction, tour or event name",
      "confirmationNumber": "booking reference or ticket number",
      "date": "YYYY-MM-DD",
      "time": "HH:MM entry or start time, or null",
      "location": "venue name and address",
      "guests": 2,
      "price": "total price with currency symbol, or null"
    }
  ],
  "hotel": {
    "name": "hotel or accommodation name",
    "confirmationNumber": "reference",
    "checkIn": "YYYY-MM-DD",
    "checkOut": "YYYY-MM-DD",
    "address": "full address or city",
    "guests": 2,
    "roomType": "room description",
    "price": "total price with currency"
  }
}
Rules:
- Convert DD/MM/YYYY to YYYY-MM-DD.
- For "price", copy the total charged amount exactly as written, including the
  currency symbol or code (e.g. "€ 924.05", "$1,240", "₪3,500"). Never convert
  between currencies and never estimate. If the message shows a price per night
  or per day rather than a total, use the total; if only a partial amount is
  shown, return null rather than a number that is not the total.
- Set "status" to "cancelled" when the message announces that a booking was
  cancelled, refunded, voided, or is no longer valid — in any language
  (e.g. "cancelled", "cancellation", "בוטלה", "ביטול הזמנה", "הזמנתך בוטלה").
  Still extract every detail you can find: the cancellation must be matched
  against the original booking, so flight numbers, dates and references matter.
  A cancellation notice often carries NO travel details at all — only a
  sentence and a booking number. In that case still return "isBooking": true,
  set "status" to "cancelled", and put every booking or confirmation number
  you can see into "cancelledReferences". Leave flights, carRental and hotel
  empty. Without the reference there is nothing to match the cancellation to.
  A message that merely allows cancelling ("free cancellation until...",
  "ביטול חינם עד") is NOT a cancellation — keep "confirmed".
- If there is no car rental in the text, set "carRental" to null. Do NOT invent one.
- Set "category" to "transfer" for an airport taxi, shuttle, private driver or
  point-to-point transfer — a one-way ride from A to B at a single moment in
  time, with no vehicle handed over to the traveller. Such a booking has a
  pickup point and a destination but no return date and no car class.
  Set "category" to "rental" when the traveller takes possession of a vehicle
  and returns it later. For a transfer, put the destination in "returnLocation"
  and leave "returnDate", "returnTime" and "carType" as null.
- If there is no accommodation in the text, set "hotel" to null. Do NOT invent one.
- "insurance" is for travel insurance policies only. The emergency phone is the
  single most important field: it is what the traveller needs in a hospital
  abroad. Copy it exactly, including the country code. Set to null if absent.
- Dates must come from a field that is labelled as a date — "תאריך תחילה",
  "start date", "valid from", "בתוקף עד", a check-in row. NEVER derive a date
  from a name or an identifier. Product and plan names routinely contain a
  month and a year ("PassportCard DSIC Modular 11-2025", "Winter 2026 Plan",
  "Policy 03/24"); that is a version, not a period of cover. If no labelled
  date appears, set the date fields to null. An empty date is corrected by the
  next document; an invented one is trusted and silently wrong.
- "provider" is the brand the traveller bought from and recognises, which is
  usually the name in the subject and the logo. An underwriter named in the
  policy wording is not the provider; put it in "coverage" if it matters.
- "emergencyPhone" is the INSURER's 24/7 assistance line — a company number.
  It is never the policyholder's own phone. A document lists both: the
  policyholder's contact details near their name and address, and the
  assistance line near words like "emergency", "assistance", "מוקד", "חירום",
  "24/7". An Israeli mobile number (05x) belonging to the insured is not the
  assistance line. If only a personal number appears, set it to null — an
  empty field is safe, a wrong number in an emergency is not.
- A travel insurance policy states a coverage period and a policy number. A
  registration for a flight-delay compensation service or a lounge-access
  benefit is NOT a travel insurance policy, even when the same company sends
  it and even when it names a validity date. Signals: the only stated coverage
  is flight delay or lounge access, and no medical cover is mentioned. Set
  "insurance" to null for these. Presenting such a message as a policy puts a
  wrong emergency number in front of a traveller who needs a real one.
- The text may begin with a "סוג מוצהר (schema.org)" line. That is the
  sender's own machine-readable declaration of what the document is, and it
  outranks every other signal here including your reading of the body: a
  LodgingReservation is a stay, a FlightReservation is a flight, an
  EventReservation is an attraction or show. Map it to the matching object and
  do not second-guess it. Its absence means nothing — most senders omit it.
- The text may begin with a "שולח:" line naming the sender and what that
  sender sells. Use it, but only as far as it goes. When the line says this is
  the only kind of document that sender sends, trust it over your reading of
  the body — a GetYourGuide message is an activity even when the wording is
  unusual. When it says the sender ships several kinds, the line narrows
  nothing on its own: the same insurer emails both a policy and a lounge
  voucher, and treating every message from that address as a policy is exactly
  the error this line exists to prevent. If no "שולח:" line appears, decide
  from the document alone.
- "activities" covers attractions, guided tours, shows, museum entry and event
  tickets. The entry time matters even more than the date, because a timed
  ticket constrains the whole day. If no time is stated, use null rather than
  guessing one.
- If there are no activities, return an empty array. Do NOT invent any.
- If there are no flights, return an empty array. Do NOT invent flights.
- Restaurant reservations are NOT accommodation. If the booking is for a
  restaurant table, set "isBooking" to false.
- A customer-service reply, support ticket or correspondence about a booking is
  NOT itself a booking. Such messages quote a reference number and sometimes a
  date, but they describe a conversation, not a reservation. Signals: a subject
  beginning with "Re:" or "RE:", the words "customer query", "support",
  "ticket", "we received your request", "פנייתך", "שירות לקוחות". Set
  "isBooking" to false for these even when a reference number appears.
- A voucher, upgrade, lounge pass or goodwill gesture sent after a disruption is
  not a new booking either. Set "isBooking" to false.`;

/** ממיר את תשובת המודל למבנה שהמסכים צורכים. משותף לשני המסלולים. */
const normalizeParsed = (raw) => {
  const cleaned = String(raw).replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('PARSE_FAILED');
  }

  const flights = Array.isArray(parsed.flights) ? parsed.flights : [];
  const activities = Array.isArray(parsed.activities) ? parsed.activities : [];

  const cancelled = parsed.status === 'cancelled';
  const cancelledReferences = Array.isArray(parsed.cancelledReferences)
    ? parsed.cancelledReferences.map((r) => String(r).trim()).filter(Boolean)
    : [];

  return {
    // הודעת ביטול אינה נושאת פרטי טיסה או לינה, ולכן התנאי הקודם — שדרש
    // טיסה, רכב או מלון — סינן אותה החוצה לפני שמישהו הסתכל על השדה
    // status. הביטול לא היה יכול להיקלט מלכתחילה. מספר אישור לבדו מספיק.
    isBooking:
      parsed.isBooking !== false &&
      (flights.length > 0 || !!parsed.carRental || !!parsed.hotel ||
       !!parsed.insurance || activities.length > 0 ||
       (cancelled && cancelledReferences.length > 0)),
    cancelledReferences,
    // מייל ביטול נראה כמו אישור לכל דבר ומכיל את אותם פרטים. בלי השדה
    // הזה הזמנה שבוטלה נכנסת למאגר כפעילה, והמסלול מציג רכב שאין.
    cancelled,
    flights: flights.map((f, i) => ({
      id: Date.now() + i,
      type: f.type === 'return' ? 'return' : 'departure',
      airline: f.airline || '',
      flightNumber: f.flightNumber || '',
      date: f.date || '',
      departureAirport: f.departureAirport || '',
      departureTime: f.departureTime || '',
      arrivalAirport: f.arrivalAirport || '',
      arrivalTime: f.arrivalTime || '',
      terminal: f.terminal || '',
      price: f.price || '',
    })),
    carRental: parsed.carRental
      ? {
          // גיבוי לסיווג של המודל: הסעה משדה תעופה אינה מוסרת רכב לידי
          // הנוסע, ולכן אין לה תאריך החזרה ואין סוג רכב. אם שני אלה
          // חסרים, זו הסעה גם אם המודל לא סימן זאת.
          category:
            parsed.carRental.category === 'transfer' ||
            (!parsed.carRental.returnDate && !parsed.carRental.carType)
              ? 'transfer'
              : 'rental',
          company: parsed.carRental.company || '',
          confirmationNumber: parsed.carRental.confirmationNumber || '',
          pickupDate: parsed.carRental.pickupDate || '',
          pickupTime: parsed.carRental.pickupTime || '',
          pickupLocation: parsed.carRental.pickupLocation || '',
          returnDate: parsed.carRental.returnDate || '',
          returnTime: parsed.carRental.returnTime || '',
          returnLocation: parsed.carRental.returnLocation || '',
          carType: parsed.carRental.carType || '',
          price: parsed.carRental.price || '',
        }
      : null,
    insurance: parsed.insurance
      ? {
          provider: parsed.insurance.provider || '',
          policyNumber: parsed.insurance.policyNumber || '',
          emergencyPhone: parsed.insurance.emergencyPhone || '',
          startDate: parsed.insurance.startDate || '',
          endDate: parsed.insurance.endDate || '',
          coverage: parsed.insurance.coverage || '',
          insured: parsed.insurance.insured || '',
          price: parsed.insurance.price || '',
        }
      : null,
    activities: activities.map((a) => ({
      name: a.name || '',
      confirmationNumber: a.confirmationNumber || '',
      date: a.date || '',
      time: a.time || '',
      location: a.location || '',
      guests: Number(a.guests) || null,
      price: a.price || '',
    })),
    hotel: parsed.hotel
      ? {
          name: parsed.hotel.name || '',
          confirmationNumber: parsed.hotel.confirmationNumber || '',
          checkIn: parsed.hotel.checkIn || '',
          checkOut: parsed.hotel.checkOut || '',
          address: parsed.hotel.address || '',
          guests: Number(parsed.hotel.guests) || null,
          roomType: parsed.hotel.roomType || '',
          price: parsed.hotel.price || '',
        }
      : null,
  };
};

export const parseTravelDocument = async (text) => {
  const prompt = buildExtractionPrompt(`Text:\n${String(text).slice(0, 6000)}`);

  const response = await callGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  return normalizeParsed(raw);
};

/**
 * מפענח אישור הזמנה שנמצא בקובץ PDF מצורף.
 *
 * ספקים רבים שמים את הפרטים רק בקובץ, וגוף המייל אומר "מצורף האישור".
 * Gemini קורא PDF ישירות, כך שאין צורך בספריית פענוח בצד הלקוח — מה
 * שחוסך כמגה־בייט מהבאנדל ומשמר את פריסת הטבלאות שבמסמך.
 *
 * @param {string} base64Pdf תוכן הקובץ בקידוד base64
 * @returns {Promise<object>} אותו מבנה שמחזירה parseTravelDocument
 */
export const parseTravelDocumentFromPdf = async (base64Pdf) => {
  if (!base64Pdf) throw new Error('NO_PDF');

  const response = await callGemini({
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'application/pdf', data: base64Pdf } },
          { text: buildExtractionPrompt('the attached PDF document') },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  return normalizeParsed(raw);
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
