FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (change if your backend uses a different port)
EXPOSE 3000

# Command to run the application
CMD ["node", "index.js"]