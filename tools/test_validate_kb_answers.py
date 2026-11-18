"""Unit tests for the KB dataset gate. Run: python -m unittest discover -s tools -p 'test_validate_kb_answers.py'"""
import unittest
from validate_kb_answers import validate

def sample(**changes):
    item = dict(id=1, category="SEO", question="What is SEO?",
                answer="Search engine optimization.", paraphrases=["Define SEO"],
                scope="general_education", source_url=None,
                verified_at=None, status="reviewed")
    item.update(changes)
    return item

class ValidatorTests(unittest.TestCase):
    def test_valid_general_record(self):
        self.assertEqual(validate([sample()]), [])
    def test_duplicate_id(self):
        self.assertTrue(validate([sample(), sample(question="Another question")]))
    def test_duplicate_question(self):
        self.assertTrue(validate([sample(), sample(id=2, question="WHAT IS SEO?")]))
    def test_unverified_company_claim_cannot_be_approved(self):
        self.assertTrue(validate([sample(scope="pending_verification", status="approved")]))
    def test_verified_company_claim_requires_source(self):
        self.assertTrue(validate([sample(scope="worlddigital_verified", status="approved")]))
    def test_verified_company_claim_with_source(self):
        self.assertEqual(validate([sample(scope="worlddigital_verified", status="approved",
                                          source_url="https://worlddigital.ai/help",
                                          verified_at="2026-11-17")]), [])
if __name__ == "__main__":
    unittest.main()
