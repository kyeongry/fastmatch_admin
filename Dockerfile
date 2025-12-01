FROM node:18-slim

# Puppeteer/Chromium 의존성 설치
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    fonts-noto-cjk \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer 환경변수
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# 패키지 파일 복사 및 설치 (backend 폴더에서)
COPY backend/package*.json ./
RUN npm install --production

# 백엔드 소스 코드 복사
COPY backend/ ./

# 디버그: pdfform 폴더 확인
RUN echo "=== Build time directory check ===" && \
    ls -la && \
    echo "=== pdfform folder ===" && \
    ls -la pdfform/ || echo "pdfform not found" && \
    echo "=== pdfform/templates ===" && \
    ls -la pdfform/templates/ || echo "templates not found"

# 포트 노출
EXPOSE 5000

# 시작 명령
CMD ["npm", "start"]
