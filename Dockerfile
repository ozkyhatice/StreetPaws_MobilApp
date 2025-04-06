# Use Node.js LTS version as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the default Expo port
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002
EXPOSE 8081

# Start the Expo development server
CMD ["npm", "start"]
