import React, { useState, useRef, useEffect } from 'react';
import {
  Fab, Drawer, Box, Typography, TextField, IconButton,
  Paper, Chip, Stack, CircularProgress, Tooltip, useMediaQuery,
  useTheme, Divider, Avatar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { useAIChat } from '../../contexts/AIChatContext';
import { streamOpenAI, getErrorMessage } from '../../services/openaiService';

const SYSTEM_PROMPT = `אתה "טריפי" — עוזר נסיעות חכם ואמפתי לישראלים.
תענה בעברית בלבד, בצורה קצרה (עד 200 מילה), ידידותית ומעשית.
אם שואלים על יעד ספציפי — תן 3-4 עצות בולטות + מחיר משוער.
אם שואלים על מסלול — תן מבנה יומי פשוט.
אם שואלים על ויזה — ציין בדיוק מה נדרש לאזרח ישראלי.
השתמש באמוג'י במינון. אל תיצור HTML.`;

const QUICK_PROMPTS = [
  'יעדים חמים לחורף 🌞',
  'טיול זול לאירופה 💶',
  'ויזה לתאילנד 📋',
  'מה לארוז לבלי? 🧳',
  'מסלול 5 ימים רומא 🏛️',
  'יעד רומנטי לזוג 💑',
];

function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
        alignItems: 'flex-end',
        gap: 0.8
      }}
    >
      {!isUser && (
        <Avatar sx={{ width: 28, height: 28, bgcolor: '#667eea', flexShrink: 0 }}>
          <SmartToyIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}

      <Paper
        elevation={0}
        sx={{
          p: '10px 14px',
          maxWidth: '82%',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : '#f4f4f8',
          color: isUser ? 'white' : 'text.primary',
          boxShadow: isUser ? '0 4px 12px rgba(102,126,234,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.65,
            fontSize: '0.88rem',
            direction: 'rtl',
            textAlign: 'right'
          }}
        >
          {message.content}
        </Typography>
      </Paper>

      {isUser && (
        <Avatar sx={{ width: 28, height: 28, bgcolor: '#764ba2', flexShrink: 0 }}>
          <PersonIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}
    </Box>
  );
}

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.8, mb: 1.5 }}>
      <Avatar sx={{ width: 28, height: 28, bgcolor: '#667eea', flexShrink: 0 }}>
        <SmartToyIcon sx={{ fontSize: 16 }} />
      </Avatar>
      <Paper elevation={0} sx={{ p: '10px 14px', borderRadius: '18px 18px 18px 4px', bgcolor: '#f4f4f8' }}>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {[0, 0.2, 0.4].map((delay, i) => (
            <Box
              key={i}
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: '#667eea',
                animation: 'typing 1.2s ease-in-out infinite',
                animationDelay: `${delay}s`
              }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

export default function TravelAIChat() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isOpen, open, close, messages, addMessage, updateLastAssistant, clearHistory, isStreaming, setIsStreaming } = useAIChat();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);
  const hasNewMessage = messages.length > 1;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isOpen]);

  // cleanup on unmount
  useEffect(() => () => abortRef.current?.(), []);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isStreaming) return;

    setInput('');
    setError('');
    addMessage('user', trimmed);
    setIsStreaming(true);

    // Placeholder for streaming
    addMessage('assistant', '');

    const history = messages
      .filter((m) => m.content)
      .slice(-10) // לקחת רק 10 הודעות אחרונות
      .map((m) => ({ role: m.role, content: m.content }));

    const msgs = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: trimmed }
    ];

    abortRef.current = streamOpenAI(
      msgs,
      (partial) => updateLastAssistant(partial),
      (_full) => {
        setIsStreaming(false);
        abortRef.current = null;
      },
      (err) => {
        setIsStreaming(false);
        setError(getErrorMessage(err));
        updateLastAssistant('מצטער, לא הצלחתי להתחבר. נסה שוב 🙏');
        abortRef.current = null;
      },
      { maxTokens: 600 }
    );
  };

  const handleQuickPrompt = (prompt) => sendMessage(prompt);

  const drawerWidth = isMobile ? '100%' : 380;
  const drawerHeight = isMobile ? '75vh' : '100%';

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Tooltip title="טריפי - עוזר הנסיעות שלך 🌍" placement="right">
          <Fab
            onClick={open}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 60,
              height: 60,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              zIndex: 1200,
              boxShadow: '0 8px 25px rgba(102,126,234,0.5)',
              animation: hasNewMessage ? 'none' : 'fabPulse 2.5s ease-in-out infinite',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 12px 35px rgba(102,126,234,0.6)',
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
              },
            }}
          >
            <SmartToyIcon sx={{ fontSize: 28 }} />
          </Fab>
        </Tooltip>
      )}

      {/* Chat Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={isOpen}
        onClose={close}
        PaperProps={{
          sx: {
            width: drawerWidth,
            height: drawerHeight,
            borderRadius: isMobile ? '20px 20px 0 0' : 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          px: 2.5,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 38, height: 38 }}>
              <SmartToyIcon />
            </Avatar>
            <Box>
              <Typography fontWeight={700} lineHeight={1.2}>טריפי</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>עוזר נסיעות AI 🌍</Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="נקה שיחה">
              <IconButton color="inherit" size="small" onClick={clearHistory} sx={{ mr: 0.5 }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton color="inherit" size="small" onClick={close}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Messages Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, direction: 'rtl' }}>
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}
          {isStreaming && messages[messages.length - 1]?.content === '' && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </Box>

        {/* Quick Prompts */}
        <Box sx={{ px: 1.5, pb: 0.5, flexShrink: 0 }}>
          <Box sx={{ overflowX: 'auto', display: 'flex', gap: 1, pb: 0.5, flexDirection: 'row-reverse' }}>
            {QUICK_PROMPTS.map((p) => (
              <Chip
                key={p}
                label={p}
                size="small"
                onClick={() => handleQuickPrompt(p)}
                disabled={isStreaming}
                sx={{
                  flexShrink: 0,
                  cursor: 'pointer',
                  bgcolor: '#f0f0f8',
                  '&:hover': { bgcolor: '#e0e0f0' },
                  fontSize: '0.75rem'
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider />

        {/* Input */}
        <Box sx={{ p: 1.5, flexShrink: 0, direction: 'rtl' }}>
          {error && (
            <Typography variant="caption" color="error" display="block" mb={0.5} textAlign="center">
              {error}
            </Typography>
          )}
          <Box display="flex" gap={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאל אותי על הטיול שלך..."
              disabled={isStreaming}
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  direction: 'rtl',
                  '&.Mui-focused fieldset': { borderColor: '#667eea' }
                }
              }}
            />
            <IconButton
              onClick={() => sendMessage()}
              disabled={isStreaming || !input.trim()}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                width: 40,
                height: 40,
                flexShrink: 0,
                '&:hover': { background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' },
                '&.Mui-disabled': { background: '#e0e0e0', color: '#aaa' }
              }}
            >
              {isStreaming ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18, transform: 'scaleX(-1)' }} />}
            </IconButton>
          </Box>
        </Box>
      </Drawer>

      <style>{`
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 8px 25px rgba(102,126,234,0.5); }
          50% { box-shadow: 0 8px 40px rgba(102,126,234,0.8); transform: scale(1.05); }
        }
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
