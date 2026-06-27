# ADAS Dashboard Public Tunnel
# Makes your dashboard accessible anywhere via a public URL.
#
# Prerequisites:
#   Option A - ngrok (recommended): Sign up free at https://ngrok.com
#     then: ngrok config add-authtoken YOUR_TOKEN
#   Option B - localhost.run: No signup needed
#
# Usage:
#   .\tunnel.ps1          # uses ngrok if available, falls back to localhost.run
#   .\tunnel.ps1 -method ngrok
#   .\tunnel.ps1 -method localhost

param(
    [ValidateSet("auto", "ngrok", "localhost")]
    [string]$method = "auto"
)

$FRONTEND_PORT = 5173

function Start-ngrok() {
    $ngrok = Get-Command "ngrok.exe" -ErrorAction SilentlyContinue
    if (-not $ngrok) {
        $paths = @(
            "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe",
            "$env:ProgramFiles\ngrok\ngrok.exe",
            "$env:LOCALAPPDATA\Ngrok\ngrok.exe"
        )
        foreach ($p in $paths) {
            if (Test-Path $p) { $ngrok = $p; break }
        }
    }
    
    if (-not $ngrok) {
        Write-Host "ngrok not found. Install: winget install Ngrok.Ngrok" -ForegroundColor Yellow
        return $false
    }
    
    # Test if authtoken is configured
    $test = & $ngrok config check 2>&1 | Out-String
    if ($test -match "no authtoken") {
        Write-Host "`n`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
        Write-Host "║  ngrok needs an auth token                        ║" -ForegroundColor Cyan
        Write-Host "║  1. Go to https://dashboard.ngrok.com/signup       ║" -ForegroundColor Cyan
        Write-Host "║     (free, takes 30 seconds)                      ║" -ForegroundColor Cyan
        Write-Host "║  2. Get your token from:                          ║" -ForegroundColor Cyan
        Write-Host "║     https://dashboard.ngrok.com/get-started/your-authtoken ║" -ForegroundColor Cyan
        Write-Host "║  3. Run: ngrok config add-authtoken YOUR_TOKEN    ║" -ForegroundColor Cyan
        Write-Host "║  4. Run this script again                         ║" -ForegroundColor Cyan
        Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
        return $false
    }
    
    Write-Host "Starting ngrok tunnel..." -ForegroundColor Green
    Start-Process -WindowStyle Hidden -FilePath $ngrok.Source -ArgumentList "http", $FRONTEND_PORT
    Start-Sleep 3
    
    try {
        $info = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
        $url = $info.tunnels[0].public_url
        Write-Host "`n✅ Dashboard is LIVE at: $url" -ForegroundColor Green
        Write-Host "   Anyone with this URL can view your ADAS dashboard.`n" -ForegroundColor White
        Write-Host "   Dashboard:       $url" -ForegroundColor Cyan
        Write-Host "   API Health:      $url/api/health" -ForegroundColor Cyan
        Write-Host "   Local:           http://localhost:$FRONTEND_PORT" -ForegroundColor Gray
        Write-Host "`n   Press Ctrl+C to stop the tunnel.`n" -ForegroundColor Yellow
        return $true
    }
    catch {
        Write-Host "Failed to get ngrok URL. Check ngrok dashboard at http://127.0.0.1:4040" -ForegroundColor Red
        return $false
    }
}

function Start-LocalHostRun() {
    Write-Host "Starting localhost.run tunnel (no signup needed)..." -ForegroundColor Green
    
    $tmpFile = "$env:TEMP\tunnel_url.txt"
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
    
    $job = Start-Job -ScriptBlock {
        param($f, $port)
        ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes `
            -R "80:127.0.0.1:$port" nokey@localhost.run 2>&1 | Out-File -FilePath $f -Encoding UTF8
    } -ArgumentList $tmpFile, $FRONTEND_PORT
    
    Write-Host "Connecting" -NoNewline
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep 1
        Write-Host "." -NoNewline
        $content = Get-Content $tmpFile -ErrorAction SilentlyContinue
        $urlLine = $content | Select-String -Pattern "lhr.life" | Select-Object -First 1
        if ($urlLine) {
            $url = "https://" + ($urlLine -replace '.*(https://[^\s]+).*', '$1')
            Write-Host "`n`n✅ Dashboard is LIVE at: $url" -ForegroundColor Green
            Write-Host "   Anyone with this URL can view your ADAS dashboard.`n" -ForegroundColor White
            Write-Host "   Dashboard:       $url" -ForegroundColor Cyan
            Write-Host "   API Health:      $url/api/health" -ForegroundColor Cyan
            Write-Host "   Local:           http://localhost:$FRONTEND_PORT" -ForegroundColor Gray
            Write-Host "`n   NOTE: If you see a blank page, wait a moment and refresh." -ForegroundColor Yellow
            Write-Host "   Keep this window open. Press Ctrl+C to stop.`n" -ForegroundColor Yellow
            return
        }
    }
    
    Write-Host "`nFailed to establish tunnel. Try running manually:" -ForegroundColor Red
    Write-Host "  ssh -R 80:localhost:$FRONTEND_PORT nokey@localhost.run" -ForegroundColor Gray
}

Write-Host @"
╔══════════════════════════════════════════╗
║     ADAS Dashboard - Public Tunnel       ║
║     Share your live demo anywhere        ║
╚══════════════════════════════════════════╝

"@ -ForegroundColor Cyan

if ($method -eq "ngrok") {
    Start-ngrok
}
elseif ($method -eq "localhost") {
    Start-LocalHostRun
}
else {
    # auto: try ngrok first, fallback to localhost.run
    $ngrokOk = Start-ngrok
    if (-not $ngrokOk) {
        Write-Host "`nFalling back to localhost.run..." -ForegroundColor Yellow
        Start-LocalHostRun
    }
}

# Keep the script alive
while ($true) { Start-Sleep 1 }
