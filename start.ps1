# 小悠涨粉搭子 —— 一键启动脚本
# 用法: 右键 -> 用 PowerShell 运行,或执行 powershell -ExecutionPolicy Bypass -File start.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== 小悠涨粉搭子 启动中 ===" -ForegroundColor Magenta

# 启动后端
Write-Host "`n[1/3] 启动后端 (FastAPI :8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

# 启动前端
Write-Host "[2/3] 启动前端 (Vite :5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Start-Sleep -Seconds 3

# 打开浏览器
Write-Host "[3/3] 打开浏览器..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "`n=== 启动完成 ===" -ForegroundColor Green
Write-Host "前端: http://localhost:5173" -ForegroundColor White
Write-Host "后端: http://localhost:8000/docs (API 文档)" -ForegroundColor White
Write-Host "`n关闭窗口即可停止服务" -ForegroundColor DarkGray
