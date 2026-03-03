Download Roboto Condensed font files and place them here.

Expected files (woff2 preferred):
- RobotoCondensed-Regular.woff2
- RobotoCondensed-Bold.woff2
- RobotoCondensed-Light.woff2

You can download from Google Fonts (https://fonts.google.com/specimen/Roboto+Condensed) or use the following commands to fetch woff2 builds manually (example):

# Linux / macOS example using curl
# Replace VERSION_URL with the actual woff2 file URL from Google or your vendor
# curl -L -o RobotoCondensed-Regular.woff2 "<woff2_url_for_regular>"

After placing the files, rebuild the app. The app's CSS references these files at `/src/assets/fonts/RobotoCondensed-*.woff2`.
