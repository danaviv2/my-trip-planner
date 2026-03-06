import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  IconButton,
  Chip,
  Paper,
  Typography,
  CircularProgress,
  Avatar,
  Fade,
  Stack,
  Tooltip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../contexts/AuthContext';
import { useTripSave } from '../../contexts/TripSaveContext';

const GEMINI_API_KEY =
  process.env.REACT_APP_GEMINI_API_KEY || window.env?.REACT_APP_GEMINI_API_KEY;

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const MAX_MESSAGES = 20;

const QUICK_QUESTIONS = [
  '🍽️ איפה לאכול הערב?',
  '☀️ מה מזג האוויר?',
  '📍 מה לעשות מחר?',
  '💡 טיפ למתחילים',
];

function buildSystemPrompt(savedTrips, currentTrip) {
  const tripList = savedTrips && savedTrips.length > 0
    ? savedTrips
        .map((t) => {
          const name = t.name || t.destination || t.endPoint || 'טיול ללא שם';
          const dest = t.destination || t.endPoint || '';
          return dest && dest !== name ? `${name} (${dest})` : name;
        })
        .join(', ')
    : 'אין טיולים שמורים';

  const currentInfo = currentTrip
    ? `הטיול הנוכחי: ${
        currentTrip.name || currentTrip.destination || currentTrip.endPoint || 'לא הוגדר'
      }${
        currentTrip.startPoint ? ` — יוצאים מ${currentTrip.startPoint}` : ''
      }${
        currentTrip.days ? `, ${currentTrip.days} ימים` : ''
      }${
        currentTrip.budget ? `, תקציב ${currentTrip.budget} ₪` : ''
      }.`
    : '';

  return `אתה עוזר טיולים אישי חכם ומצחיק. אתה מכיר את פרטי הטיול של המשתמש.
טיולים שמורים: ${tripList}.
${currentInfo}
ענה תמיד בעברית. תן תשובות קצרות, מועילות ועם אמוג'י.
אם שואלים על יעד ספציפי בטיול — תן המלצות מקומיות ספציפיות.
אל תיצור HTML. עד 200 מילה לכל תשובה.`;
}

async function callGemini(messages, systemPrompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('מפתח Gemini API חסר. אנא הגדר REACT_APP_GEMINI_API_KEY.');
  }

  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 512,
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `שגיאת שרת ${res.status}`
    );
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    'לא קיבלתי תשובה מהשרת.';
  return text;
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
        alignItems: 'flex-end',
        gap: 0.8,
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            width: 28,
            height: 28,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            flexShrink: 0,
          }}
        >
          <SmartToyIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}

      <Paper
        elevation={0}
        sx={{
          p: '10px 14px',
          maxWidth: '82%',
          borderRadius: isUser
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : '#f4f4f8',
          color: isUser ? '#fff' : '#1a1a2e',
          boxShadow: isUser
            ? '0 2px 12px rgba(102,126,234,0.35)'
            : '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            textAlign: 'right',
            direction: 'rtl',
          }}
        >
          {message.text}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.65,
            fontSize: '0.65rem',
            display: 'block',
            textAlign: isUser ? 'left' : 'right',
            mt: 0.4,
            direction: 'ltr',
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      </Paper>

      {isUser && (
        <Avatar
          sx={{
            width: 28,
            height: 28,
            bgcolor: '#e0e0e0',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: 14 }}>👤</Typography>
        </Avatar>
      )}
    </Box>
  );
}

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.8, mb: 1.5 }}>
      <Avatar
        sx={{
          width: 28,
          height: 28,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          flexShrink: 0,
        }}
      >
        <SmartToyIcon sx={{ fontSize: 16 }} />
      </Avatar>
      <Paper
        elevation={0}
        sx={{
          p: '12px 16px',
          borderRadius: '18px 18px 18px 4px',
          background: '#f4f4f8',
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
        }}
      >
        <CircularProgress size={14} thickness={5} sx={{ color: '#667eea' }} />
        <Typography
          variant="caption"
          sx={{ color: '#667eea', fontWeight: 600, direction: 'rtl' }}
        >
          מקליד...
        </Typography>
      </Paper>
    </Box>
  );
}

export default function TripChatWidget() {
  const { user } = useAuth();
  const { savedTrips, currentTrip } = useTripSave();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages, scrollToBottom]);

  const systemPrompt = buildSystemPrompt(savedTrips, currentTrip);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || input).trim();
      if (!trimmed || loading) return;

      setInput('');
      setError('');

      const userMessage = {
        role: 'user',
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMessage];
        return updated.slice(-MAX_MESSAGES);
      });

      setLoading(true);

      try {
        const historyForApi = [...messages.slice(-MAX_MESSAGES + 1), userMessage];
        const replyText = await callGemini(historyForApi, systemPrompt);

        const assistantMessage = {
          role: 'assistant',
          text: replyText,
          timestamp: Date.now(),
        };

        setMessages((prev) => {
          const updated = [...prev, assistantMessage];
          return updated.slice(-MAX_MESSAGES);
        });
      } catch (err) {
        setError(err.message || 'אירעה שגיאה. נסה שוב.');
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, systemPrompt]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      // Greeting message on first open
      const greeting = {
        role: 'assistant',
        text: `שלום${user?.displayName ? ` ${user.displayName}` : ''}! 👋 אני עוזר הטיול שלך 🤖✈️\nאיך אוכל לעזור לך היום?`,
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    }
  };

  const isEmpty = messages.length <= 1; // only greeting or truly empty

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip title="עוזר הטיול שלך 🤖" placement="left" arrow>
        <Fab
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1200,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            width: 56,
            height: 56,
            boxShadow: '0 4px 20px rgba(102,126,234,0.5)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3d91 100%)',
              transform: 'scale(1.08)',
              boxShadow: '0 6px 24px rgba(102,126,234,0.65)',
            },
          }}
          aria-label="פתח עוזר טיול"
        >
          <Typography sx={{ fontSize: 26, lineHeight: 1 }}>🤖</Typography>
        </Fab>
      </Tooltip>

      {/* Chat Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100vh - 100px)', sm: '75vh' },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        dir="rtl"
      >
        {/* Gradient Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            p: 0,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.4)',
                }}
              >
                <SmartToyIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, lineHeight: 1.2, direction: 'rtl' }}
                >
                  🤖 עוזר הטיול שלך
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.85, direction: 'rtl' }}
                >
                  {loading ? 'מקליד...' : 'מוכן לעזור ✨'}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setOpen(false)}
              sx={{
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
              }}
              size="small"
              aria-label="סגור"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Messages Area */}
        <DialogContent
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ flex: 1 }}>
            {messages.map((msg, idx) => (
              <ChatBubble key={idx} message={msg} />
            ))}

            {loading && <TypingIndicator />}

            {error && (
              <Box
                sx={{
                  textAlign: 'center',
                  mt: 1,
                  p: 1,
                  bgcolor: '#fff3f3',
                  borderRadius: 2,
                  border: '1px solid #ffcdd2',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#c62828', direction: 'rtl' }}
                >
                  ⚠️ {error}
                </Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Quick-question chips — shown when chat is empty / only greeting */}
          {isEmpty && !loading && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#888',
                  display: 'block',
                  mb: 1,
                  textAlign: 'right',
                  direction: 'rtl',
                }}
              >
                שאל אותי:
              </Typography>
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={0.8}
                justifyContent="flex-end"
              >
                {QUICK_QUESTIONS.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    onClick={() => sendMessage(q)}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#667eea',
                      color: '#667eea',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      direction: 'rtl',
                      '&:hover': {
                        bgcolor: 'rgba(102,126,234,0.08)',
                        borderColor: '#764ba2',
                        color: '#764ba2',
                      },
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>

        {/* Input Area */}
        <Box
          sx={{
            p: 1.5,
            borderTop: '1px solid #e8e8f0',
            bgcolor: '#fff',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            flexShrink: 0,
          }}
        >
          <IconButton
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            sx={{
              background:
                input.trim() && !loading
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#e0e0e0',
              color: input.trim() && !loading ? '#fff' : '#bbb',
              width: 42,
              height: 42,
              flexShrink: 0,
              transition: 'all 0.2s',
              '&:hover': {
                background:
                  input.trim() && !loading
                    ? 'linear-gradient(135deg, #5a6fd6 0%, #6a3d91 100%)'
                    : '#e0e0e0',
                transform: input.trim() && !loading ? 'scale(1.06)' : 'none',
              },
            }}
            aria-label="שלח"
          >
            {loading ? (
              <CircularProgress size={18} thickness={5} sx={{ color: '#bbb' }} />
            ) : (
              <SendIcon sx={{ fontSize: 20, transform: 'scaleX(-1)' }} />
            )}
          </IconButton>

          <TextField
            inputRef={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="כתוב הודעה..."
            multiline
            maxRows={4}
            fullWidth
            variant="outlined"
            size="small"
            disabled={loading}
            inputProps={{ dir: 'rtl' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                fontSize: '0.9rem',
                direction: 'rtl',
                bgcolor: '#f8f8fc',
                '& fieldset': { borderColor: '#e0e0f0' },
                '&:hover fieldset': { borderColor: '#667eea' },
                '&.Mui-focused fieldset': { borderColor: '#667eea' },
              },
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
            }}
          />
        </Box>
      </Dialog>
    </>
  );
}
