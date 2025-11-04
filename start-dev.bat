@echo off
setlocal enabledelayedexpansion

echo ========================================
echo CFPress 开发服务器启动脚本
echo ========================================
echo.

REM 检查是否传入了 --clean 参数
set "CLEAN_CACHE=0"
if "%1"=="--clean" set "CLEAN_CACHE=1"

echo [1/3] 检查端口8788占用情况...
set "PORT_OCCUPIED=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8788.*LISTENING" 2^>nul') do (
    set PID=%%a
    set PORT_OCCUPIED=1
    echo 发现进程 !PID! 正在使用端口8788
    echo 正在终止进程...
    taskkill /F /PID !PID! >nul 2>&1
    if !errorlevel! equ 0 (
        echo 进程已终止
    ) else (
        echo 警告: 无法终止进程 !PID!
    )
)

if !PORT_OCCUPIED! equ 0 (
    echo 端口8788未被占用
)

REM 等待端口释放
if !PORT_OCCUPIED! equ 1 (
    echo 等待端口释放...
    timeout /t 2 /nobreak >nul
)

REM 只在传入 --clean 参数时清理缓存
if !CLEAN_CACHE! equ 1 (
    echo.
    echo [额外] 清理构建缓存...
    if exist .wrangler\node_modules (
        echo 正在清理 .wrangler\node_modules...
        rd /s /q .wrangler\node_modules 2>nul
        echo 清理完成
    ) else (
        echo 无需清理，缓存目录不存在
    )
)

echo.
echo [2/3] 重新构建前端...
call npm run build
if !errorlevel! neq 0 (
    echo 构建失败！
    pause
    exit /b 1
)

echo.
echo [3/3] 启动开发服务器...
echo 服务器将在 http://localhost:8788 启动
echo 按 Ctrl+C 可以停止服务器
echo.
call npm run pages:dev
