FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
