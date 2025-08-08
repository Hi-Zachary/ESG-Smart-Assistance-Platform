@echo off
chcp 65001
cls

echo 启动ESG智能分析平台...
echo.

echo 正在启动后端服务器...
start "ESG Backend Server" cmd /k "chcp 65001 && cd server && node app.js"

echo 等待后端服务器启动...
timeout /t 3 /nobreak >nul

echo 正在启动前端服务器...
start "ESG Frontend Server" cmd /k "chcp 65001 && npm run dev"

echo.
echo ESG智能分析平台启动完成!
echo 后端服务器: http://localhost:3001
echo 前端服务器: http://localhost:5173
echo.
echo 请等待几秒钟让服务器完全启动...
pause