# FURPMS — API Contract (Backend hiện tại)

> **Đây là contract DUY NHẤT, đã hợp nhất** — thay thế bản cũ `FURPMS_API_Contract_v1.1_Delta.md` (đã xoá). Mọi chi tiết field/nghiệp vụ của bản v1.1 đã gộp vào §13 cuối file.
>
> Tài liệu mô tả **toàn bộ REST API** backend FURPMS đang cung cấp, để bàn giao cho team FE. Cập nhật theo mã nguồn (v2.0: proposal CRUD + budget/member persistence + dev tools + tóm tắt AI Gemini).
>
> **Nguồn chính xác nhất là Swagger đang chạy:** `http://localhost:5068/swagger` — có schema request/response đầy đủ, bấm "Try it out" gọi thử được. Tài liệu này cho cái nhìn tổng thể + quy ước + các luồng chính.

---

## 1. Tổng quan

| Mục            | Giá trị                                             |
| -------------- | --------------------------------------------------- |
| Base URL (dev) | `http://localhost:5068`                             |
| Swagger UI     | `http://localhost:5068/swagger`                     |
| Định dạng      | JSON, UTF-8                                         |
| Xác thực       | JWT Bearer (header `Authorization: Bearer <token>`) |
| CORS           | cho phép origin `http://localhost:5173`             |
| Stack          | ASP.NET Core 8, EF Core, SQL Server                 |

---

## 2. Quy ước chung

### 2.1. Response envelope

**Mọi** endpoint trả về cùng một vỏ bọc `ApiResponse<T>`:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    /* payload, có thể là object | array | null */
  },
  "errors": null
}
```

Khi lỗi (do middleware sinh ra):

```json
{
  "success": false,
  "message": "Proposal not found.",
  "data": null,
  "errors": null
}
```

### 2.2. Mapping lỗi → HTTP status

Backend ném exception, `GlobalExceptionMiddleware` map sang status:

| Exception                     | HTTP | Ý nghĩa                                       |
| ----------------------------- | ---- | --------------------------------------------- |
| `UnauthorizedAccessException` | 401  | Sai thông tin / không đủ quyền với tài nguyên |
| `ArgumentException`           | 400  | Dữ liệu vào không hợp lệ                      |
| `KeyNotFoundException`        | 404  | Không tìm thấy                                |
| `InvalidOperationException`   | 409  | Xung đột trạng thái (vd: sửa đề xuất đã nộp)  |
| khác                          | 500  | Lỗi không lường trước                         |

Ngoài ra ASP.NET tự trả **400** cho lỗi model-binding (sai kiểu dữ liệu JSON), **401** nếu thiếu/không hợp lệ token.

### 2.3. Vai trò (roles)

4 vai trò, khớp với `Role.Name` trong DB: **`Admin`**, **`Staff`**, **`Faculty`**, **`ReviewCommittee`**.

- `[Authorize]` (mặc định ở hầu hết controller) = cần đăng nhập (vai trò bất kỳ).
- Cột "Quyền" bên dưới ghi rõ khi endpoint giới hạn vai trò; "\*" = mọi user đã đăng nhập.
- Token chứa claim role; 1 user có thể có nhiều role.

### 2.4. Kiểu ID

- Thực thể nghiệp vụ (proposal, user, contract, council, meeting, deliverable...) → **GUID**.
- Bảng cấu hình/lookup (cycle, track, role type, budget category, rubric...) → **int**.
- `deliverables`, `disbursements`, `settlements`, một số sub-resource → **int**.

### 2.5. Giá trị trạng thái (backend lưu CHỮ HOA)

| Thực thể                        | Các trạng thái                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Cycle                           | `PLANNING` → `OPEN` → `CLOSED`                                                             |
| Proposal                        | `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `WITHDRAWN`                  |
| Review round                    | type: `SCREENING` / `REVIEW` / `ACCEPTANCE`; status: `PENDING`, `OPEN`, `PASSED`, `FAILED` |
| Council decision / round result | `APPROVED` / `REJECTED` / `REVISION_REQUIRED`                                              |
| Deliverable / Acceptance        | `PASSED` / `FAILED` (acceptance submit dùng `PASS` / `FAIL`)                               |
| Council member response         | `PENDING` / `ACCEPTED` / `DECLINED`                                                        |

---

## 3. Xác thực — `/api/auth`

| Method | Path                        | Quyền     | Mô tả                                 |
| ------ | --------------------------- | --------- | ------------------------------------- |
| POST   | `/api/auth/login`           | công khai | Đăng nhập, trả token + thông tin user |
| GET    | `/api/auth/me`              | \*        | Thông tin user hiện tại               |
| POST   | `/api/auth/change-password` | \*        | Đổi mật khẩu                          |

**Login request**

```json
{ "email": "admin@furpms.edu.vn", "password": "Admin@123456" }
```

**Login response (`data`)**

```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": "guid",
    "email": "...",
    "fullName": "...",
    "status": "ACTIVE",
    "roles": ["Admin"],
    "lastLoginAt": "..."
  }
}
```

**Change password request**: `{ "currentPassword": "...", "newPassword": "...", "confirmNewPassword": "..." }`

---

## 4. Người dùng & hồ sơ

### Users — `/api/users`

| Method | Path              | Quyền        | Mô tả          |
| ------ | ----------------- | ------------ | -------------- |
| GET    | `/api/users`      | Admin, Staff | Danh sách user |
| GET    | `/api/users/{id}` | \*           | Chi tiết user  |
| POST   | `/api/users`      | Admin        | Tạo user       |
| PUT    | `/api/users/{id}` | Admin        | Cập nhật user  |

**CreateUserRequest**

```json
{
  "email": "...",
  "fullName": "...",
  "phoneNumber": "...",
  "department": "...",
  "academicDegree": 1,
  "roles": [3],
  "temporaryPassword": "..."
}
```

`roles` = mảng **Role.Id** (Admin=1, Staff=2, Faculty=3, ReviewCommittee=4).

### Academic Profile — `/api/users/{userId}/profile`

| Method | Path                          | Quyền                                     | Mô tả              |
| ------ | ----------------------------- | ----------------------------------------- | ------------------ |
| GET    | `/api/users/{userId}/profile` | \* (chủ hồ sơ; Admin/Staff xem mọi người) | Hồ sơ khoa học     |
| PUT    | `/api/users/{userId}/profile` | như trên                                  | Tạo/cập nhật hồ sơ |

---

## 5. Master data (cấu hình)

### Cycles & Tracks — `/api/cycles`

| Method | Path                                 | Quyền        | Mô tả                 |
| ------ | ------------------------------------ | ------------ | --------------------- |
| GET    | `/api/cycles`                        | \*           | Danh sách đợt nộp     |
| GET    | `/api/cycles/{id}`                   | \*           | Chi tiết đợt          |
| POST   | `/api/cycles`                        | Admin, Staff | Tạo đợt               |
| PUT    | `/api/cycles/{id}`                   | Admin, Staff | Sửa đợt               |
| POST   | `/api/cycles/{id}/open`              | Admin, Staff | Mở đợt (→ `OPEN`)     |
| POST   | `/api/cycles/{id}/close`             | Admin, Staff | Đóng đợt (→ `CLOSED`) |
| GET    | `/api/cycles/tracks`                 | \*           | Danh sách track       |
| POST   | `/api/cycles/tracks`                 | Admin, Staff | Tạo track             |
| PUT    | `/api/cycles/tracks/{id}`            | Admin, Staff | Sửa track             |
| PATCH  | `/api/cycles/tracks/{id}/owner`      | Admin, Staff | Gán chủ track         |
| PATCH  | `/api/cycles/tracks/{id}/deactivate` | Admin, Staff | Vô hiệu track         |

> ⚠️ Đợt nộp phải ở trạng thái `OPEN` thì PI mới tạo được đề xuất. FE lấy đợt đang mở bằng cách `GET /api/cycles` rồi lọc `status == "Open"`.

### Các lookup khác (đều CRUD theo cùng mẫu: GET list / GET {id} / POST / PUT; ghi/sửa = Admin)

| Resource                  | Base path                                  | Đọc | Ghi               |
| ------------------------- | ------------------------------------------ | --- | ----------------- |
| Personnel role types      | `/api/personnel-role-types`                | \*  | Admin             |
| Budget expense categories | `/api/budget-expense-categories`           | \*  | Admin             |
| System financial configs  | `/api/financial-configs`                   | \*  | Admin             |
| Product categories        | `/api/product-categories` (`?activeOnly=`) | \*  | Admin             |
| Organizational units      | `/api/organizational-units`                | \*  | Admin             |
| Rubric criteria           | `/api/rubric-criteria` (`?roundType=`)     | \*  | Admin (có DELETE) |

---

## 6. Đề xuất nghiên cứu — `/api/proposals`

| Method | Path                           | Quyền                                          | Mô tả                                                    |
| ------ | ------------------------------ | ---------------------------------------------- | -------------------------------------------------------- |
| GET    | `/api/proposals`               | \* (Admin/Staff xem hết; còn lại chỉ của mình) | Danh sách (filter `?cycleId&trackId&status&type&search`) |
| GET    | `/api/proposals/my`            | \*                                             | Đề xuất của tôi                                          |
| GET    | `/api/proposals/{id}`          | \*                                             | Chi tiết (kèm members, budgetItems)                      |
| POST   | `/api/proposals`               | \*                                             | Tạo (trạng thái `DRAFT`)                                 |
| PUT    | `/api/proposals/{id}`          | chủ nhiệm (PI)                                 | **Sửa — chỉ khi `DRAFT`** (khác → 409)                   |
| POST   | `/api/proposals/{id}/submit`   | PI                                             | Nộp duyệt (`DRAFT` → `SUBMITTED`)                        |
| PATCH  | `/api/proposals/{id}/withdraw` | PI                                             | Rút lại (`SUBMITTED` → `DRAFT`)                          |

**CreateProposalRequest / (PUT dùng cùng body)**

```json
{
  "trackId": "1",
  "titleVI": "Tên đề tài",
  "titleEN": "Title",
  "researchType": 1, // 1 = Ứng dụng, 2 = Cơ bản (ResearchType.Id)
  "durationMonths": 18,
  "objectives": "Mục tiêu...",
  "methodology": "Phương pháp...",
  "expectedOutput": "",
  "members": [
    {
      "fullName": "Nguyễn Văn A",
      "email": "a@fpt.edu.vn",
      "department": "SE",
      "role": "TVC",
      "workMonths": 5
    }
  ],
  "budgetItems": [
    {
      "category": "Công lao động trực tiếp",
      "amount": 50000000,
      "note": "Thù lao nhóm"
    }
  ]
}
```

- `budgetItems[].category` = **tên hạng mục** lấy từ `GET /api/budget-expense-categories` (khớp theo tên; không khớp → "Chi khác").
- Backend lưu đầy đủ members (kèm email/đơn vị) + budget items (kèm ghi chú) và **tự tính lại tổng kinh phí**.

### Sub-resources của đề xuất

| Method     | Path                                                           | Quyền | Mô tả                                     |
| ---------- | -------------------------------------------------------------- | ----- | ----------------------------------------- |
| GET/PUT    | `/api/proposals/{id}/budget`                                   | \*    | Bảng kinh phí tổng hợp (`BudgetResponse`) |
| GET        | `/api/proposals/{id}/budget/labor`                             | \*    | Chi tiết công lao động                    |
| PUT        | `/api/proposals/{id}/budget/labor/{detailId}`                  | \*    | Sửa 1 dòng công lao động                  |
| GET/POST   | `/api/proposals/{id}/team-members`                             | \*    | Liệt kê / thêm thành viên                 |
| GET/POST   | `/api/proposals/{id}/research-contents`                        | \*    | Nội dung nghiên cứu                       |
| PUT/DELETE | `/api/proposals/{id}/research-contents/{contentId}`            | \*    | Sửa/xoá nội dung                          |
| POST       | `/api/proposals/{id}/research-contents/{contentId}/activities` | \*    | Thêm hoạt động                            |
| PUT/DELETE | `/api/proposals/{id}/activities/{activityId}`                  | \*    | Sửa/xoá hoạt động                         |
| GET/POST   | `/api/proposals/{id}/expected-products`                        | \*    | Sản phẩm dự kiến                          |
| PUT/DELETE | `/api/proposals/{id}/expected-products/{productId}`            | \*    | Sửa/xoá sản phẩm                          |
| GET        | `/api/proposals/{id}/export/scientific`                        | \*    | Xuất thuyết minh (file)                   |
| GET        | `/api/proposals/{id}/export/budget`                            | \*    | Xuất dự toán (file)                       |

### Tài liệu đề xuất — ⚠️ CHƯA CÓ TRONG BE

> FE đang gọi `/api/proposals/{id}/documents` (GET/POST/DELETE/download) và `/api/documents`,
> **nhưng backend KHÔNG có controller tài liệu** → các endpoint này trả **404** (đã kiểm chứng).
> Nút/màn "Tài liệu" trên FE hiện không hoạt động. Cần làm BE documents controller (lưu file +
> metadata) trước khi FE dùng được. _(Liên quan: entity `Document` có tồn tại nhưng chưa có service/endpoint.)_

---

## 7. Đặt hàng nghiên cứu — `/api/research-orders`

| Method | Path                                       | Quyền        | Mô tả                                 |
| ------ | ------------------------------------------ | ------------ | ------------------------------------- |
| GET    | `/api/research-orders` (`?cycleId&status`) | \*           | Danh sách                             |
| GET    | `/api/research-orders/{id}`                | \*           | Chi tiết                              |
| POST   | `/api/research-orders`                     | \*           | Tạo đơn đặt hàng                      |
| POST   | `/api/research-orders/{id}/match`          | Admin, Staff | Ghép với 1 đề xuất (`{ proposalId }`) |

---

## 8. Phản biện & Hội đồng

### Vòng phản biện — `/api/proposals/{proposalId}/rounds`, `/api/rounds/...`

| Method | Path                                       | Quyền        | Mô tả                         |
| ------ | ------------------------------------------ | ------------ | ----------------------------- |
| GET    | `/api/proposals/{proposalId}/rounds`       | \*           | Danh sách vòng của đề xuất    |
| POST   | `/api/proposals/{proposalId}/rounds`       | Staff, Admin | Tạo vòng (`{ roundType }`)    |
| POST   | `/api/rounds/{roundId}/open`               | Staff, Admin | Mở vòng                       |
| POST   | `/api/rounds/{roundId}/close`              | Staff, Admin | Chốt vòng (`{ result }`)      |
| GET    | `/api/rounds/{roundId}/members`            | \*           | Thành viên/phân công của vòng |
| POST   | `/api/rounds/{roundId}/members`            | Staff, Admin | Phân công phản biện           |
| DELETE | `/api/rounds/{roundId}/members/{memberId}` | Staff, Admin | Bỏ phân công                  |

### Hội đồng — `/api/councils`

| Method | Path                                      | Quyền           | Mô tả                                                  |
| ------ | ----------------------------------------- | --------------- | ------------------------------------------------------ |
| GET    | `/api/councils/my-memberships`            | \*              | Hội đồng mà tôi tham gia                               |
| POST   | `/api/councils`                           | Staff, Admin    | Lập hội đồng                                           |
| GET    | `/api/councils/{councilId}/members`       | \*              | Thành viên hội đồng                                    |
| POST   | `/api/councils/{councilId}/members`       | Staff, Admin    | Thêm thành viên (`{ userId, memberRole, isExternal }`) |
| PATCH  | `/api/council-members/{memberId}/respond` | \* (thành viên) | Chấp nhận/từ chối lời mời                              |
| DELETE | `/api/council-members/{memberId}`         | Staff, Admin    | Xoá thành viên                                         |

**CreateCouncilRequest**: `{ proposalId, roundId, councilType, establishmentDecisionNo?, establishedAt?, meetingDeadline?, minMembersRequired=3, maxMembersAllowed=5 }`

### Lịch họp — `/api/meetings`, `/api/councils/{councilId}/meetings`

| Method | Path                                 | Quyền        | Mô tả                 |
| ------ | ------------------------------------ | ------------ | --------------------- |
| GET    | `/api/meetings`                      | Admin, Staff | Toàn bộ lịch họp      |
| GET    | `/api/councils/{councilId}/meetings` | \*           | Lịch họp của hội đồng |
| POST   | `/api/councils/{councilId}/meetings` | Admin, Staff | Tạo lịch họp          |
| POST   | `/api/meetings/{id}/start`           | Admin, Staff | Bắt đầu họp           |
| POST   | `/api/meetings/{id}/end`             | Admin, Staff | Kết thúc họp          |

**ScheduleMeetingRequest**: `{ title?, platform="IN_PERSON", meetingLink?, scheduledAt, durationMinutes=120, agenda? }`

### Chấm điểm & quyết định — `/api/review-scoring`

| Method | Path                                                 | Quyền           | Mô tả           |
| ------ | ---------------------------------------------------- | --------------- | --------------- |
| GET    | `/api/review-scoring/rubrics`                        | \*              | Mẫu rubric      |
| GET    | `/api/review-scoring/rubrics/{id}`                   | \*              | Chi tiết rubric |
| POST   | `/api/review-scoring/councils/{councilId}/scores`    | \* (thành viên) | Nộp phiếu chấm  |
| GET    | `/api/review-scoring/councils/{councilId}/scores/my` | \*              | Phiếu của tôi   |
| GET    | `/api/review-scoring/councils/{councilId}/scores`    | Admin, Staff    | Tất cả phiếu    |
| POST   | `/api/review-scoring/councils/{councilId}/decision`  | Admin, Staff    | Chốt quyết định |
| GET    | `/api/review-scoring/councils/{councilId}/decision`  | \*              | Xem quyết định  |

**SubmitScoreRequest**: `{ templateId, generalComments?, otherRecommendations?, scoreDetails: [ { criterionId, givenScore, comments? } ] }`
**FinalizeDecisionRequest**: `{ result, councilComments?, recommendations?, chairUserId?, secretaryUserId? }` — `result` ∈ `APPROVED | REJECTED | REVISION_REQUIRED`

### Phản hồi phản biện — `/api/councils/{councilId}/feedback`

| Method | Path                                 | Quyền           | Mô tả                 |
| ------ | ------------------------------------ | --------------- | --------------------- |
| GET    | `/api/councils/{councilId}/feedback` | Admin, Staff    | Xem tổng hợp phản hồi |
| POST   | `/api/councils/{councilId}/feedback` | \* (thành viên) | Gửi phản hồi          |

**SubmitReviewerFeedbackRequest**: `{ urgencyScore?, scientificContributionScore?, practicalSignificanceScore?, actualVsExpectedScore?, overallAssessment?, otherComments? }` (điểm thang 1–5)

### Nghiệm thu — `/api/councils/{councilId}/acceptance`

| Method | Path                                   | Quyền           | Mô tả                           |
| ------ | -------------------------------------- | --------------- | ------------------------------- | ----------------------- |
| GET    | `/api/councils/{councilId}/acceptance` | Admin, Staff    | Đánh giá nghiệm thu             |
| POST   | `/api/councils/{councilId}/acceptance` | \* (thành viên) | Nộp đánh giá (`{ result: "PASS" | "FAIL", failReason? }`) |

---

## 9. Hợp đồng & sau hợp đồng

### Contracts — `/api/contracts`

| Method | Path                                                 | Quyền        | Mô tả                  |
| ------ | ---------------------------------------------------- | ------------ | ---------------------- |
| GET    | `/api/contracts`                                     | \*           | Danh sách hợp đồng     |
| GET    | `/api/contracts/{id}`                                | \*           | Chi tiết               |
| POST   | `/api/contracts`                                     | Admin, Staff | Tạo hợp đồng           |
| POST   | `/api/contracts/{id}/sign`                           | Admin, Staff | Ký                     |
| GET    | `/api/contracts/{contractId}/disbursements`          | \*           | Đợt giải ngân          |
| POST   | `/api/contracts/{contractId}/disbursements/generate` | Admin, Staff | Sinh lịch giải ngân    |
| GET    | `/api/contracts/{contractId}/deliverables`           | \*           | Sản phẩm phải nộp      |
| GET    | `/api/contracts/{contractId}/amendments`             | \*           | Điều chỉnh hợp đồng    |
| POST   | `/api/contracts/{contractId}/amendments`             | \*           | Tạo yêu cầu điều chỉnh |

**CreateContractRequest**: `{ proposalId, contractNumber, startDate, endDate, maxExtensionMonths=6, sideARepresentative?, econtractUrl? }`
**CreateAmendmentRequest**: `{ categoryId, changeDescription, justification, changePercentage?, oldValue?, newValue?, requiresRectorApproval, reviewerComments? }`

### Giải ngân — `/api/disbursements`

| POST | `/api/disbursements/{id}/confirm` | Admin, Staff | Xác nhận đã chi (`{ actualAmount, bankReference, notes? }`) |

### Sản phẩm — `/api/deliverables`

| POST | `/api/deliverables/{id}/submit` | \* (PI) | Nộp sản phẩm (`{ fileUrl, description?, acceptanceStatus, qualityAssessment? }`) |
| POST | `/api/deliverables/{id}/evaluate` | Admin, Staff | Đánh giá (`{ acceptanceStatus: "PASSED"|"FAILED", qualityAssessment? }`) |

### Điều chỉnh — `/api/amendments`

| GET | `/api/amendments/{id}` | \* | Chi tiết |
| POST | `/api/amendments/{id}/approve` | Admin, Staff | Duyệt (`ReviewAmendmentRequest`) |
| POST | `/api/amendments/{id}/reject` | Admin, Staff | Từ chối |

### Báo cáo tiến độ — `/api/progress-reports`

| GET | `/api/progress-reports?contractId=` | _ | Theo hợp đồng |
| GET | `/api/progress-reports/{id}` | _ | Chi tiết |
| POST | `/api/progress-reports` | _ (PI) | Tạo |
| POST | `/api/progress-reports/{id}/submit` | _ (PI) | Nộp |
| POST | `/api/progress-reports/{id}/evaluate` | Admin, Staff | Đánh giá |

### Báo cáo tổng kết — `/api/final-reports`

| GET | `/api/final-reports/{contractId}` | _ | Theo hợp đồng |
| POST | `/api/final-reports/{contractId}/submit` | _ (PI) | Nộp báo cáo cuối |
| POST | `/api/final-reports/{id}/request-revision` | Admin, Staff | Yêu cầu sửa |
| POST | `/api/final-reports/{id}/accept` | Admin, Staff | Chấp nhận |
| POST | `/api/final-reports/{id}/archive` | Admin, Staff | Lưu trữ |

### Quyết toán — `/api/contracts/{contractId}/settlement`, `/api/settlements/...`

| GET | `/api/contracts/{contractId}/settlement` | \* | Xem quyết toán |
| POST | `/api/contracts/{contractId}/settlement` | Admin, Staff | Tạo |
| POST | `/api/settlements/{id}/sign` | Admin, Staff | Ký |
| POST | `/api/settlements/{id}/accounting-cleared` | Admin, Staff | Xác nhận đã quyết toán kế toán |
| POST | `/api/settlements/{id}/assets-cleared` | Admin, Staff | Xác nhận đã thanh lý tài sản |

---

## 10. Thống kê, thông báo, dev tools

### Analytics — `/api/analytics` (Admin, Staff)

| GET | `/api/analytics/overview` | Tổng quan |
| GET | `/api/analytics/by-track?cycleId=` | Theo track |
| GET | `/api/analytics/funnel?cycleId=` | Phễu trạng thái |

### Notifications — `/api/notifications`

| GET | `/api/notifications` | _ | Thông báo của tôi |
| GET | `/api/notifications/count` | _ | Số chưa đọc |
| PATCH | `/api/notifications/{id}/read` | _ | Đánh dấu đã đọc |
| PATCH | `/api/notifications/read-all` | _ | Đọc tất cả |

### Admin / Dev tools — `/api/admin` (Admin)

| GET | `/api/admin/system-clock` | Xem mốc thời gian hệ thống (đã tua) |
| POST | `/api/admin/system-clock` | Đặt offset ngày (`{ offsetDays }`) — tua nhanh để test mốc hạn |
| POST | `/api/admin/run-deadline-scan` | Chạy ngay tác vụ quét nhắc hạn |

---

## 11. Bảng tóm tắt quyền theo vai trò

| Nhóm chức năng                      |  Faculty (PI)  | ReviewCommittee |  Staff   |  Admin   |
| ----------------------------------- | :------------: | :-------------: | :------: | :------: |
| Đề xuất của mình (tạo/sửa/nộp/rút)  |       ✅       |        –        |   xem    |   xem    |
| Xem mọi đề xuất                     |       –        |        –        |    ✅    |    ✅    |
| Master data (cycle/track/lookup)    |      đọc       |       đọc       |  sửa\*   |   sửa    |
| Lập hội đồng / phân công / lịch họp |       –        |        –        |    ✅    |    ✅    |
| Chấm điểm / phản hồi / nghiệm thu   |       –        |       ✅        |   xem    |   xem    |
| Chốt quyết định hội đồng            |       –        |        –        |    ✅    |    ✅    |
| Hợp đồng / giải ngân / điều chỉnh   | nộp SP, tạo CR |        –        |    ✅    |    ✅    |
| Báo cáo tiến độ / tổng kết          |      nộp       |        –        | đánh giá | đánh giá |
| Thống kê, người dùng, dev-tools     |       –        |        –        | thống kê |    ✅    |

(\*) cycle/track: Staff sửa được; các lookup khác (budget category, role type, financial config, product category, org unit, rubric) chỉ **Admin** ghi.

---

## 12. Ghi chú cho team FE

- Luôn đọc `success` trước, dùng `message` để hiển thị lỗi cho người dùng.
- Gửi `Content-Type: application/json; charset=utf-8` cho body có tiếng Việt.
- Lưu token vào storage, gắn `Authorization: Bearer` cho mọi request (trừ login).
- Trạng thái backend là **CHỮ HOA**; nếu UI muốn nhãn tiếng Việt thì tự map ở FE.
- Một số sub-resource (research-contents, expected-products, labor details) BE đã có nhưng FE cũ chưa dùng hết — Swagger có đủ.
- Khi cần biết chính xác field của 1 request/response: mở **Swagger**, mục tương ứng có schema + ví dụ.

### Tóm tắt AI đề xuất (Gemini) — ✅ ĐÃ CÓ

| Method | Path                                   | Mô tả                                       |
| ------ | -------------------------------------- | ------------------------------------------- |
| GET    | `/api/proposals/{id}/summary`          | Lấy tóm tắt AI hiện có (null nếu chưa tạo)  |
| POST   | `/api/proposals/{id}/generate-summary` | Sinh tóm tắt mới bằng Gemini                |
| PATCH  | `/api/proposals/{id}/summary`          | Sửa lại nội dung tóm tắt (`{ editedText }`) |

> Cần cấu hình **`GeminiAI:ApiKey`** (đặt trong `appsettings.Development.json` đã gitignore, hoặc biến môi trường `GeminiAI__ApiKey`). Kết quả lưu ở bảng `llm_outputs`. Chưa cấu hình key → trả lỗi rõ ("Hết hạn mức/Key bị từ chối…").

### ⚠️ FE đang gọi nhưng BE CHƯA implement (trả 404) — cần làm BE hoặc ẩn ở FE

| FE gọi                                                               | Mục đích                  | Trạng thái BE          |
| -------------------------------------------------------------------- | ------------------------- | ---------------------- |
| `GET/POST/DELETE /api/proposals/{id}/documents`, `/api/documents`    | Quản lý tài liệu đính kèm | ❌ Không có controller |
| `POST /api/assignments/{id}/ai-feedback`, `.../ai-rubric-assessment` | AI hỗ trợ chấm điểm       | ❌ Chưa làm            |

> Ngoài ra: muốn **chấm điểm** được, Admin phải thêm **tiêu chí chấm** (rubric criteria) cho loại vòng
> ở `/api/rubric-criteria`; nếu chưa có, màn chấm điểm hiện thông báo "Chưa cấu hình tiêu chí chấm".

---

## 13. Chi tiết field & quy tắc nghiệp vụ (gộp từ contract v1.1 Delta)

> Phần bổ sung field-level cho các nhóm quan trọng. Nguồn chính xác vẫn là Swagger.

### 13.1 Đề xuất — field mở rộng

- `fundingMethod`: `PARTIAL` (khoán từng phần) | `WHOLE` (khoán toàn phần). Quyết định cách sinh đợt giải ngân.
- Thành viên nhóm: ngoài `fullName/email/department/role/workMonths` còn có `memberRoleCode` (`CNNV | TKKH | TVC | TV | KTV`) và `salaryCoefficient` (hệ số tiền công, nhập tay). `isPi/isSecretary` giữ để tương thích ngược.

### 13.2 Kinh phí — line items + nguồn vốn

`GET/PUT /api/proposals/{id}/budget` dùng dạng line items:

```json
{
  "totalAmount": 900000000,
  "items": [
    {
      "id": 1,
      "categoryId": 1,
      "categoryCode": "LABOR",
      "categoryName": "Công lao động trực tiếp",
      "amount": 849747000,
      "sourceKhoan": 849747000,
      "sourceNgoaiKhoan": 0,
      "sourceNsnn": 849747000,
      "sourceOther": 0,
      "sequence": 1,
      "note": "..."
    }
  ]
}
```

- PUT validate: tổng `items[].amount` = `totalAmount`.
- `categoryId` lấy từ `/api/budget-expense-categories` (12 khoản seed sẵn theo Mẫu 3).

### 13.3 Tiền công (labor details) — `/api/proposals/{id}/budget/labor`

```json
{
  "teamMemberId": 3,
  "workDays": 215,
  "coefficient": 0.49,
  "dailyRate": 730100,
  "totalAmount": 156971500
}
```

- `dailyRate` = `coefficient` × `BASE_DAILY_SALARY` (lấy từ `/api/financial-configs`, mặc định 1.490.000 đ).
- `totalAmount` = `workDays` × `dailyRate`.

### 13.4 Vòng phản biện — field & quy tắc

`GET /api/proposals/{id}/rounds` trả mỗi vòng kèm:
`{ id, roundNumber, dimension, roundType, rubricTemplateId, sequence, prerequisiteRoundId, status, openedAt, closedAt, result, councilId }`

- `dimension`: `SCIENCE` (khoa học) | `FINANCE` (kinh phí).
- `roundType`: `SCREENING | REVIEW | ACCEPTANCE`.
- `status`: `PENDING | OPEN | PASSED | FAILED`; `result`: `APPROVED | REJECTED | REVISION_REQUIRED`.
- **Quy tắc:** `POST /api/rounds/{id}/open` trả **409** nếu `prerequisiteRound.status != PASSED` (chặn mở vòng kinh phí khi vòng khoa học chưa đạt).
- Mỗi vòng gắn 1 hội đồng riêng → `POST /api/councils` cần `roundId`.

### 13.5 Xuất hồ sơ — `/api/proposals/{id}/export`

- `/scientific` → file **Word .docx** (Mẫu 1 — Thuyết minh khoa học).
- `/budget` → file **Excel .xlsx** (Mẫu 3 — Dự toán kinh phí).
- Response là file: `Content-Disposition: attachment; filename="...".` (FE tải bằng Blob).

### 13.6 Sau duyệt — quy tắc giải ngân & sản phẩm

- `POST /api/contracts/{id}/disbursements/generate` sinh đợt theo `fundingMethod`:
  - `PARTIAL` → mỗi mốc nghiệm thu sản phẩm 1 đợt.
  - `WHOLE` → 2–3 đợt (đầu/giữa/cuối).
- `POST /api/deliverables/{id}/evaluate`:
  - `PASSED` → mở khoá đợt giải ngân tương ứng (nếu PARTIAL); `IsCompleted=true`.
  - `FAILED` → hợp đồng chuyển trạng thái xem xét.
- Nhắc hạn (job nội bộ, không phải endpoint): quét `deliverables.dueDate` gửi email mốc **T-30 / T-14 / T-7 / quá hạn**. Test bằng dev-tools tua thời gian (§10).

### 13.7 Bảng status (tổng hợp)

| Thực thể                        | Field              | Giá trị                                                         |
| ------------------------------- | ------------------ | --------------------------------------------------------------- |
| cycle                           | status             | `PLANNING` → `OPEN` → `CLOSED`                                  |
| proposal                        | status             | `DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, WITHDRAWN` |
| proposal                        | fundingMethod      | `PARTIAL, WHOLE`                                                |
| review_round                    | status / dimension | `PENDING, OPEN, PASSED, FAILED` / `SCIENCE, FINANCE`            |
| council decision / round result | result             | `APPROVED, REJECTED, REVISION_REQUIRED`                         |
| contract                        | status             | `PENDING_SIGNATURE, ACTIVE, UNDER_REVIEW, ...`                  |
| disbursement                    | status             | `PENDING, DISBURSED`                                            |
| deliverable / acceptance        | acceptanceStatus   | `PENDING, PASSED, FAILED` (acceptance submit dùng `PASS/FAIL`)  |
| council member                  | status             | `PENDING, ACCEPTED, DECLINED`                                   |
