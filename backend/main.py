"""小悠涨粉搭子 —— 后端入口。

启动: uvicorn main:app --reload --port 8000
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import diagnose, growth_plan, content, review, assistant, workshop
from services import deepseek_client, volcengine_client

app = FastAPI(title="小悠涨粉搭子 API", version="1.0.0")

# 允许前端跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnose.router)
app.include_router(growth_plan.router)
app.include_router(content.router)
app.include_router(review.router)
app.include_router(assistant.router)
app.include_router(workshop.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ai_available": deepseek_client.is_available(),
        "model": deepseek_client.MODEL,
        "image_available": volcengine_client.is_available(),
    }


@app.get("/")
def root():
    return {"name": "小悠涨粉搭子 API", "docs": "/docs"}
