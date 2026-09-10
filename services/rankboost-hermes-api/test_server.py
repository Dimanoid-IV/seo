import importlib.util
import pathlib
import tempfile
import unittest
from unittest import mock


MODULE_PATH = pathlib.Path(__file__).with_name("server.py")
SPEC = importlib.util.spec_from_file_location("rankboost_hermes_server", MODULE_PATH)
server = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(server)


def portrait_payload():
    return {
        "article": {
            "topic": "Портрет по фото на холсте: как выбрать стиль",
            "targetKeyword": "портрет по фото на холсте",
            "language": "ru",
        },
        "website": {
            "url": "https://popart.ee",
            "niche": "портреты на заказ",
            "businessName": "PopArt",
            "country": "EE",
        },
        "task": {
            "title": "Портрет по фото на холсте",
            "description": "Помочь покупателю выбрать фотографию, стиль и формат портрета.",
        },
    }


class ArticleGenerationTests(unittest.TestCase):
    def test_reads_only_the_requested_shared_environment_value(self):
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8") as env_file:
            env_file.write(
                "OTHER_SECRET=do-not-use\n"
                "OPENAI_API_KEY=# This placeholder is not a credential.\n"
                "OPENAI_API_KEY='expected-key'\n"
            )
            env_file.flush()

            self.assertEqual(server.read_env_value(env_file.name, "OPENAI_API_KEY"), "expected-key")

    def test_fallback_never_duplicates_paragraphs(self):
        result = server.deterministic_article(portrait_payload())
        paragraphs = server.extract_paragraphs(result["contentHtml"])

        self.assertEqual(len(paragraphs), len(set(paragraphs)))
        self.assertIn("портрет", result["contentHtml"].lower())
        self.assertNotIn("seo-галочка", result["contentHtml"].lower())

    def test_provider_failure_is_not_silently_replaced_with_template(self):
        with mock.patch.object(server, "OPENAI_API_KEY", "test-key"):
            with mock.patch.object(
                server.urllib.request,
                "urlopen",
                side_effect=TimeoutError("provider timeout"),
            ):
                with self.assertRaises(server.ProviderError):
                    server.try_openai_article(portrait_payload())

    def test_quality_validation_rejects_duplicate_or_short_provider_output(self):
        invalid = {
            "title": "Портрет по фото",
            "slug": "portret-po-foto",
            "metaTitle": "Портрет по фото на холсте",
            "metaDescription": "Как выбрать портрет по фото на холсте.",
            "contentHtml": "<h2>Выбор</h2><p>Один и тот же абзац.</p><p>Один и тот же абзац.</p>",
        }

        errors = server.validate_generated_article(invalid)

        self.assertIn("content_too_short", errors)
        self.assertIn("duplicate_paragraphs", errors)

    def test_prompt_centers_the_customer_and_forbids_meta_seo_copy(self):
        system_prompt, user_prompt = server.build_article_prompts(portrait_payload())

        self.assertIn("customer", system_prompt.lower())
        self.assertIn("do not discuss seo", system_prompt.lower())
        self.assertIn("портреты на заказ", user_prompt)

    def test_generation_retries_quality_corrections_until_output_is_valid(self):
        invalid = {
            "title": "Короткий черновик",
            "slug": "korotkiy-chernovik",
            "metaTitle": "Короткий черновик",
            "metaDescription": "Короткий черновик.",
            "contentHtml": "<h2>Один</h2><p>Мало текста.</p>",
            "faqJson": [],
        }
        valid = {
            **invalid,
            "contentHtml": "<h2>Один</h2><h2>Два</h2><h2>Три</h2><p>"
            + " ".join(f"слово{i}" for i in range(710))
            + "</p>",
            "faqJson": [
                {"question": "Один?", "answer": "Да."},
                {"question": "Два?", "answer": "Да."},
                {"question": "Три?", "answer": "Да."},
            ],
        }

        with mock.patch.object(server, "try_openai_article", side_effect=[invalid, invalid, valid]) as generate:
            result = server.generate_valid_article(portrait_payload())

        self.assertIs(result, valid)
        self.assertEqual(generate.call_count, 3)


if __name__ == "__main__":
    unittest.main()
