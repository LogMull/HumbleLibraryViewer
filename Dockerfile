# Base image with Node.js
FROM node:22

# Install required packages
# Xvfb is a virtual framebuffer to run Electron without a display (for headless environments)
RUN apt-get update && \
    apt-get install -y \
    xvfb \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libxrandr2 \
    libasound2 \
    libatk1.0-0 \
    libpangocairo-1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json files for dependency installation
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the app files
COPY . .

# Build the application if necessary (uncomment if using Vue/React build scripts)
# RUN npm run build

# Set environment variables if needed (example)
ENV DISPLAY=:99

# Expose any ports if the app has a web-based component (optional)
EXPOSE 8080 

# Start the Electron application in a virtual framebuffer
#CMD ["xvfb-run", "--auto-servernum", "yarn", "start"]
CMD ["yarn", "start"]
