from fastapi import APIRouter, HTTPException
from models.schemas import DSLParseResponse
from dsl.parser import DSLParser
from dsl.transformer import DSLTransformer

router = APIRouter()
parser = DSLParser()
transformer = DSLTransformer()

@router.post("/parse", response_model=DSLParseResponse)
def parse_dsl(dsl_text: dict):
    text = dsl_text.get("text", "")
    try:
        tree = parser.parse(text)
        ast = transformer.transform(tree)
        return {"success": True, "ast_summary": f"Parsed {len(ast['courses'])} courses, {len(ast['constraints'])} constraints"}
    except Exception as e:
        return {"success": False, "error": str(e)}
