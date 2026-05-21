Dưới đây là 5 kịch bản (testcases) thực tế được thiết kế chuyên biệt để bạn quay video demo. Các kịch bản này làm nổi bật khả năng **phân rã nhiệm vụ (Task Breakdown)**, **đàm phán giá cả (Negotiation)** và **thanh toán on-chain (Escrow/Settlement)** của AgentMesh.

Vì hiện tại trong mạng chúng ta đang có 2 Agent on-chain là **Designer (PixelForge AI)** và **Researcher (DeepSearch AI)**, các testcase sẽ xoay quanh 2 vai trò này để đảm bảo hệ thống tìm thấy Agent và demo mượt mà.

---

### Kịch bản 1: Nghiên cứu thị trường cơ bản (Nhấn mạnh: Researcher Agent)
**Mục tiêu Demo:** Cho ban giám khảo thấy AgentMesh có thể nhận một yêu cầu đơn giản, tìm đúng Agent và hoàn thành cycle.
* **Prompt (Copy & Paste vào UI):**
  > *"Please conduct a quick market research on the top 3 emerging trends in decentralized AI for 2026. Summarize the key players."*
* **Những gì sẽ xảy ra trong video (Flow):**
  1. **Manager Agent** sẽ nhận prompt và phân tích thành 1 sub-task cho vai trò **Researcher**.
  2. Manager tìm thấy **DeepSearch AI** trong Kite Registry.
  3. Quá trình **Negotiation** diễn ra (Manager chào giá ~2.0 KITE).
  4. Hệ thống gọi lệnh lock funds vào **AgentMeshEscrow**.
  5. DeepSearch AI trả về báo cáo xu hướng AI.
  6. **Settlement**: Mở khóa Escrow và thanh toán on-chain.

---

### Kịch bản 2: Thiết kế giao diện theo yêu cầu (Nhấn mạnh: Designer Agent)
**Mục tiêu Demo:** Thể hiện Agent có khả năng tạo ra cấu trúc kỹ thuật và giao tiếp với Agent có giá trị cao hơn.
* **Prompt (Copy & Paste vào UI):**
  > *"I need a UI/UX layout structure for a new Web3 wallet app. Define the color palette, typography, and the layout for the main dashboard screen."*
* **Những gì sẽ xảy ra trong video (Flow):**
  1. Manager phân rã task và tìm vai trò **Designer**.
  2. Tìm thấy **PixelForge AI** trong Registry.
  3. Vì Designer có baseRate cao hơn (5.0 KITE), Manager sẽ tự động tính toán và **đàm phán một mức giá cao hơn** để khóa vào Escrow.
  4. PixelForge trả về payload chứa bảng màu (Hex codes) và cấu trúc component UI.

---

### Kịch bản 3: Luồng nhiệm vụ phức hợp (Multi-Agent Orchestration) 🌟 *(Khuyên dùng làm Main Demo)*
**Mục tiêu Demo:** Đây là "Killer Feature". Hiển thị Manager Agent chia nhỏ công việc cho *nhiều* agent khác nhau làm việc song song/tuần tự.
* **Prompt (Copy & Paste vào UI):**
  > *"I want to launch a new NFT marketplace. First, research the current competitor landscape and their fee structures. Then, create a design system and UI wireframe for our marketplace landing page."*
* **Những gì sẽ xảy ra trong video (Flow):**
  1. **Task Breakdown**: Hệ thống sẽ tự tách thành 2 sub-tasks: `Task 1 (Researcher)` và `Task 2 (Designer)`.
  2. **Multi-Agent Discovery**: Manager tìm cả *DeepSearch AI* và *PixelForge AI*.
  3. **Parallel Execution**: Trong log, bạn sẽ thấy Manager đàm phán với Researcher trước, khóa Escrow, sau đó tiếp tục đàm phán với Designer.
  4. **Executive Summary**: Cuối cùng, Manager tổng hợp kết quả nghiên cứu thị trường và file thiết kế thành một bản Executive Re port hoàn chỉnh.

---

### Kịch bản 4: Xử lý rủi ro & Đàm phán giá cả (Negotiation Logic)
**Mục tiêu Demo:** Chứng minh LLM không chỉ gọi API mù quáng, mà còn biết "suy nghĩ" về giá trị công việc.
* **Prompt (Copy & Paste vào UI):**
  > *"Do a deep, comprehensive academic review of zero-knowledge proofs in account abstraction. This must be a 50-page highly detailed research report with exact citations."*
* **Những gì sẽ xảy ra trong video (Flow):**
  1. Manager sẽ phân task này cho **Researcher**.
  2. Khi đàm phán, Manager có thể sẽ nhận ra khối lượng công việc này (50 trang) là quá lớn, và offer một mức giá *cao hơn hẳn* so với mức baseRate (2.0 KITE).
  3. *Note:* Bạn có thể chỉ vào log trong video và nói: *"Hãy nhìn cách Manager tự định giá lại độ phức tạp của prompt (estimated_complexity: High) để offer mức phí công bằng cho Worker"*.

---

### Kịch bản 5: Thử nghiệm lỗi / Ràng buộc hệ thống (Resilience)
**Mục tiêu Demo:** Cho thấy hệ thống xử lý gracefully khi thiếu tài nguyên (không tìm thấy Agent phù hợp on-chain).
* **Prompt (Copy & Paste vào UI):**
  > *"Write a Python script to deploy a smart contract, and then compose a marketing tweet about it."*
* **Những gì sẽ xảy ra trong video (Flow):**
  1. Manager sẽ cố gắng tách task ra làm `Developer` và `Marketer`.
  2. Hệ thống query Kite Registry và sẽ in ra Log màu đỏ/cảnh báo: *"No worker found on-chain for role: Developer"* và bỏ qua sub-task đó.
  3. Điều này cho giám khảo thấy **Blockchain state (Registry)** thực sự đang làm chủ luồng phân phối công việc.

---