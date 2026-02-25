import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { callOpenAI } from '../../services/openaiService';

export default function AIDestinationInsights({ destinationName, visible }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const cache = useRef({});

  useEffect(() => {
    if (!destinationName || !visible) return;

    // הצג מ-cache אם כבר נטענו
    if (cache.current[destinationName]) {
      setText(cache.current[destinationName]);
      return;
    }

    setLoading(true);
    setText('');

    callOpenAI([
      {
        role: 'system',
        content: 'אתה מומחה נסיעות. תן 3 עובדות מפתיעות ו-2 טיפים מעשיים. פורמט: שורות קצרות עם אמוג\'י. עברית בלבד. מקסימום 100 מילים סה"כ. אל תוסיף כותרות.'
      },
      {
        role: 'user',
        content: `יעד: ${destinationName}`
      }
    ], { maxTokens: 200, temperature: 0.8 })
      .then((result) => {
        cache.current[destinationName] = result;
        setText(result);
      })
      .catch(() => {
        // כשל שקט — המודאל עובד גם בלי insights
      })
      .finally(() => setLoading(false));
  }, [destinationName, visible]);

  if (!loading && !text) return null;

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mb: 1, fontWeight: 600 }}>
        💡 ידעת? (AI)
      </Typography>

      {loading ? (
        <>
          <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
          <Skeleton variant="text" width="85%" sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
          <Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
        </>
      ) : (
        <Typography
          variant="body2"
          sx={{ opacity: 0.95, lineHeight: 1.8, whiteSpace: 'pre-line', fontSize: '0.85rem' }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
}
