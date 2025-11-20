
# GeuseIV (Neo-Sprite Chat 3D)

A futuristic, immersive 3D web experience featuring a hardware-accelerated CSS3D particle system and a "Liquid Glass" chat interface. This project blends **Three.js**, **React**, and advanced **Tailwind CSS** styling to create a unique visual aesthetic combining Glassmorphism, Neumorphism, and Neobrutalism.

## 🌟 Features

### 3D Background System
- **Engine**: Built on `Three.js` using the `CSS3DRenderer` to manipulate 512 HTML DOM elements in 3D space.
- **Geometries**: Supports multiple geometric transitions:
  - **Plane**: Sinusoidal wave surface.
  - **Cube**: 8x8x8 volume grid.
  - **Sphere**: Spherical coordinate distribution.
  - **Spiral**: Conical 3D spiral.
  - **Fibonacci**: Golden angle spherical distribution.
  - **Random**: Chaotic distribution.
- **Animation**:
  - "Breathing" scale animation synced to coordinate positions.
  - Dynamic speed adjustment based on theme (Slower/Hypnotic in Dark Mode).
  - **Camera Integration**: The camera smoothly zooms out (dolly effect) when the chat window opens to frame the UI.

### UI / UX (iOS26 Concept)
- **Aesthetic**: "Liquid Glass" — High transparency, backdrop blur, and subtle borders replacing solid backgrounds.
- **Chat Interface**:
  - **Floating Modal**: Draggable-style fixed position widget.
  - **Header**: "Dynamic Island" inspired with traffic light controls and typewriter contact link.
  - **Visuals**: Mixed styling with Neobrutalist hard shadows on glass substrates.
  - **Controls**: Integrated "Send" button inside the input field with Neumorphic pressed states.
- **Themes**: Fully responsive Light/Dark mode toggled via a Neumorphic switch.

### Integration
- **Chatbot**: Connected to `n8n` workflow via Webhook.
- **Contact**: Direct "Typewriter" style mailto link for Geuse.io inquiries.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript
- **3D**: Three.js (CSS3DRenderer)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## 🚀 Development Guide (Cursor IDE)

This project is optimized for development in **Cursor**.

### 1. Clone & Setup
Clone the repository to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/GeuseIV.git
cd GeuseIV
```

### 2. Install Dependencies
Install the required packages (Three.js, React, Tailwind, Tween.js):

```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory to configure the webhook:

```env
VITE_WEBHOOK_URL=https://n8n.geuse.io/webhook/5bdd4f4f-81fc-459b-a294-8fb800514dfb
```

### 4. Running Locally
Start the development server:

```bash
npm run dev
```

## ☁️ Deployment (AWS S3)

This project is designed to be hosted as a static site on AWS S3.

### Build
Generate the production-ready static files:

```bash
npm run build
```
*This creates a `dist` folder containing optimized HTML, CSS, and JS.*

### S3 Hosting Steps
1. **Create Bucket**: Create a new S3 bucket (e.g., `chat.geuse.io`).
2. **Properties**: Enable "Static website hosting" in the bucket properties.
3. **Permissions**:
   - Uncheck "Block all public access".
   - Add a Bucket Policy for public read access:
     ```json
     {
         "Version": "2012-10-17",
         "Statement": [
             {
                 "Sid": "PublicReadGetObject",
                 "Effect": "Allow",
                 "Principal": "*",
                 "Action": "s3:GetObject",
                 "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
             }
         ]
     }
     ```
4. **Upload**: Upload the contents of the `dist` folder to the root of the bucket.

### HTTPS (Recommended)
For a production-grade "Liquid Glass" experience, serve the S3 bucket via **AWS CloudFront** to enable HTTPS and faster global content delivery.

## 📄 License

[MIT](LICENSE)
