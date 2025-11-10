# Cloudflare R2 Setup Guide

## 1. Tạo Cloudflare R2 Bucket

### Bước 1: Đăng nhập Cloudflare Dashboard
1. Truy cập https://dash.cloudflare.com/
2. Đăng nhập vào tài khoản Cloudflare của bạn

### Bước 2: Tạo R2 Bucket
1. Vào **R2 Object Storage** từ sidebar
2. Click **Create bucket**
3. Nhập tên bucket (ví dụ: `medical-files-storage`)
4. Chọn region (khuyến nghị: `auto` cho tối ưu hiệu suất)
5. Click **Create bucket**

### Bước 3: Tạo API Token
1. Vào **Manage R2 API tokens**
2. Click **Create API token**
3. Chọn **Custom token**
4. Cấu hình permissions:
   - **Account**: Chọn account của bạn
   - **Zone Resources**: Include All zones
   - **Account Resources**: Include All accounts
   - **Permissions**: 
     - Account: Cloudflare R2:Edit
5. Click **Continue to summary** → **Create Token**
6. **Lưu lại Access Key ID và Secret Access Key**

## 2. Cấu hình Environment Variables

Cập nhật file `.env` trong thư mục `backend/`:

```env
# Cloudflare R2 Storage Configuration
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_REGION=auto
R2_BUCKET=medical-files-storage
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your_bucket_name.your_account_id.r2.cloudflarestorage.com
```

### Tìm Account ID:
1. Vào Cloudflare Dashboard
2. Sidebar phải sẽ hiển thị **Account ID**
3. Copy và thay thế `your_account_id` trong endpoint

### Tìm Public URL:
1. Vào R2 bucket đã tạo
2. Tab **Settings** → **Public access**
3. Enable public access nếu cần
4. Copy **Public bucket URL**

## 3. Cấu hình Custom Domain (Tùy chọn)

### Để sử dụng custom domain cho R2:

1. **Tạo Custom Domain:**
   - Vào R2 bucket → **Settings** → **Custom Domains**
   - Click **Connect Domain**
   - Nhập domain của bạn (ví dụ: `files.yourdomain.com`)
   - Follow hướng dẫn để setup DNS

2. **Cập nhật R2_PUBLIC_URL:**
   ```env
   R2_PUBLIC_URL=https://files.yourdomain.com
   ```

## 4. Test Configuration

### Kiểm tra kết nối R2:

```bash
# Trong thư mục backend
php -r "
require 'vendor/autoload.php';
use App\Application\Services\R2StorageService;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// Load environment
\$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
\$dotenv->load();

\$logger = new Logger('test');
\$logger->pushHandler(new StreamHandler('php://stdout'));

try {
    \$r2 = new R2StorageService(\$logger);
    \$files = \$r2->listFiles('', 1);
    echo 'R2 Connection successful!' . PHP_EOL;
    echo 'Files in bucket: ' . count(\$files) . PHP_EOL;
} catch (Exception \$e) {
    echo 'R2 Connection failed: ' . \$e->getMessage() . PHP_EOL;
}
"
```

## 5. File Structure trong R2

Files sẽ được organize theo cấu trúc:

```
medical-files-storage/
├── medical-uploads/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── 15/
│   │   │   │   ├── abc123def456.pdf
│   │   │   │   ├── xyz789uvw012.jpg
│   │   │   └── 16/
│   │   └── 02/
│   └── 2024/
└── backups/
    └── database/
```

## 6. Security Best Practices

### CORS Configuration:
1. Vào R2 bucket → **Settings** → **CORS policy**
2. Thêm CORS rule:
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Access Control:
- Chỉ enable public read access
- Không enable public write access
- Sử dụng signed URLs cho sensitive files

## 7. Monitoring và Logging

### Cloudflare Analytics:
- Vào R2 bucket → **Analytics**
- Monitor storage usage, requests, bandwidth

### Application Logging:
- R2StorageService tự động log các operations
- Check logs trong `logs/app.log`

## 8. Backup Strategy

### Tự động backup:
```bash
# Crontab entry để backup daily
0 2 * * * /path/to/backup-script.sh
```

### Manual backup:
```bash
# Sử dụng rclone để sync
rclone sync r2:medical-files-storage /local/backup/path
```

## 9. Cost Optimization

### R2 Pricing (tham khảo):
- Storage: $0.015/GB/month
- Class A operations (write): $4.50/million
- Class B operations (read): $0.36/million
- Egress: Free (no bandwidth charges)

### Optimization tips:
- Sử dụng appropriate file formats
- Implement file compression
- Set up lifecycle policies
- Monitor usage regularly

## 10. Troubleshooting

### Common Issues:

1. **403 Forbidden:**
   - Check API token permissions
   - Verify bucket name và account ID

2. **Connection timeout:**
   - Check network connectivity
   - Verify endpoint URL

3. **File not found:**
   - Check R2 key format
   - Verify public access settings

### Debug Commands:

```bash
# Test AWS SDK connection
php -r "
use Aws\S3\S3Client;
\$client = new S3Client([
    'version' => 'latest',
    'region' => 'auto',
    'endpoint' => 'https://account.r2.cloudflarestorage.com',
    'credentials' => [
        'key' => 'your_key',
        'secret' => 'your_secret'
    ]
]);
var_dump(\$client->listBuckets());
"
```
