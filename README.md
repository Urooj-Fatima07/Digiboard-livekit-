# Real-Time Collaborative Whiteboard Application

## Overview
This document provides an overview of the real-time collaborative whiteboard application built using React and LiveKit. The application enables multiple users to draw on a shared canvas in real-time and includes various features such as drawing tools, real-time collaboration, user management, and advanced features like undo/redo, zoom, and pan.

## Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [Key Features](#key-features)
3. [Usage Instructions](#usage-instructions)
4. [Challenges and Solutions](#challenges-and-solutions)
5. [Future Enhancements](#future-enhancements)
6. [Demo](#demo)

## 1. Setup Instructions

### 1.1 Prerequisites
- **LiveKit Account**: Sign up for a LiveKit account and create a new project to obtain your API keys.
- **Node.js**: Ensure you have Node.js installed (recommended version: 18.x or later).

### 1.2 Install LiveKit Client Library
Install the LiveKit client library using npm:

```bash
npm install @livekit/client
```

1.3 Create a React Project
Initialize a new React project using Create React App or a similar tool:

``` bash
npx create-react-app collaborative-whiteboard
cd collaborative-whiteboard
```
1.4 Install Additional Dependencies
Install required dependencies:

``` bash

npm install react-konva konva @livekit/client
```
1.5 Configure Environment Variables
Create a .env file in the root directory of your project and add your LiveKit API key and URL:

```
REACT_APP_LIVEKIT_URL=<YOUR_LIVEKIT_URL>
REACT_APP_LIVEKIT_API_KEY=<YOUR_LIVEKIT_API_KEY>
REACT_APP_LIVEKIT_API_SECRET=<YOUR_LIVEKIT_API_SECRET>
```

## **2. Key Features** <br>
**2.1 Drawing Tools** <br>
- *Brush Tool:* Allows users to draw freehand on the canvas. <br>
- *Color Picker:* Lets users choose different colors for drawing.<br>
- *Line Width:* Users can adjust the width of the lines.<br> <br>
**2.2 Real-Time Collaboration**<br>
- *LiveKit Integration:* Synchronizes drawing actions across all connected users in real-time.<br>
- *Participant Management:* Displays a list of online collaborators.<br><br>
**2.3 Advanced Features**<br>
- *Zoom and Pan:* Allows users to zoom in/out and pan around the canvas.<br>
- *Undo/Redo:* Features for undoing and redoing drawing actions.<br>
- *Save and Load:* Users can save their whiteboard session and load previously saved sessions.<br><br>
## **3. Usage Instructions**<br>
**3.1 Running the Application**<br>
- *Start the development server:*<br>

``` bash
npm run dev
Navigate to http://localhost:3000 in your browser to access the whiteboard application.
```
**3.2 Drawing on the Canvas**<br>
- Use the brush tool to draw on the canvas.<br>
- Select colors and adjust the brush width using the toolbar.<br><br>
**3.3 Zooming and Panning**<br>
- Use mouse wheel scrolling to zoom in and out.<br>
- Click and drag to pan around the canvas.<br><br>
**3.4 Undo/Redo**<br>
- Use the undo and redo buttons to manage drawing actions.<br><br>
**3.5 Saving and Loading Sessions**<br>
- Click the save button to save the current whiteboard state.<br>
- Use the load button to open a previously saved session.<br>
