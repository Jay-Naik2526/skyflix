# 1. Use Node 20
FROM node:20-slim

# 2. Set working directory inside the container
WORKDIR /app

# 3. Copy package files FROM the server subfolder
COPY stream-hub/server/package*.json ./

# 4. Install only backend dependencies
RUN npm install --production

# 5. Copy all backend files FROM the subfolder to the container
COPY stream-hub/server/ .

# 6. Set HF default port (7860)
ENV PORT=7860
EXPOSE 7860

# 7. Start the backend
CMD ["node", "index.js"]