# PowerShell 脚本用于构建 Snaptext APK (Windows)

param(
    [switch]$Quick = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host "
使用方法：
    .\build-apk.ps1              # 完整构建流程
    .\build-apk.ps1 -Quick       # 快速构建（跳过 npm install）
    .\build-apk.ps1 -Help        # 显示此帮助信息

完整流程包括：
    1. npm install
    2. npm run build
    3. npx cap sync android
    4. gradle assembleRelease
"
    exit 0
}

$ErrorActionPreference = "Stop"

Write-Host "=== Snaptext APK 构建脚本 ===" -ForegroundColor Green
Write-Host ""

# 检查必需的工具
function Check-Command {
    param($Command)
    try { 
        $null = & $Command --version 2>&1
        return $true 
    } catch { 
        return $false 
    }
}

Write-Host "检查必需工具..." -ForegroundColor Yellow
if (-not (Check-Command "node")) {
    Write-Host "❌ Node.js 未找到！请先安装 Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js 已安装"

if (-not (Check-Command "java")) {
    Write-Host "❌ Java 未找到！请先安装 Java 17+" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Java 已安装"

# 第一步：安装依赖
if (-not $Quick) {
    Write-Host "`n[1/5] 安装 npm 依赖..." -ForegroundColor Cyan
    npm ci
} else {
    Write-Host "`n[1/5] 跳过 npm install (-Quick)" -ForegroundColor Gray
}

# 第二步：构建 Web 应用
Write-Host "`n[2/5] 构建 Web 应用..." -ForegroundColor Cyan
npm run build

# 第三步：初始化或同步 Capacitor
Write-Host "`n[3/5] 同步 Capacitor..." -ForegroundColor Cyan
if (-not (Test-Path "capacitor-android")) {
    Write-Host "首次构建，初始化 Capacitor..."
    npx cap init
    npx cap add android
} else {
    npx cap sync android
}

# 第四步：生成签名密钥（如果不存在）
Write-Host "`n[4/5] 检查签名密钥..." -ForegroundColor Cyan
if (-not (Test-Path "keystore")) {
    New-Item -ItemType Directory -Path "keystore" | Out-Null
}

$keystorePath = "keystore\snaptext.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "生成新的签名密钥..."
    $keyPath = (Get-Item "keystore").FullName
    $keytoolPath = "C:\Program Files\Java\jdk-17\bin\keytool.exe"
    & $keytoolPath -genkey -v `
        -keystore "$keystorePath" `
        -alias snaptext `
        -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass snaptext123 `
        -keypass snaptext123 `
        -dname "CN=Snaptext,O=Snaptext,C=US"
} else {
    Write-Host "✓ 密钥库已存在"
}

# 第五步：构建 APK
Write-Host "`n[5/5] 构建 Android APK..." -ForegroundColor Cyan
Push-Location "capacitor-android"

$env:STORE_FILE = "..\keystore\snaptext.keystore"
$env:STORE_PASSWORD = "snaptext123"
$env:KEY_ALIAS = "snaptext"
$env:KEY_PASSWORD = "snaptext123"

.\gradlew.bat assembleRelease `
    -DSTORE_FILE="$env:STORE_FILE" `
    -DSTORE_PASSWORD="$env:STORE_PASSWORD" `
    -DKEY_ALIAS="$env:KEY_ALIAS" `
    -DKEY_PASSWORD="$env:KEY_PASSWORD" `
    --stacktrace

Pop-Location

# 收集 APK
Write-Host "`n[完成] 收集输出文件..." -ForegroundColor Green
$apkPath = "capacitor-android\app\build\outputs\apk\release\app-release.apk"

if (Test-Path $apkPath) {
    New-Item -ItemType Directory -Path "output" -Force | Out-Null
    Copy-Item $apkPath -Destination "output\snaptext.apk" -Force
    Write-Host "✓ APK 已保存到: output\snaptext.apk" -ForegroundColor Green
    Write-Host "`n文件信息:" -ForegroundColor Yellow
    Get-Item "output\snaptext.apk" | Format-List Name, @{N='大小(MB)';E={[math]::Round($_.Length/1MB, 2)}}
} else {
    Write-Host "❌ APK 未找到！构建可能失败" -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ 构建完成！" -ForegroundColor Green
Write-Host "下一步：使用 adb 安装到手机或模拟器" -ForegroundColor Yellow
Write-Host "  adb install output\snaptext.apk" -ForegroundColor Gray
