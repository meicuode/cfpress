@echo off
echo 正在检查8788端口...

REM 检查端口是否被占用
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8788.*LISTENING"') do (
    set PID=%%a
    echo 发现进程 !PID! 正在使用端口8788
    echo 正在终止进程...
    taskkill /F /PID !PID!
    timeout /t 2 /nobreak >nul
)

echo 清理旧的构建缓存...
if exist .wrangler\node_modules rd /s /q .wrangler\node_modules 2>nul

echo 重新构建前端...
call npm run build

echo 启动开发服务器...
call npm run pages:dev
