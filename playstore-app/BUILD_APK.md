# 构建 Snaptext APK 指南

## 方案 1：自动化（GitHub Actions）- 推荐

### 步骤：

1. **提交代码到 GitHub**
   ```bash
   git add .
   git commit -m "Add updated Snaptext with real download features"
   git push origin main
   ```

2. **触发构建**
   - 进入 GitHub 仓库
   - 点击 **Actions** 标签
   - 找到 **Build Snaptext APK** workflow
   - 点击 **Run workflow** > **Run workflow**

3. **下载 APK**
   - 等待构建完成（约 10-15 分钟）
   - 点击工作流运行
   - 在 **Artifacts** 部分下载 `snaptext-apk`

---

## 方案 2：本地构建 - 手动

### 前置需求：

- **JDK 17** 或更高版本
- **Android SDK** (API 35+)
- **Node.js 18+**
- **Gradle**

### Windows 系统步骤：

1. **安装 Java 17**
   ```bash
   # 使用 chocolatey
   choco install openjdk17
   ```

2. **安装 Android Studio**（包含 SDK）
   - 下载：https://developer.android.com/studio
   - 安装并启动 Android Studio
   - 设置 ANDROID_HOME 环境变量

3. **清理并重新初始化**
   ```bash
   cd c:\Users\User\Desktop\AIgames\playstore-app
   
   # 清理旧的构建文件
   rm -r node_modules dist capacitor-android
   
   # 重新安装依赖
   npm install
   
   # 构建 Web 应用
   npm run build
   ```

4. **初始化或同步 Capacitor**
   ```bash
   # 如果没有 capacitor-android 目录
   npx cap init
   npx cap add android
   
   # 或同步现有项目
   npx cap sync android
   ```

5. **生成签名密钥（首次需要）**
   ```bash
   mkdir keystore
   cd keystore
   keytool -genkey -v ^
     -keystore snaptext.keystore ^
     -alias snaptext ^
     -keyalg RSA -keysize 2048 -validity 10000 ^
     -storepass snaptext123 ^
     -keypass snaptext123 ^
     -dname "CN=Snaptext,O=Snaptext,C=US"
   cd ..
   ```

6. **构建 APK**
   ```bash
   cd capacitor-android
   gradlew.bat assembleRelease ^
     -DSTORE_FILE=../keystore/snaptext.keystore ^
     -DSTORE_PASSWORD=snaptext123 ^
     -DKEY_ALIAS=snaptext ^
     -DKEY_PASSWORD=snaptext123
   ```

7. **收集输出文件**
   ```bash
   # APK 位置
   # capacitor-android\app\build\outputs\apk\release\app-release.apk
   ```

---

## 方案 3：使用 Android Studio GUI

1. 打开 `capacitor-android` 目录
2. File > Open > 选择 `capacitor-android`
3. Build > Generate Signed Bundle / APK
4. 选择 APK
5. 使用 `keystore\snaptext.keystore`
6. 密码：`snaptext123`
7. 构建完成后在 `app/release` 目录找到 APK

---

## 常见问题

### Q: 如何测试 APK？
```bash
# 连接手机或启动模拟器
adb install capacitor-android\app\build\outputs\apk\release\app-release.apk
```

### Q: 如何更新现有应用？
- 每次修改代码后：
  ```bash
  npm run build
  npx cap sync android
  # 然后重新执行构建 APK 步骤
  ```

### Q: APK 太大怎么办？
- 生成 AAB（Android App Bundle）：
  ```bash
  cd capacitor-android
  gradlew.bat bundleRelease -DSTORE_FILE=../keystore/snaptext.keystore ...
  ```

### Q: 如何发布到 Google Play Store？
1. 上传 AAB 文件到 Google Play Console
2. 填写应用信息和权限
3. 进行审核
4. 发布

---

## 密钥信息

- **密钥库位置**：`keystore/snaptext.keystore`
- **密钥别名**：`snaptext`
- **密钥库密码**：`snaptext123`
- **密钥密码**：`snaptext123`

⚠️ **重要**：不要将密钥库文件提交到公开仓库！将 `keystore/` 加入 `.gitignore`
