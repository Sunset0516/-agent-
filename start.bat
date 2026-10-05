@echo off
chcp 65001 >nul
echo ========================================
echo   求职助手平台 - 启动脚本
echo ========================================

REM 检查 Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+
    pause
    exit /b 1
)

REM 检查 Node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo.
echo [1/2] 启动 Agent 服务 (Python)...
cd /d "%~dp0agent-service"
start "Agent Service" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload"

echo [2/2] 启动后端服务 (Node.js)...
cd /d "%~dp0backend"
start "Backend" cmd /k "node server.js"

echo.
echo ========================================
echo   启动完成！
echo   前端: http://localhost:3000
echo   Agent: http://localhost:5000
echo ========================================
echo.
echo 注意：请等待两个服务都显示启动成功后再访问前端。
pause
