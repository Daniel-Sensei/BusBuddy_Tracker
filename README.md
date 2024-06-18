# BusBuddy Tracker: The Bus Tracking Engine

## Introduction
BusBuddy Tracker is an integral part of the BusBuddy real-time bus tracking system, developed as an undergraduate thesis project in Computer Science at the University of Calabria. This tracker application complements the BusBuddy Client app by providing real-time updates on bus locations and stops, ensuring accurate and timely information for passengers.

The project consists of two main components:
1. **Client app** (https://github.com/Daniel-Sensei/BusBuddy.git)
2. **Tracker app** (this repository)

## Screenshots
### White Theme
<img src="https://github.com/Daniel-Sensei/BusBuddy_Tracker/assets/132211678/5e819eab-1338-4fa2-925f-51f3ee2911e6" width="250">
<img src="https://github.com/Daniel-Sensei/BusBuddy_Tracker/assets/132211678/584742c6-dd40-4d5b-8ad5-4e30bcbfdb2c" width="250">
<img src="https://github.com/Daniel-Sensei/BusBuddy_Tracker/assets/132211678/15f1c701-28c8-4f9f-8125-07896715fb0a" width="250">

### Dark Theme
<img src="https://github.com/Daniel-Sensei/BusBuddy_Tracker/assets/132211678/7e746bc3-f56c-4ab1-b729-1e578487f510" width="250">
<img src="https://github.com/Daniel-Sensei/BusBuddy_Tracker/assets/132211678/577f5c61-3937-48f3-b07e-47a6a7432513" width="250">
<img src="https://github.com/Daniel-Sensei/BusBuddy_Tracker/assets/132211678/8d48553a-3ad3-46f2-9a79-619030aa2d0c" width="250">


## Features
- **Automatic stops detection**: Detects when a bus reaches a stop and updates the server automatically.
- **Background tracking**: Continues to track bus location even when the app is in the background (Android only).
- **Real-time updates**: Constant communication with the real-time database to keep bus positions updated.
- **Secure access**: Requires company credentials (email and password) and bus code to use the app.

## Technical Details
- **Tracker App**: Built using Ionic Framework with Angular, optimized for Android using a specific plugin for background functionality.
- **Backend Server**: Communicates with the SpringBoot server from the BusBuddy Client app.
- **Database**: Utilizes Firebase for real-time updates, ensuring accurate and timely information.

## Installation
To install and run the application, follow these steps:

### Prerequisites
- Node.js (which includes npm)
- Angular CLI
- Ionic CLI

### Steps
1. **Clone the repository**:
```shell
git clone https://github.com/Daniel-Sensei/BusBuddy_Tracker.git
cd BusBuddy_Tracker
```

2. **Install dependencies**:
```
npm install
```

3. **Run the application**:
 ```
 ionic serve
 ```
This command serves the app in the browser for development purposes. For full functionality, especially background tracking, the app needs to be tested on an Android device.

## Author
- [Curcio Daniel](https://github.com/Daniel-Sensei)

---

Feel free to use and modify this application to suit your transportation needs. For any issues or contributions, please visit the repository and submit your queries or pull requests.
