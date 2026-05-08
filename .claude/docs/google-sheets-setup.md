# Google Sheets OAuth2 Setup

## Step 1: Tạo OAuth 2.0 Client ID

1. Vào **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Ở mục **Authorized redirect URIs**, thêm:
   ```
   https://developers.google.com/oauthplayground
   ```
5. Click **Create** → copy **Client ID** và **Client Secret**

## Step 2: Lấy Refresh Token từ OAuth Playground

1. Vào https://developers.google.com/oauthplayground/
2. Click **icon gear (⚙️ Settings)** ở góc trên bên phải:
   - Check ✅ **"Use your own OAuth credentials"**
   - Nhập **Client ID** và **Client Secret**
   - Click **Close**
3. Ở panel bên trái (**Step 1**):
   - Cuộn xuống tìm **"Google Sheets API v4"** → mở rộng
   - Check ✅ `https://www.googleapis.com/auth/spreadsheets`
   - Click nút **"Authorize APIs"**
4. Đăng nhập Google account → cho phép quyền truy cập
   - Nếu thấy cảnh báo "This app isn't verified", click **"Advanced"** → **"Go to ... (unsafe)"**
5. Ở **Step 2**, click **"Exchange authorization code for tokens"**
   - Copy giá trị **Refresh token** (chuỗi dài bắt đầu bằng `1//...`)

## Step 3: Cấu hình `.env`

```
GOOGLE_CLIENT_ID=<your client id>
GOOGLE_CLIENT_SECRET=<your client secret>
GOOGLE_REFRESH_TOKEN=<refresh token từ Step 2>
GOOGLE_SHEET_ID=<spreadsheet ID từ URL>
```

> **Lưu ý:** Nếu OAuth consent screen đang ở mode **"Testing"**, vào **APIs & Services → OAuth consent screen → Test users** và thêm email Google của bạn.
