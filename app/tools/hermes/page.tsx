'use client';

import { HermesChat } from '@/components/hermes/HermesChat';

export default function HermesPage() {
  return (
    <main>
      <div className="container">
        <h1>Hermes SEO Assistant</h1>
        <p className="subtitle">
          Интегрированный AI-ассистент для SEO анализа, генерации контента и стратегических рекомендаций.
          Использует мощь Hermes Agent с доступом к реальным инструментам.
        </p>
        
        <div className="features">
          <div className="feature">
            <h3>📊 Анализ SEO</h3>
            <p>Полный аудит сайтов, выявление проблем и рекомендации по улучшению</p>
          </div>
          <div className="feature">
            <h3>📝 Генерация контента</h3>
            <p>SEO-оптимизированные статьи, заголовки, мета-описания</p>
          </div>
          <div className="feature">
            <h3>🔍 Исследование ключевых слов</h3>
            <p>Подбор высокочастотных и низкоконкурентных ключевых слов</p>
          </div>
          <div className="feature">
            <h3>🚀 Стратегия продвижения</h3>
            <p>Персональные рекомендации по продвижению вашего бизнеса</p>
          </div>
        </div>
        
        <HermesChat />
        
        <div className="info">
          <h2>Как работает интеграция?</h2>
          <ol>
            <li><strong>Вопрос пользователя</strong> отправляется на эндпоинт <code>/api/hermes</code></li>
            <li><strong>Vercel Function</strong> перенаправляет запрос на Hermes API сервер</li>
            <li><strong>Hermes Agent</strong> обрабатывает запрос с помощью доступных инструментов</li>
            <li><strong>Результат</strong> возвращается через цепочку обратно в интерфейс</li>
          </ol>
          
          <h3>Доступные инструменты Hermes:</h3>
          <ul>
            <li>🌐 Веб-поиск и анализ конкурентов</li>
            <li>📁 Работа с файлами и кодом</li>
            <li>🔧 Терминал и автоматизация</li>
            <li>📊 Анализ данных и визуализация</li>
            <li>🤖 Создание подзадач и делегирование</li>
          </ul>
        </div>
      </div>
      
      <style jsx>{`
        main {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 1rem;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }
        h1 {
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: #6b7280;
          font-size: 1.125rem;
          margin-bottom: 2rem;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .feature {
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: #f9fafb;
        }
        .feature h3 {
          color: #2563eb;
          margin-top: 0;
        }
        .info {
          margin-top: 3rem;
          padding: 2rem;
          background: #f8fafc;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }
        .info h2, .info h3 {
          color: #1e40af;
        }
        code {
          background: #e2e8f0;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: 'Menlo', monospace;
          font-size: 0.875rem;
        }
        ol, ul {
          padding-left: 1.5rem;
          line-height: 1.8;
        }
        li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </main>
  );
}