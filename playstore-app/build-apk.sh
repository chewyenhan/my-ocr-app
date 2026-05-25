#!/bin/bash

# Bash 脚本用于构建 Snaptext APK (Linux/macOS)

set -e

QUICK=false
HELP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -q|--quick) QUICK=true; shift ;;
        -h|--help) HELP=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [ "$HELP" = true ]; then
    cat << EOF
使用方法：
    ./build-apk.sh              # 完整构建流程
    ./build-apk.sh -q           # 快速构建（跳过 npm install）
    ./build-apk.sh -h           # 显示此帮助信息

完整流程包括：
    1. npm install
    2. npm run build
    3. npx cap sync android
    4. gradle assembleRelease
EOF
    exit 0
fi

echo -e "\033[32m=== Snaptext APK 构建脚本 ===\033[0m"
echo ""

# 检查必需的工具
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "\033[31m❌ $1 未找到！\033[0m"
        return 1
    fi
    return 0
}

echo -e "\033[33m检查必需工具...\033[0m"
check_command "node" || (echo "请先安装 Node.js 18+"; exit 1)
check_command "java" || (echo "请先安装 Java 17+"; exit 1)
echo -e "\033[32m✓ 所有工具已安装\033[0m"

# 第一步：安装依赖
if [ "$QUICK" = false ]; then
    echo -e "\n\033[36m[1/5] 安装 npm 依赖...\033[0m"
    npm ci
else
    echo -e "\n\033[36m[1/5] 跳过 npm install (-q)\033[0m"
fi

# 第二步：构建 Web 应用
echo -e "\n\033[36m[2/5] 构建 Web 应用...\033[0m"
npm run build

# 第三步：初始化或同步 Capacitor
echo -e "\n\033[36m[3/5] 同步 Capacitor...\033[0m"
if [ ! -d "capacitor-android" ]; then
    echo "首次构建，初始化 Capacitor..."
    npx cap init
    npx cap add android
else
    npx cap sync android
fi

# 第四步：生成签名密钥（如果不存在）
echo -e "\n\033[36m[4/5] 检查签名密钥...\033[0m"
mkdir -p keystore

if [ ! -f "keystore/snaptext.keystore" ]; then
    echo "生成新的签名密钥..."
    keytool -genkey -v \
        -keystore keystore/snaptext.keystore \
        -alias snaptext \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass snaptext123 \
        -keypass snaptext123 \
        -dname "CN=Snaptext,O=Snaptext,C=US"
else
    echo -e "\033[32m✓ 密钥库已存在\033[0m"
fi

# 第五步：构建 APK
echo -e "\n\033[36m[5/5] 构建 Android APK...\033[0m"
cd capacitor-android

export STORE_FILE="../keystore/snaptext.keystore"
export STORE_PASSWORD="snaptext123"
export KEY_ALIAS="snaptext"
export KEY_PASSWORD="snaptext123"

chmod +x gradlew
./gradlew assembleRelease \
    -DSTORE_FILE="$STORE_FILE" \
    -DSTORE_PASSWORD="$STORE_PASSWORD" \
    -DKEY_ALIAS="$KEY_ALIAS" \
    -DKEY_PASSWORD="$KEY_PASSWORD" \
    --stacktrace

cd ..

# 收集 APK
echo -e "\n\033[32m[完成] 收集输出文件...\033[0m"
APK_PATH="capacitor-android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    mkdir -p output
    cp "$APK_PATH" "output/snaptext.apk"
    SIZE=$(du -h "output/snaptext.apk" | cut -f1)
    echo -e "\033[32m✓ APK 已保存到: output/snaptext.apk\033[0m"
    echo -e "\033[33m文件大小: $SIZE\033[0m"
else
    echo -e "\033[31m❌ APK 未找到！构建可能失败\033[0m"
    exit 1
fi

echo -e "\n\033[32m✓ 构建完成！\033[0m"
echo -e "\033[33m下一步：使用 adb 安装到手机或模拟器\033[0m"
echo -e "\033[37m  adb install output/snaptext.apk\033[0m"
