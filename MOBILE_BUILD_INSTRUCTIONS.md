# Nexus Mobile Build (Capacitor)

The project has been prepared for Android compilation using Capacitor.

## Android Project Location
The native Android project is located in the `android/` directory.

## How to build the .aab file:
To complete the compilation and generate the `.aab` (Android App Bundle), you will need to open the `android/` folder in **Android Studio** on your local machine, as the remote environment lacks the full Android SDK and Java setup required for Gradle compilation.

1. Download the project zip from Replit.
2. Open the `android` folder in Android Studio.
3. Go to **Build > Generate Signed Bundle / APK...**
4. Follow the prompts to sign your app and generate the `.aab` file.

The API endpoints and keys (OpenRouter) are configured in the server code and will work as long as the backend is running or reachable.