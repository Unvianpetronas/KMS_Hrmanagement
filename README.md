# 📚 HR Knowledge Hub - KMS Lite
## Hệ thống quản lý tri thức HR: Onboarding & Policy

---

## 🏗️ Kiến trúc hệ thống

```
┌──────────────────────────────────────────────────────┐
│                    AWS Cloud                          │
│                                                      │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────┐ │
│  │  CloudFront  │───▶│  S3 Bucket   │    │  RDS    │ │
│  │  (CDN)       │    │  (React App) │    │ (MySQL) │ │
│  └─────────────┘    └──────────────┘    └────┬────┘ │
│         │                                     │      │
│         │           ┌──────────────┐          │      │
│         └──────────▶│ EC2 / ECS    │──────────┘      │
│                     │ (Spring Boot)│                  │
│                     │  Port 8080   │                  │
│                     └──────────────┘                  │
└──────────────────────────────────────────────────────┘
```

### Tech Stack
| Layer     | Technology          | Purpose                    |
|-----------|--------------------|-----------------------------|
| Frontend  | React 18 + Vite    | Single Page Application     |
| Backend   | Spring Boot 3.2    | REST API + Business Logic   |
| Database  | H2 (dev) / MySQL (prod) | Data persistence       |
| Deploy    | AWS EC2/ECS + S3 + RDS | Cloud hosting           |

---

## 📁 Cấu trúc dự án

```
hr-kms-project/
├── backend/                          # Spring Boot API
│   ├── src/main/java/com/hrkms/
│   │   ├── HrKmsApplication.java     # Main entry point
│   │   ├── config/
│   │   │   └── AppConfig.java        # CORS + Data initializer (15 items)
│   │   ├── controller/
│   │   │   └── KnowledgeItemController.java  # REST endpoints
│   │   ├── model/
│   │   │   ├── KnowledgeItem.java    # Entity: Policy/FAQ/Checklist
│   │   │   ├── Comment.java          # Entity: User comments
│   │   │   └── DTO.java             # Request/Response DTOs
│   │   ├── repository/
│   │   │   ├── KnowledgeItemRepository.java
│   │   │   └── CommentRepository.java
│   │   └── service/
│   │       └── KnowledgeItemService.java  # Business logic
│   ├── src/main/resources/
│   │   └── application.properties    # Config (dev/prod)
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   └── src/services/api.js           # API client service
└── README.md
```

---

## 🚀 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/items?sort=updated` | Lấy tất cả bài tri thức |
| `GET` | `/api/v1/items/{id}` | Xem chi tiết 1 bài |
| `POST` | `/api/v1/items` | Tạo bài mới |
| `PUT` | `/api/v1/items/{id}` | Cập nhật bài |
| `DELETE` | `/api/v1/items/{id}` | Xóa bài |
| `GET` | `/api/v1/items/search?q=&type=&tags=&sort=` | Tìm kiếm + lọc |
| `POST` | `/api/v1/items/{id}/rate` | Đánh giá sao |
| `POST` | `/api/v1/items/{id}/comments` | Thêm bình luận |
| `GET` | `/api/v1/stats` | Thống kê tổng quan |

---

## 🖥️ Chạy Local (Development)

### Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
# API running at http://localhost:8080
# H2 Console at http://localhost:8080/h2-console
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

### Test API nhanh
```bash
# Lấy tất cả items
curl http://localhost:8080/api/v1/items

# Tìm kiếm
curl "http://localhost:8080/api/v1/items/search?q=leave&type=Policy"

# Tạo mới
curl -X POST http://localhost:8080/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Policy","type":"Policy","tags":["benefit"],"content":"Test content","author":"Admin"}'

# Đánh giá
curl -X POST http://localhost:8080/api/v1/items/POL-001/rate \
  -H "Content-Type: application/json" \
  -d '{"stars": 5}'

# Comment
curl -X POST http://localhost:8080/api/v1/items/POL-001/comments \
  -H "Content-Type: application/json" \
  -d '{"userName":"Test User","text":"Great policy!"}'
```

---

## ☁️ Deploy lên AWS

### Option A: EC2 (Đơn giản nhất cho môn học)

#### Bước 1: Tạo EC2 Instance
```bash
# 1. AWS Console → EC2 → Launch Instance
# - AMI: Amazon Linux 2023
# - Instance type: t2.micro (Free Tier)
# - Security Group: mở port 22 (SSH), 80 (HTTP), 8080 (API), 3000 (React dev)
# - Key pair: tạo mới hoặc dùng existing

# 2. SSH vào EC2
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

#### Bước 2: Cài đặt Java + Node.js trên EC2
```bash
# Install Java 17
sudo yum install -y java-17-amazon-corretto-devel

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Maven
sudo yum install -y maven

# Install Git
sudo yum install -y git

# Verify
java -version
node -v
mvn -v
```

#### Bước 3: Clone & Build Backend
```bash
# Upload project hoặc clone từ GitHub
cd /home/ec2-user
git clone <your-github-repo> hr-kms
cd hr-kms/backend

# Build
mvn clean package -DskipTests

# Run (background)
nohup java -jar target/hr-kms-backend-1.0.0.jar \
  --server.port=8080 \
  > /home/ec2-user/backend.log 2>&1 &

# Check
curl http://localhost:8080/api/v1/stats
```

#### Bước 4: Build & Serve Frontend
```bash
cd /home/ec2-user/hr-kms/frontend

# Set API URL
echo "REACT_APP_API_URL=http://<EC2-PUBLIC-IP>:8080/api/v1" > .env

# Install & Build
npm install
npm run build

# Serve static files (install serve globally)
sudo npm install -g serve
nohup serve -s build -l 3000 > /home/ec2-user/frontend.log 2>&1 &
```

#### Bước 5: Verify
```
Backend API:  http://<EC2-PUBLIC-IP>:8080/api/v1/items
Frontend App: http://<EC2-PUBLIC-IP>:3000
```

---

### Option B: Docker trên EC2

```bash
# Install Docker
sudo yum install -y docker
sudo service docker start
sudo usermod -aG docker ec2-user

# Build & Run Backend
cd backend
docker build -t hr-kms-backend .
docker run -d -p 8080:8080 --name backend hr-kms-backend

# Build & Run Frontend
cd ../frontend
docker build -t hr-kms-frontend .
docker run -d -p 3000:3000 --name frontend hr-kms-frontend
```

---

### Option C: AWS Elastic Beanstalk (Production-ready)

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
cd backend
eb init hr-kms-app --platform java-17 --region ap-southeast-1

# 3. Create environment
eb create hr-kms-prod --instance-type t2.micro

# 4. Deploy
mvn clean package -DskipTests
eb deploy

# 5. Frontend → S3 + CloudFront
cd ../frontend
npm run build
aws s3 sync build/ s3://hr-kms-frontend --delete
```

---

### Kết nối RDS MySQL (Production DB)

```bash
# 1. AWS Console → RDS → Create Database
# - Engine: MySQL 8.0
# - Instance: db.t3.micro (Free Tier)
# - DB name: hrkms
# - Master username: admin
# - Password: <your-password>
# - Public access: No (same VPC as EC2)

# 2. Update application.properties
spring.profiles.active=prod
spring.datasource.url=jdbc:mysql://<RDS-ENDPOINT>:3306/hrkms
spring.datasource.username=admin
spring.datasource.password=<your-password>
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# 3. Hoặc dùng environment variables
export DB_URL=jdbc:mysql://<RDS-ENDPOINT>:3306/hrkms
export DB_USERNAME=admin
export DB_PASSWORD=<your-password>
```

---

## 📊 Dataset Summary (15 items)

| Type | Count | IDs |
|------|-------|-----|
| Policy (SOP) | 6 | POL-001 → POL-006 |
| FAQ | 4 | FAQ-001 → FAQ-004 |
| Checklist | 5 | CHK-001 → CHK-005 |

### Tags coverage
`leave` · `benefit` · `contract` · `payroll` · `tax` · `onboarding` · `working_time` · `behavior`

---

## 🔄 KM Process Flow

```
Capture → Store → Find → Share → Reuse/Improve
   │         │       │       │         │
   ▼         ▼       ▼       ▼         ▼
 Form    Database  Search  Share URL  Rating &
 Create  + Tags   + Filter + Export   Comments
 (Author) (System) (User)  (User)   (User/Author)
```

---

## 📝 MVP Features Checklist

- [x] ✅ Trang tạo bài (Create Form) — Policy, FAQ, Checklist templates
- [x] ✅ Trang repository list — Grid cards với metadata
- [x] ✅ Trang chi tiết — Render riêng cho từng loại bài
- [x] ✅ Search — Full-text search theo tiêu đề, nội dung, ID
- [x] ✅ Filter — Lọc theo loại (Policy/FAQ/Checklist) + tags
- [x] ✅ Rating — Đánh giá sao 1-5
- [x] ✅ Comment — Bình luận trên từng bài
- [x] ✅ Interactive Checklist — Checkbox + progress bar
- [x] ✅ Related Items — Navigation giữa các bài liên quan
- [x] ✅ Sort — Theo ngày cập nhật, rating, A-Z

---

## 👥 Team & Contribution

| Member | Role | Tasks | % |
|--------|------|-------|---|
| | | | |

---

*HR Knowledge Hub © 2025 — Built with Spring Boot + React*
# KMS_Hrmanagement
