# SIH 2025 Project Repository

This repository contains two main projects for the Smart India Hackathon 2025:

## 1. Attendify
A cross-platform attendance management system built with Flutter. It supports facial verification, faculty and student dashboards, and seamless integration with Firebase for authentication and data storage.

### Key Features
- Facial verification for secure attendance
- Faculty and student dashboards
- Class scheduling and attendance tracking
- Firebase integration
- Multi-platform support (Android, iOS, Web, Desktop)

### Folder Structure
- `lib/` - Main Flutter/Dart source code
- `assets/` - Images and static assets
- `android/`, `ios/`, `web/`, `linux/`, `macos/`, `windows/` - Platform-specific code

## 2. Upastithi Web
A modern web application built with React and TypeScript for managing and visualizing attendance data. Designed for web-based dashboards and admin interfaces.

### Key Features
- Real-time attendance visualization
- Admin and faculty management
- Integration with Firebase
- Responsive UI with React

### Folder Structure
- `src/` - Main React/TypeScript source code
- `public/` - Static assets and HTML

## Getting Started

### Prerequisites
- [Git](https://git-scm.com/)
- [Flutter SDK](https://flutter.dev/docs/get-started/install) (for Attendify)
- [Node.js & npm](https://nodejs.org/) (for Upastithi Web)

### Cloning the Repository
```sh
git clone https://github.com/Chinmay048/SIH_2025_PB_25016.git
cd SIH_2025_PB_25016
```

### Running Attendify (Flutter)
```sh
cd attendify
flutter pub get
flutter run
```

### Running Upastithi Web (React)
```sh
cd upastithi-web
npm install
npm run dev
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.
