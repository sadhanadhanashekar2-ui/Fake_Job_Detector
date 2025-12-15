FROM node:18-alpine

WORKDIR /app

# Install SQLite dependencies
RUN apk add --no-cache sqlite

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Initialize SQLite database
RUN node src/config/init-db.js

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fakejob -u 1001

# Change ownership
RUN chown -R fakejob:nodejs /app

USER fakejob

EXPOSE 5000

CMD ["npm", "start"]