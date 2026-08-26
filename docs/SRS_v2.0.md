# SRS v2.0 - Website tao video tu hinh anh

## 1. Thong tin tai lieu

- Ten de tai: Website tao video tu hinh anh
- Mon hoc: Lap trinh ung dung Web
- Phien ban: SRS v2.0
- Nhom thuc hien: Nhom 2
- Thanh vien:
  - Ngo Thanh Tung - 2302700108
  - Nguyen Bao Anh - 2302700386
  - Tran Mong Tuyen - 2302700118
  - Ho Le Duy - 2302700362
  - Truong Tien Dat - 2302700284

## 2. Muc dich

Tai lieu nay mo ta yeu cau phan mem cho he thong Web Full-stack cho phep nguoi dung tai hinh anh, nhap prompt va tao video ngan tu hinh anh. He thong dap ung yeu cau do an cuoi ky, gom Frontend, Backend, Database, phan quyen User/Admin, quan ly Credit, Payment, Promotion va bao cao thong ke.

SRS v2.0 duoc cap nhat theo de thi do an. Cac yeu cau ve Credit, Promotion, Admin, Payment va thong ke duoc dua thanh yeu cau bat buoc. AI image-to-video duoc xem la chuc nang mo rong; FFmpeg van la luong tao video on dinh de dam bao demo khi API AI het quota hoac khong kha dung.

## 3. Pham vi he thong

He thong cung cap cac chuc nang chinh:

- Dang ky, dang nhap, dang xuat va quan ly ho so nguoi dung.
- Tai anh JPG, PNG, WEBP, nhap prompt va gui yeu cau tao video.
- Tao video bang FFmpeg hoac AI provider neu duoc cau hinh.
- Theo doi trang thai tao video, xem ket qua va lich su video.
- Quan ly vi Credit, lich su giao dich, mua them Credit va ap dung khuyen mai.
- Quan tri User, Credit, goi Credit, Promotion, Payment, Video va bao cao thong ke.

## 4. Doi tuong su dung

### 4.1 Guest

Guest la nguoi chua dang nhap. Guest co the xem man hinh dang nhap/dang ky va tao tai khoan moi.

### 4.2 User

User la nguoi dung da dang nhap. User co the cap nhat ho so, mua Credit, dang ky khuyen mai, tao video, xem trang thai, tai video va xem lich su giao dich.

### 4.3 Admin

Admin la tai khoan co quyen quan tri. Admin co the quan ly User, Credit, Payment, Promotion, Video, cau hinh chi phi tao video va xem bao cao thong ke.

## 5. Yeu cau chuc nang

### 5.1 Xac thuc va phan quyen

- FR-AUTH-01: He thong cho phep User dang ky tai khoan bang ho ten, email va mat khau.
- FR-AUTH-02: He thong ma hoa mat khau truoc khi luu vao Database.
- FR-AUTH-03: He thong cho phep User dang nhap, dang xuat va duy tri phien bang JWT hoac Session.
- FR-AUTH-04: Backend phai kiem tra quyen truy cap voi cac API can dang nhap.
- FR-AUTH-05: Backend phai phan biet quyen User va Admin.
- FR-AUTH-06: Tai khoan dang ky thong thuong co so du ban dau la 0 Credit.
- FR-AUTH-07: Neu dang ky trong mot chuong trinh khuyen mai hop le, User duoc cong Credit theo cau hinh cua chuong trinh.

### 5.2 Ho so nguoi dung

- FR-PROFILE-01: User co the xem thong tin ho so ca nhan.
- FR-PROFILE-02: User co the cap nhat ho ten hoac thong tin ca nhan co ban.
- FR-PROFILE-03: User co the doi mat khau neu cung cap thong tin hop le.
- FR-PROFILE-04: User co the export du lieu tai khoan neu he thong ho tro.

### 5.3 Tao video tu hinh anh

- FR-VIDEO-01: User co the tai len hinh anh dinh dang JPG, PNG hoac WEBP.
- FR-VIDEO-02: He thong gioi han dung luong file upload de phu hop moi truong demo.
- FR-VIDEO-03: User co the nhap prompt/noi dung mo ta chuyen dong mong muon.
- FR-VIDEO-04: User co the chon thoi luong video va ty le/huong khung hinh.
- FR-VIDEO-05: He thong tao generation job va hien thi trang thai xu ly.
- FR-VIDEO-06: Trang thai toi thieu gom queued, processing, uploading, completed, failed va cancelled.
- FR-VIDEO-07: Khi video tao thanh cong, User co the xem video tren trinh duyet va tai xuong file MP4.
- FR-VIDEO-08: User co the xem lich su video da tao.
- FR-VIDEO-09: User co the huy job neu job chua hoan tat.
- FR-VIDEO-10: User co the report video neu ket qua khong phu hop.

### 5.4 Engine tao video

- FR-ENGINE-01: He thong phai co luong FFmpeg de tao video MP4 tu hinh anh, dam bao demo on dinh.
- FR-ENGINE-02: FFmpeg mode tao video bang cac hieu ung nhu zoom, pan hoac chuyen dong camera co ban.
- FR-ENGINE-03: He thong co the tich hop AI provider de tao video co chuyen dong thuc tu hinh anh.
- FR-ENGINE-04: AI provider la chuc nang mo rong, phu thuoc quota, balance, toc do xu ly va chinh sach nha cung cap.
- FR-ENGINE-05: Neu AI provider loi, he thong phai ghi nhan loi va hoan lai Credit da reserve.
- FR-ENGINE-06: He thong uu tien luu video ket qua len Cloudinary khi duoc cau hinh.

### 5.5 Quan ly Credit cua User

- FR-CREDIT-01: User co the xem so du Credit hien tai.
- FR-CREDIT-02: User co the xem lich su giao dich Credit.
- FR-CREDIT-03: Moi lan tao video, he thong kiem tra so du Credit truoc khi tao job.
- FR-CREDIT-04: Neu khong du Credit, he thong tu choi yeu cau va thong bao cho User mua them Credit.
- FR-CREDIT-05: Khi User gui yeu cau tao video, he thong reserve Credit tuong ung.
- FR-CREDIT-06: Khi video tao thanh cong, he thong capture Credit da reserve.
- FR-CREDIT-07: Khi video tao that bai hoac bi huy hop le, he thong release/hoan Credit.
- FR-CREDIT-08: User khong duoc tu thay doi so du Credit.

### 5.6 Goi Credit va Payment

- FR-PAYMENT-01: User co the xem danh sach goi Credit dang hoat dong.
- FR-PAYMENT-02: User co the chon goi va tao yeu cau mua Credit.
- FR-PAYMENT-03: He thong ghi nhan Payment gom User, goi, so tien, so Credit, trang thai va nha cung cap thanh toan.
- FR-PAYMENT-04: He thong co the dung payment mock de demo do an.
- FR-PAYMENT-05: Khi Payment thanh cong, he thong cong Credit vao vi User va tao Credit Transaction.
- FR-PAYMENT-06: Admin co the xem danh sach Payment va thuc hien refund neu can.

### 5.7 Promotion

- FR-PROMO-01: Admin co the tao chuong trinh khuyen mai.
- FR-PROMO-02: Promotion gom ten chuong trinh, ma chuong trinh, thoi gian ap dung, dieu kien, so Credit tang, gioi han luot dang ky va trang thai.
- FR-PROMO-03: User co the nhap ma khuyen mai hoac dang ky chuong trinh hop le.
- FR-PROMO-04: He thong kiem tra thoi gian, trang thai, gioi han luot va dieu kien ap dung truoc khi cong Credit.
- FR-PROMO-05: He thong phai luu Promotion Registration de tranh User nhan thuong lap lai sai quy dinh.
- FR-PROMO-06: Admin co the xem hieu qua chuong trinh khuyen mai.

### 5.8 Phan he Admin

- FR-ADMIN-01: Admin co the xem dashboard tong quan.
- FR-ADMIN-02: Admin co the xem danh sach User, tim kiem User theo ten/email va xem chi tiet User.
- FR-ADMIN-03: Admin co the cap nhat thong tin User.
- FR-ADMIN-04: Admin co the khoa hoac mo khoa tai khoan User.
- FR-ADMIN-05: Admin co the cong hoac tru Credit thu cong cho User.
- FR-ADMIN-06: Moi thao tac cong/tru Credit cua Admin phai tao Credit Transaction.
- FR-ADMIN-07: Admin co the cau hinh chi phi tao video theo engine, provider, model, thoi luong hoac ty le.
- FR-ADMIN-08: Admin co the quan ly Credit Packages.
- FR-ADMIN-09: Admin co the quan ly Promotion.
- FR-ADMIN-10: Admin co the xem danh sach video, trang thai tao video va cac truong hop that bai.
- FR-ADMIN-11: Admin co the xem bao cao User, video, Credit, doanh thu va Promotion.

### 5.9 Bao cao thong ke

- FR-REPORT-01: He thong thong ke tong so User va User moi theo thoi gian.
- FR-REPORT-02: He thong thong ke so video thanh cong, that bai va dang xu ly.
- FR-REPORT-03: He thong thong ke Credit da cap, Credit da su dung va Credit da hoan.
- FR-REPORT-04: He thong thong ke doanh thu ban Credit.
- FR-REPORT-05: He thong thong ke hieu qua chuong trinh khuyen mai.

## 6. Yeu cau du lieu

Database toi thieu gom cac nhom du lieu:

- Users/Roles: tai khoan, vai tro, trang thai, thong tin ho so va vi Credit.
- Videos/Projects: anh nguon, prompt, engine, provider, model, trang thai, video ket qua.
- Generation Jobs: hang doi xu ly, progress, provider request id, loi xu ly.
- Credit Transactions: purchase, reserve, capture, release, refund, manual adjustment, promotion bonus.
- Credit Packages: ma goi, ten goi, so Credit, gia, trang thai.
- Payments: giao dich mua Credit, trang thai thanh toan, provider, amount, currency.
- Promotions: thong tin chuong trinh khuyen mai.
- Promotion Registrations: User nao da dang ky/nhan Credit tu promotion nao.
- Settings: cau hinh chi phi tao video, gioi han upload, provider mac dinh.
- Audit Logs: ghi nhan hanh dong quan trong cua User/Admin.

## 7. Yeu cau phi chuc nang

- NFR-01: Frontend phai responsive tren may tinh, may tinh bang va dien thoai.
- NFR-02: Backend phai validate du lieu dau vao.
- NFR-03: Backend phai bao ve API Admin bang middleware phan quyen.
- NFR-04: Mat khau phai duoc bam truoc khi luu.
- NFR-05: Token bi thieu hoac khong hop le phai bi tu choi.
- NFR-06: Nghiep vu Credit phai xu ly an toan va co lich su day du.
- NFR-07: He thong phai hien thi thong bao loi ro rang cho User.
- NFR-08: He thong phai hien thi trang thai cho trong qua trinh tao video.
- NFR-09: He thong phai co gioi han file upload va rate limit co ban.
- NFR-10: He thong phai co tai lieu cai dat, API va huong dan su dung.

## 8. Rang buoc trien khai

Do he thong trien khai bang cac dich vu mien phi hoac free trial, hieu nang, quota AI va dung luong luu tru co the bi gioi han. He thong chi cam ket dap ung nhu cau demo do an voi so luong nguoi dung it, video ngan va file nho.

He thong duoc xem la dat yeu cau demo khi:

- Frontend deploy online.
- Backend deploy online.
- Backend ket noi duoc MongoDB Atlas.
- Backend ket noi duoc Redis de xu ly queue.
- Tao duoc video MP4 tu anh bang FFmpeg.
- Tao duoc video bang AI provider khi token/quota kha dung.
- Upload duoc video len Cloudinary.
- Hien thi duoc video ket qua tren trinh duyet.

## 9. Tieu chi nghiem thu

- AC-01: User dang ky tai khoan moi va so du ban dau la 0 Credit neu khong co promotion.
- AC-02: User khong du Credit thi khong tao duoc video.
- AC-03: User mua goi Credit mock thanh cong va so du duoc cong.
- AC-04: User tao video FFmpeg thanh cong va xem duoc MP4 tren browser.
- AC-05: User tao video AI thanh cong khi provider co quota.
- AC-06: Job that bai thi Credit duoc hoan lai.
- AC-07: User xem duoc lich su video va lich su Credit.
- AC-08: Admin xem va tim kiem duoc danh sach User.
- AC-09: Admin khoa/mo khoa tai khoan User.
- AC-10: Admin cong/tru Credit thu cong va giao dich duoc ghi log.
- AC-11: Admin tao Promotion va User dang ky Promotion hop le.
- AC-12: Admin xem duoc thong ke User, video, Credit, Payment va Promotion.

## 10. Pham vi uu tien thuc hien

### Must have

- Auth User/Admin.
- Upload anh va tao video.
- FFmpeg video fallback.
- Replicate hoac Fal AI provider neu co quota.
- Credit wallet va transaction.
- Payment mock va Credit Packages.
- Admin User management.
- Admin manual Credit adjustment.
- Promotion va Promotion Registration.
- Admin reporting dashboard.
- Tai lieu cai dat, API, database va huong dan su dung.

### Should have

- Email verification, forgot password.
- Notification trong app.
- Content report.
- Provider health.
- Backup database.

### Could have

- Thanh toan that qua PayOS/Stripe.
- Them provider Runway/Luma/Magic Hour.
- Nang cap do phan giai 2K.
- Admin UI nang cao cho toan bo Settings.

## 11. Ghi chu doi chieu code hien tai

Project hien tai da co nen tang chinh: React/Vite frontend, Express backend, MongoDB, Redis queue, Cloudinary, FFmpeg, Replicate AI, Fal AI, JWT, credit wallet, payment mock, coupon, notification, admin overview va audit log.

Cac diem can cap nhat trong code de khop hoan toan voi SRS v2.0 theo de thi:

- Doi credit mac dinh cua tai khoan moi tu 20 ve 0.
- Bo sung cap nhat ho so ca nhan.
- Bo sung Admin User management: list, search, detail, update, lock/unlock.
- Bo sung Admin manual Credit adjustment.
- Tach Promotion dung nghia thay vi chi dung Coupon giam gia.
- Bo sung Promotion Registration.
- Bo sung Settings cau hinh chi phi tao video.
- Mo rong dashboard Admin cho bao cao theo thoi gian.
