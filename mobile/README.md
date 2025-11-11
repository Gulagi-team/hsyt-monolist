# HoSoYTE Mobile

React Native (Expo) client that mirrors the core functionality of the HoSoYTE web application.

## Features (Parity Targets)

- **Authentication**: Email/password login, secure token storage.
- **Dashboard**: Quick health overview, recent uploads, shortcuts to analysis tools.
- **Medical Record History**: Paginated list of records, detail view, AI summary, delete & share actions.
- **Record Upload** (planned): Capture from camera or pick document, send to backend for analysis.

## Tech Stack

- **React Native + Expo** (managed workflow)
- **Navigation**: `@react-navigation/native` + native stack
- **State**: React hooks + Zustand store for auth/session/records
- **Networking**: Fetch API with shared service layer (`src/services`)
- **Secure Storage**: `expo-secure-store` for auth token

## Project Structure

```
mobile/
├── app.json           # Expo config
├── package.json       # Dependencies & scripts
├── src/
│   ├── App.tsx        # Entry point
│   ├── navigation/
│   │   ├── index.tsx  # Root navigator combining auth + app stacks
│   │   └── AuthNavigator.tsx / AppNavigator.tsx
│   ├── screens/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── History/
│   │   └── RecordDetail/
│   ├── components/
│   ├── services/      # API clients (authService, analysisService)
│   └── store/         # Zustand slices (auth, records)
└── assets/
    ├── icon.png
    └── splash.png
```

## Development

```bash
cd mobile
npm install
npm run start     # choose platform in Expo dev tools
```

Set environment variables in `.env` (mirrors web):
```
API_BASE_URL=https://your-backend/api
```

### Linting
```
npm run lint
```

## TODO
- [ ] Bootstrap `src` folder with navigation skeleton
- [ ] Implement auth flow using backend API
- [ ] Mirror dashboard widgets & history cards
- [ ] Add record upload (camera + document picker)
- [ ] Ensure feature parity with web analytics & sharing flows
```
