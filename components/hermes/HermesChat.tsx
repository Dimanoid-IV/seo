// Пример использования Hermes API в компоненте React
'use client';

import { useState } from 'react';

export function HermesChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/hermes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          model: 'tencent/hy3:free',
        }),
      });
      
      const data = await res.json();
      
      if (data.choices && data.choices[0]) {
        setResponse(data.choices[0].message.content);
      } else if (data.error) {
        setResponse(`Error: ${data.error}`);
      } else {
        setResponse('No response from Hermes');
      }
    } catch (error) {
      setResponse(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSEO = async () => {
    setMessage('Проанализируй SEO сайта https://www.rankboost.eu и предложи улучшения');
    setLoading(true);
    try {
      const res = await fetch('/api/hermes', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Проанализируй SEO сайта https://www.rankboost.eu и предложи улучшения',
        }),
      });
      const data = await res.json();
      setResponse(data.choices?.[0]?.message?.content || 'No analysis received');
    } catch (error) {
      setResponse(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hermes-chat">
      <h2>Hermes SEO Assistant</h2>
      
      <div className="quick-actions">
        <button onClick={analyzeSEO} disabled={loading}>
          📊 Анализ SEO сайта
        </button>
        <button onClick={() => setMessage('Напиши заголовок для статьи про SEO в Эстонии')}>
          📝 Заголовок статьи
        </button>
        <button onClick={() => setMessage('Предложи ключевые слова для SEO агентства')}>
          🔑 Ключевые слова
        </button>
      </div>
      
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Спросите Hermes о SEO, контенте, анализе..."
        rows={4}
      />
      
      <button onClick={sendMessage} disabled={loading || !message.trim()}>
        {loading ? 'Отправка...' : 'Отправить'}
      </button>
      
      {response && (
        <div className="response">
          <h3>Ответ Hermes:</h3>
          <pre>{response}</pre>
        </div>
      )}
      
      <style jsx>{`
        .hermes-chat {
          max-width: 800px;
          margin: 2rem auto;
          padding: 2rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
        }
        .quick-actions {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        button {
          padding: 0.5rem 1rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        textarea {
          width: 100%;
          margin: 1rem 0;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          font-family: inherit;
        }
        .response {
          margin-top: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.25rem;
          border: 1px solid #e5e7eb;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
}