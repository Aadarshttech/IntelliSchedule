from lark import Lark
import os

class DSLParser:
    def __init__(self):
        grammar_path = os.path.join(os.path.dirname(__file__), 'grammar.lark')
        with open(grammar_path, 'r', encoding='utf-8') as f:
            grammar_text = f.read()
        self.parser = Lark(grammar_text, parser='lalr', start='start')

    def parse(self, text: str):
        return self.parser.parse(text)
