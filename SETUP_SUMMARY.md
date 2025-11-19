# Setup Summary - Frontend & Backend Running

## ✅ Issues Fixed

### 1. **Network Connection Error**
- **Problem**: Frontend couldn't connect to backend (localhost vs device IP)
- **Solution**: Updated `lib/api.ts` to use your local IP address `192.168.0.232:4000`

### 2. **Backend Database Errors**
- **Problem**: Drizzle ORM was using incorrect query format
- **Solution**: Refactored `backend/data/store.js` to use proper Drizzle ORM methods

### 3. **Schema Mismatch**
- **Problem**: Backend schema didn't match Supabase database structure
- **Solution**: Updated `backend/db/schema.js` to align with your Supabase migration

### 4. **Port Conflicts**
- **Problem**: Multiple node processes running on port 4000
- **Solution**: Killed all node processes and restarted cleanly

## 🚀 Current Status

### Backend
- **Running on**: `http://localhost:4000` (local) and `http://192.168.0.232:4000` (network)
- **Database**: Connected via Drizzle ORM to PostgreSQL
- **Status**: ✅ Running successfully

### Frontend
- **Running on**: `exp://192.168.0.232:8081`
- **Web**: `http://localhost:8081`
- **API Connection**: Points to `http://192.168.0.232:4000`
- **Status**: ✅ Running successfully

## 📁 Project Structure

```
CSE299-frontend/
├── backend/                    # Backend API (Express + Drizzle)
│   ├── data/store.js          # Database operations
│   ├── db/
│   │   ├── client.js          # Drizzle client
│   │   └── schema.js          # Database schema
│   ├── routes/                # API routes
│   └── server.js              # Express server
├── lib/
│   ├── api.ts                 # Frontend API client (connects to backend)
│   └── supabase.ts            # Supabase client (for direct DB access if needed)
├── supabase/
│   └── migrations/            # Supabase SQL migrations
└── app/                       # React Native app
```

## 🔧 How to Run

### Start Backend
```bash
cd backend
npm run dev
```
Backend will run on port 4000

### Start Frontend
```bash
npx expo start
```
Frontend will run on port 8081

## 📝 Important Notes

1. **Supabase vs Backend Auth**:
   - Your app has TWO authentication systems:
     - `lib/supabase.ts` - Direct Supabase auth (for frontend)
     - `backend/routes/auth.js` - Custom backend auth with `users` table
   - Currently using backend auth via `lib/api.ts`

2. **Database Tables**:
   - Supabase has: `profiles`, `devices`, `cry_events`, `alert_settings`, `notifications`
   - Backend added: `users`, `monitoring`

3. **Network Access**:
   - Your local IP: `192.168.0.232`
   - Make sure your phone/device is on the same WiFi network
   - Backend must be accessible at `http://192.168.0.232:4000`

## 🧪 Testing

Try signing up in your app now. The flow should be:
1. Frontend sends request to `http://192.168.0.232:4000/auth/register`
2. Backend creates user in `users` table
3. Backend returns JWT token
4. Frontend stores token and logs in

## 🐛 Troubleshooting

If signup still fails:
1. Check backend terminal for errors
2. Verify database connection in backend
3. Test backend directly: `curl http://192.168.0.232:4000/health`
4. Check if `users` table exists in your database
