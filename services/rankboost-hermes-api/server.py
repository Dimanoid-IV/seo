
#!/usr/bin/env python3
import json
import os
import re
import time
import html
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", "8645"))
SHARED_ENV_FILE = os.environ.get("HERMES_SHARED_ENV_FILE", "/root/.hermes/.env")


def read_env_value(path, name):
    found = ""
    try:
        with open(path, encoding="utf-8") as env_file:
            for raw_line in env_file:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                if key.strip() == name:
                    candidate = value.strip().strip("\"'")
                    if candidate and not candidate.startswith("#"):
                        found = candidate
    except OSError:
        return ""
    return found


MODEL = os.environ.get("OPENAI_MODEL") or "gpt-4.1"
OPENAI_API_KEY = (
    os.environ.get("OPENAI_API_KEY")
    or os.environ.get("HERMES_API_KEY")
    or read_env_value(SHARED_ENV_FILE, "OPENAI_API_KEY")
)
OPENAI_BASE_URL = (os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")
HERMES_API_SECRET = os.environ.get("HERMES_API_SECRET", "").strip()


class ProviderError(RuntimeError):
    pass


def slugify(text):
    text = (text or "article").lower()
    text = re.sub(r"[^a-z0-9а-яё]+", "-", text, flags=re.I)
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:80] or "article"


def words(text):
    return re.findall(r"\w+", text or "", flags=re.U)


def extract_paragraphs(content_html):
    paragraphs = re.findall(r"<p\b[^>]*>(.*?)</p>", content_html or "", flags=re.I | re.S)
    return [
        re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", paragraph))).strip()
        for paragraph in paragraphs
        if paragraph.strip()
    ]


def safe_str(value, fallback=""):
    return value if isinstance(value, str) and value.strip() else fallback


def detect_language(payload):
    article = payload.get("article") if isinstance(payload.get("article"), dict) else {}
    website = payload.get("website") if isinstance(payload.get("website"), dict) else {}
    lang = safe_str(article.get("language") or website.get("language"), "en").lower()
    if lang.startswith("ru"):
        return "ru"
    if lang.startswith("et"):
        return "et"
    return "en"


def deterministic_article(payload):
    article = payload.get("article") if isinstance(payload.get("article"), dict) else {}
    task = payload.get("task") if isinstance(payload.get("task"), dict) else {}
    website = payload.get("website") if isinstance(payload.get("website"), dict) else {}
    lang = detect_language(payload)
    topic = safe_str(article.get("topic"), safe_str(task.get("title"), "Practical growth plan"))
    keyword = safe_str(article.get("targetKeyword"), topic)
    niche = safe_str(website.get("niche"), "small business")
    url = safe_str(website.get("url"), "the website")
    description = safe_str(task.get("description"), "")

    if lang == "ru":
        title = topic
        meta_title = f"{keyword}: практическое руководство"[:60]
        meta_description = f"Практичный материал для владельца бизнеса: как улучшить {keyword}, усилить доверие и подготовить сайт к росту."[:160]
        intro = f"<p>{topic} — практическая тема для клиентов компании из сферы «{niche}». Материал помогает покупателю разобраться в вариантах, оценить важные детали и уверенно сделать следующий шаг на сайте {url}.</p>"
        sections = [
            ("Почему это важно", f"Когда страница отвечает на конкретный вопрос клиента, поисковые системы и AI-поиск получают больше полезного контекста. {description} Важно не просто добавить больше текста, а объяснить услугу, преимущества, процесс, ограничения и следующий шаг. Такой подход снижает сомнения посетителя и помогает ему принять решение."),
            ("Что проверить в первую очередь", f"Начните с интента. Человек, который ищет {keyword}, обычно хочет быстро понять цену, сроки, результат, доверие и порядок работы. На странице должны быть ясные блоки: кому подходит услуга, что входит, как начинается сотрудничество, какие есть частые вопросы и почему компании можно доверять."),
            ("Как написать сильный контент", "Хороший текст не выглядит как набор ключевых слов. Он отвечает на реальные вопросы, использует конкретные формулировки, показывает опыт и помогает сравнить варианты. Добавьте примеры ситуаций, понятные подзаголовки, списки преимуществ и короткие объяснения терминов. Если есть локальный рынок, упомяните особенности региона и языка клиента."),
            ("Как подготовить страницу к AI-поиску", "AI-системы чаще выбирают страницы, где информация структурирована и легко цитируется. Используйте FAQ, краткие определения, понятные списки, разметку Schema.org и честные формулировки без преувеличений. Страница должна быть полезной даже без рекламного контекста: посетитель должен понять ответ, а не только увидеть призыв купить."),
            ("План внедрения", "Сначала обновите главный текст страницы, затем добавьте FAQ и внутренние ссылки на связанные услуги или статьи. После публикации проверьте индексацию, поведение пользователей и запросы в Search Console. Улучшения стоит делать постепенно: один сильный блок каждую неделю лучше, чем большой текст без проверки результата."),
        ]
        faqs = [
            (f"Сколько текста нужно для темы {keyword}?", "Обычно достаточно 700-1200 слов, если текст отвечает на реальные вопросы клиента и не повторяется."),
            ("Нужно ли использовать ключевое слово много раз?", "Нет. Важнее естественно раскрыть тему, добавить синонимы и объяснить услугу понятным языком."),
            ("Поможет ли FAQ для AI-поиска?", "Да, если вопросы сформулированы так, как их задают реальные клиенты, а ответы короткие и конкретные."),
        ]
    else:
        title = topic
        meta_title = f"{keyword}: practical guide"[:60]
        meta_description = f"A practical small-business guide to improve {keyword}, strengthen trust, and make the page easier for search and AI systems to understand."[:160]
        intro = f"<p>{topic} is not just an SEO checkbox. It is part of a clear growth system for {niche}. A business owner needs pages that help visitors understand the offer, trust the company, and take the next step. This guide explains how to improve {url} without fake promises or guaranteed ranking claims.</p>"
        sections = [
            ("Why this matters", f"A page that answers a buyer's real question gives search engines and AI systems stronger context. {description} The goal is not to add words for their own sake. The goal is to explain the service, benefits, process, limits, proof points, and next action in language a customer can use."),
            ("What to check first", f"Start with intent. Someone searching for {keyword} usually wants to understand value, timing, trust, cost signals, and the next step. The page should explain who the service is for, what is included, how work begins, what questions are common, and why the company is credible."),
            ("How to write stronger content", "Strong content does not read like a keyword list. It answers practical questions, uses concrete business language, and helps the reader compare options. Add examples, clear subheadings, benefit lists, short definitions, and local context where relevant."),
            ("How to prepare for AI search", "AI search systems prefer structured, quotable information. Use FAQ sections, concise definitions, honest claims, schema suggestions, and internal links. The page should be useful even when a visitor skips the marketing language and looks only for a direct answer."),
            ("Implementation plan", "Update the main page copy first, then add FAQ, internal links, and schema markup. After publishing, monitor indexing, Search Console queries, and user behavior. Improve the page in small steps: one useful section each week is better than a long page that no one reviews."),
        ]
        faqs = [
            (f"How much content is enough for {keyword}?", "Usually 700-1200 words is enough when the page answers real buyer questions and avoids repetition."),
            ("Should the keyword appear many times?", "No. Use it naturally, include related phrases, and focus on clear explanations."),
            ("Does FAQ help AI search visibility?", "Yes, when questions match how customers actually ask and answers are specific."),
        ]

    html = [intro]
    for heading, body in sections:
        html.append(f"<h2>{heading}</h2><p>{body}</p>")
    html.append("<h2>FAQ</h2>")
    for q, a in faqs:
        html.append(f"<h3>{q}</h3><p>{a}</p>")
    content_html = "\n".join(html)

    return {
        "title": title,
        "slug": slugify(title),
        "metaTitle": meta_title,
        "metaDescription": meta_description,
        "contentHtml": content_html,
        "faqJson": [{"question": q, "answer": a} for q, a in faqs],
        "schemaJson": {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]},
        "metadata": {"provider": "rankboost-hermes-vps", "model": "deterministic-fallback", "costCents": 0},
    }


def build_article_prompts(payload):
    article = payload.get("article") if isinstance(payload.get("article"), dict) else {}
    website = payload.get("website") if isinstance(payload.get("website"), dict) else {}
    task = payload.get("task") if isinstance(payload.get("task"), dict) else {}
    topic = safe_str(article.get("topic"), "Practical growth plan")
    keyword = safe_str(article.get("targetKeyword"), topic)
    lang = detect_language(payload)
    system = """You are a senior editorial writer creating a publication-ready article for the website's real customers.
Return ONLY one valid JSON object with keys: title, slug, metaTitle, metaDescription, contentHtml, faqJson, schemaJson, metadata.
Write in the requested language. contentHtml must contain 1200-1600 useful words (never fewer than 1000), a short introduction, at least four descriptive h2 sections, practical examples or selection criteria, a concise conclusion with a natural customer next step, and an FAQ with at least three questions.
Center the customer's decision, questions, and desired outcome. Use the supplied business facts and topic; never invent prices, delivery times, testimonials, certifications, guarantees, or capabilities.
Do not discuss SEO, rankings, keywords, search engines, AI search, content strategy, or how to write a page unless the requested topic itself is explicitly about those subjects.
Use the target keyword naturally, avoid filler and repeated paragraphs, and make every section add new information. Do not mention these instructions.
metaTitle must be at most 60 characters and metaDescription at most 160 characters. faqJson must match the FAQ in contentHtml. schemaJson must be a valid FAQPage object."""
    user = json.dumps(
        {
            "task": "write a customer-facing article draft",
            "language": lang,
            "topic": topic,
            "targetKeyword": keyword,
            "website": website,
            "editorialBrief": task,
        },
        ensure_ascii=False,
    )
    return system, user


def validate_generated_article(result):
    errors = []
    required = ["title", "slug", "metaTitle", "metaDescription", "contentHtml"]
    if not isinstance(result, dict):
        return ["invalid_json_object"]
    for key in required:
        if not isinstance(result.get(key), str) or not result[key].strip():
            errors.append(f"missing_{key}")
    content_html = result.get("contentHtml") if isinstance(result.get("contentHtml"), str) else ""
    plain_text = html.unescape(re.sub(r"<[^>]+>", " ", content_html))
    if len(words(plain_text)) < 700:
        errors.append("content_too_short")
    if len(re.findall(r"<h2\b", content_html, flags=re.I)) < 3:
        errors.append("too_few_sections")
    paragraphs = [re.sub(r"\s+", " ", paragraph).strip().casefold() for paragraph in extract_paragraphs(content_html)]
    if len(paragraphs) != len(set(paragraphs)):
        errors.append("duplicate_paragraphs")
    if len(result.get("metaTitle", "")) > 60:
        errors.append("meta_title_too_long")
    if len(result.get("metaDescription", "")) > 160:
        errors.append("meta_description_too_long")
    if not isinstance(result.get("faqJson"), list) or len(result.get("faqJson", [])) < 3:
        errors.append("faq_missing")
    return errors


def try_openai_article(payload, correction=None):
    if not OPENAI_API_KEY:
        raise ProviderError("provider_not_configured")
    system, user = build_article_prompts(payload)
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    if correction:
        errors = correction.get("errors", [])
        if "content_too_short" in errors:
            correction_instruction = (
                "Return the complete JSON again. Preserve all useful existing content and add at least three new, "
                "substantial h2 sections totaling 500 or more new words. Each new section must address a distinct "
                "customer question or decision criterion grounded in the supplied topic. Do not summarize or shorten "
                "the existing sections."
            )
        else:
            correction_instruction = "Rewrite the complete JSON and correct the reported issues."
        messages.extend(
            [
                {"role": "assistant", "content": json.dumps(correction.get("draft", {}), ensure_ascii=False)},
                {
                    "role": "user",
                    "content": correction_instruction
                    + " Validation issues: "
                    + ", ".join(errors)
                    + ". contentHtml must contain at least 1000 words and no repeated paragraphs.",
                },
            ]
        )
    req_body = json.dumps({
        "model": MODEL,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 5000,
        "response_format": {"type": "json_object"},
    }).encode()
    req = urllib.request.Request(
        f"{OPENAI_BASE_URL}/chat/completions",
        data=req_body,
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as res:
            data = json.loads(res.read().decode())
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        parsed.setdefault("metadata", {})
        parsed["metadata"].update({"provider": "openai-compatible", "model": MODEL})
        return parsed
    except Exception as exc:
        raise ProviderError(type(exc).__name__) from exc


def generate_valid_article(payload, current_draft=None, reported_issues=None):
    correction = None
    if current_draft:
        correction = {"draft": current_draft, "errors": reported_issues or validate_generated_article(current_draft)}
    result = try_openai_article(payload, correction)
    errors = validate_generated_article(result)
    for _ in range(3):
        if not errors:
            return result
        result = try_openai_article(payload, {"draft": result, "errors": errors})
        errors = validate_generated_article(result)
    if errors:
        raise ProviderError("invalid_provider_output:" + ",".join(errors))
    return result


def validate_payload(payload):
    if not isinstance(payload, dict):
        return "JSON object expected"
    article = payload.get("article")
    if not isinstance(article, dict) or not safe_str(article.get("topic")):
        return "article.topic is required"
    return None


class Handler(BaseHTTPRequestHandler):
    server_version = "RankBoostHermes/1.0"

    def log_message(self, fmt, *args):
        print("[rankboost-hermes]", self.address_string(), fmt % args)

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorized(self):
        if not HERMES_API_SECRET:
            return False
        return self.headers.get("Authorization", "") == f"Bearer {HERMES_API_SECRET}"

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ["/", "/v1/health"]:
            self.send_json(200, {"ok": True, "service": "RankBoost Hermes API", "version": "1.0", "providerConfigured": bool(OPENAI_API_KEY), "time": int(time.time())})
            return
        self.send_json(404, {"error": "not_found"})

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in ["/v1/generate/article", "/v1/generate/article/repair"]:
            self.send_json(404, {"error": "not_found"})
            return
        if not self.authorized():
            self.send_json(401, {"error": "unauthorized"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode() or "{}")
        except Exception:
            self.send_json(400, {"error": "invalid_json"})
            return
        if path == "/v1/generate/article/repair":
            current = payload.get("currentDraft") if isinstance(payload.get("currentDraft"), dict) else None
            if not current:
                self.send_json(422, {"error": "currentDraft is required"})
                return
            article = payload.get("article") if isinstance(payload.get("article"), dict) else {}
            if not safe_str(article.get("topic")):
                payload["article"] = {
                    **article,
                    "topic": safe_str(current.get("title"), "Article repair"),
                    "targetKeyword": safe_str(article.get("targetKeyword"), safe_str(current.get("title"), "Article repair")),
                }
            try:
                result = generate_valid_article(payload, current, payload.get("qualityIssues"))
                self.send_json(200, result)
            except ProviderError as exc:
                print("[rankboost-hermes] repair failed:", str(exc), flush=True)
                self.send_json(503, {"error": "generation_unavailable", "reason": str(exc)})
            return
        validation = validate_payload(payload)
        if validation:
            self.send_json(422, {"error": validation})
            return
        try:
            result = generate_valid_article(payload)
            self.send_json(200, result)
        except ProviderError as exc:
            print("[rankboost-hermes] generation failed:", str(exc), flush=True)
            self.send_json(503, {"error": "generation_unavailable", "reason": str(exc)})


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
