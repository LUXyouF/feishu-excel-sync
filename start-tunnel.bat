@echo off
echo ========================================
echo  飞书插件内网穿透启动器
echo ========================================
echo.
echo 选项 1: 使用 localhost.run (需要SSH)
echo 选项 2: 使用 localtunnel (备选)
echo.
echo 请在新的命令行窗口中运行以下命令：
echo.
echo === 选项 1: localhost.run ===
echo ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 nokey@localhost.run
echo.
echo === 选项 2: localtunnel ===
echo npx localtunnel --port 3000
echo.
echo 运行后，将显示的公网地址复制到飞书插件配置中
echo.
pause
