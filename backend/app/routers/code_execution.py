from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.models.user import User
from app.services.code_execution_service import execute_code

router = APIRouter(tags=["code"])


class CodeExecutionRequest(BaseModel):
    language: str
    code: str


@router.post("/execute")
async def execute_code_endpoint(
    body: CodeExecutionRequest,
    current_user: User = Depends(get_current_user)
):
    """Execute code in various programming languages using Piston API"""
    result = await execute_code(body.language, body.code)
    return result
