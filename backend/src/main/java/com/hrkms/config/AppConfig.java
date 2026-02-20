package com.hrkms.config;

import com.hrkms.model.*;
import com.hrkms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.servlet.config.annotation.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class AppConfig {

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }

    @Bean
    CommandLineRunner initData(KnowledgeItemRepository itemRepo, UserRepository userRepo, BCryptPasswordEncoder encoder) {
        return args -> {
            // ========================
            // SEED DEFAULT USERS
            // ========================
            if (userRepo.count() == 0) {
                List<User> users = List.of(
                    User.builder()
                        .username("admin")
                        .password(encoder.encode("admin123"))
                        .fullName("System Administrator")
                        .email("admin@company.vn")
                        .department("IT")
                        .role(User.Role.ADMIN)
                        .build(),
                    User.builder()
                        .username("hr.manager")
                        .password(encoder.encode("hr123456"))
                        .fullName("Nguyễn Thị Hương")
                        .email("huong.nt@company.vn")
                        .department("HR")
                        .role(User.Role.MANAGER)
                        .build(),
                    User.builder()
                        .username("hr.officer")
                        .password(encoder.encode("hr123456"))
                        .fullName("Trần Minh Đức")
                        .email("duc.tm@company.vn")
                        .department("HR")
                        .role(User.Role.MANAGER)
                        .build(),
                    User.builder()
                        .username("employee01")
                        .password(encoder.encode("emp12345"))
                        .fullName("Lê Văn An")
                        .email("an.lv@company.vn")
                        .department("Engineering")
                        .role(User.Role.USER)
                        .build(),
                    User.builder()
                        .username("employee02")
                        .password(encoder.encode("emp12345"))
                        .fullName("Phạm Thị Bình")
                        .email("binh.pt@company.vn")
                        .department("Marketing")
                        .role(User.Role.USER)
                        .build()
                );
                userRepo.saveAll(users);
                System.out.println("=== DEFAULT ACCOUNTS ===");
                System.out.println("ADMIN:   admin / admin123");
                System.out.println("MANAGER: hr.manager / hr123456");
                System.out.println("MANAGER: hr.officer / hr123456");
                System.out.println("USER:    employee01 / emp12345");
                System.out.println("USER:    employee02 / emp12345");
                System.out.println("========================");
            }

            // ========================
            // SEED KMS DATA (15 items)
            // ========================
            if (itemRepo.count() > 0) return;

            List<KnowledgeItem> items = new ArrayList<>();

            // 6 Policies
            var pol1 = KnowledgeItem.builder()
                .id("POL-001").title("Chính sách nghỉ phép năm (Annual Leave Policy)").type("Policy")
                .tags(List.of("leave", "benefit", "working_time")).audience("All employees")
                .content("MỤC TIÊU: Đảm bảo nhân viên được nghỉ ngơi hợp lý, tuân thủ Bộ luật Lao động 2019.\n\nPHẠM VI: Áp dụng cho toàn bộ nhân viên chính thức.\n\nQUY ĐỊNH CHÍNH:\n• 12 ngày phép/năm (+1 ngày/5 năm).\n• Chuyển tối đa 5 ngày sang năm sau.\n• Đăng ký trước 3 ngày qua HRIS.\n• Nghỉ ≥3 ngày cần quản lý phê duyệt.\n\nVÍ DỤ TÌNH HUỐNG: NV có 12 ngày, dùng 8 → còn 4 ngày chuyển sang năm sau.\n\nLIÊN HỆ: HR Operations – Ext. 1001")
                .relatedItems(List.of("POL-002", "FAQ-001")).author("Nguyễn Thị Hương").version("2.0")
                .createdDate(LocalDate.of(2024,1,15)).updatedDate(LocalDate.of(2025,1,10))
                .status("Published").rating(4.5).ratingCount(20).build();
            pol1.setComments(new ArrayList<>(List.of(
                Comment.builder().userName("Lê Văn An").text("Rất rõ ràng!").createdDate(LocalDate.of(2025,1,12)).knowledgeItem(pol1).build()
            )));
            items.add(pol1);

            items.add(KnowledgeItem.builder()
                .id("POL-002").title("Chính sách làm việc từ xa (Remote Work Policy)").type("Policy")
                .tags(List.of("working_time", "benefit")).audience("All employees")
                .content("MỤC TIÊU: Linh hoạt làm việc, duy trì năng suất.\n\nPHẠM VI: NV chính thức đã qua thử việc.\n\nQUY ĐỊNH CHÍNH:\n• WFH tối đa 2 ngày/tuần (T3, T5).\n• Đăng ký trước 17:00 ngày trước.\n• Online Slack/Teams 8:30–17:30.\n\nVÍ DỤ TÌNH HUỐNG: WFH ngày khác → cần Team Lead phê duyệt.\n\nLIÊN HỆ: HR Operations – Ext. 1001")
                .relatedItems(List.of("POL-001")).author("Nguyễn Thị Hương").version("1.5")
                .createdDate(LocalDate.of(2024,3,1)).updatedDate(LocalDate.of(2025,2,15))
                .status("Published").rating(4.2).ratingCount(15).build());

            items.add(KnowledgeItem.builder()
                .id("POL-003").title("Quy trình xử lý vi phạm kỷ luật (Disciplinary Action SOP)").type("Policy")
                .tags(List.of("behavior", "contract")).audience("All employees, Line Managers")
                .content("MỤC TIÊU: Xử lý vi phạm công bằng, đúng luật.\n\nPHẠM VI: Toàn bộ NV.\n\nQUY ĐỊNH CHÍNH:\n• Mức 1: Nhắc nhở lời (trễ ≤3 lần/tháng).\n• Mức 2: Cảnh cáo văn bản (vi phạm lặp).\n• Mức 3: Kỷ luật nặng (gian lận, quấy rối).\n• Mức 2+ phải có biên bản + chữ ký.\n\nLIÊN HỆ: HR Compliance – Ext. 1002")
                .relatedItems(List.of("FAQ-003")).author("Trần Minh Đức").version("1.0")
                .createdDate(LocalDate.of(2024,2,20)).updatedDate(LocalDate.of(2024,2,20))
                .status("Published").rating(4.0).ratingCount(10).build());

            items.add(KnowledgeItem.builder()
                .id("POL-004").title("Chính sách bảo hiểm và phúc lợi (Benefits & Insurance)").type("Policy")
                .tags(List.of("benefit", "payroll", "tax")).audience("All employees")
                .content("MỤC TIÊU: Thông tin quyền lợi BH và phúc lợi.\n\nPHẠM VI: NV chính thức.\n\nQUY ĐỊNH CHÍNH:\n• BHXH/BHYT/BHTN: NV 10.5%, CT 21.5%.\n• BH PVI: nội trú 100tr, ngoại trú 20tr, nha khoa 5tr/năm.\n• Khám SK định kỳ 1 lần/năm.\n• Trợ cấp ăn trưa 30,000đ/ngày.\n\nLIÊN HỆ: C&B – Ext. 1003")
                .relatedItems(List.of("FAQ-002", "FAQ-004")).author("Nguyễn Thị Hương").version("3.0")
                .createdDate(LocalDate.of(2024,1,1)).updatedDate(LocalDate.of(2025,1,1))
                .status("Published").rating(4.8).ratingCount(25).build());

            items.add(KnowledgeItem.builder()
                .id("POL-005").title("Chính sách bảo mật thông tin (Information Security)").type("Policy")
                .tags(List.of("behavior", "contract")).audience("All employees")
                .content("MỤC TIÊU: Bảo vệ tài sản thông tin.\n\nPHẠM VI: Tất cả NV và nhà thầu.\n\nQUY ĐỊNH CHÍNH:\n• Đổi mật khẩu 90 ngày, bắt buộc 2FA.\n• Không copy dữ liệu KH ra thiết bị cá nhân.\n• Laptop phải cài MDM + antivirus.\n• Báo cáo sự cố BM trong 2 giờ.\n\nLIÊN HỆ: IT Security – Ext. 2001")
                .relatedItems(List.of()).author("Trần Minh Đức").version("2.0")
                .createdDate(LocalDate.of(2024,4,1)).updatedDate(LocalDate.of(2025,3,15))
                .status("Published").rating(4.3).ratingCount(12).build());

            items.add(KnowledgeItem.builder()
                .id("POL-006").title("Chính sách lương và thanh toán (Payroll Policy)").type("Policy")
                .tags(List.of("payroll", "tax", "contract")).audience("All employees")
                .content("MỤC TIÊU: Lương thanh toán đúng hạn, minh bạch.\n\nPHẠM VI: NV chính thức + thử việc.\n\nQUY ĐỊNH CHÍNH:\n• Lương ngày 5 hàng tháng.\n• Payslip email ngày 3.\n• Thuế TNCN khấu trừ tại nguồn.\n• Thắc mắc: ticket HRIS 5 ngày.\n\nLIÊN HỆ: C&B – Ext. 1003")
                .relatedItems(List.of("FAQ-002", "FAQ-004")).author("Nguyễn Thị Hương").version("2.5")
                .createdDate(LocalDate.of(2024,1,10)).updatedDate(LocalDate.of(2025,1,5))
                .status("Published").rating(4.6).ratingCount(18).build());

            // 4 FAQs
            items.add(KnowledgeItem.builder().id("FAQ-001").title("Tôi còn bao nhiêu ngày phép?").type("FAQ")
                .tags(List.of("leave", "working_time")).audience("All employees")
                .content("HỎI: Kiểm tra ngày phép còn lại?\n\nĐÁP: HRIS → My Leave → Leave Balance. Cập nhật real-time.")
                .relatedItems(List.of("POL-001")).author("Trần Minh Đức").version("1.0")
                .createdDate(LocalDate.of(2024,6,1)).updatedDate(LocalDate.of(2024,6,1))
                .status("Published").rating(4.7).ratingCount(30).build());

            items.add(KnowledgeItem.builder().id("FAQ-002").title("Ngày nào nhận lương? Payslip ở đâu?").type("FAQ")
                .tags(List.of("payroll", "tax")).audience("All employees")
                .content("HỎI: Lương ngày nào? Payslip ở đâu?\n\nĐÁP: Lương ngày 5. Payslip email ngày 3. Không nhận → ticket HRIS 'Payroll Query'.")
                .relatedItems(List.of("POL-006")).author("Nguyễn Thị Hương").version("1.0")
                .createdDate(LocalDate.of(2024,6,1)).updatedDate(LocalDate.of(2024,6,1))
                .status("Published").rating(4.9).ratingCount(35).build());

            items.add(KnowledgeItem.builder().id("FAQ-003").title("Đi trễ bao nhiêu lần thì bị cảnh cáo?").type("FAQ")
                .tags(List.of("behavior", "working_time")).audience("All employees")
                .content("HỎI: Trễ mấy lần bị kỷ luật?\n\nĐÁP: ≤3 lần: verbal. 4+: written warning. 3 tháng liên tiếp: kỷ luật nặng. Giờ chuẩn: 8:30, sau 8:35 = trễ.")
                .relatedItems(List.of("POL-003")).author("Trần Minh Đức").version("1.0")
                .createdDate(LocalDate.of(2024,7,15)).updatedDate(LocalDate.of(2024,7,15))
                .status("Published").rating(4.1).ratingCount(8).build());

            items.add(KnowledgeItem.builder().id("FAQ-004").title("Đăng ký người phụ thuộc giảm trừ thuế TNCN").type("FAQ")
                .tags(List.of("tax", "payroll", "benefit")).audience("All employees")
                .content("HỎI: Đăng ký người phụ thuộc?\n\nĐÁP: Mẫu 09-ĐK-TCT + CCCD + Giấy khai sinh. Nộp C&B trước ngày 20. Giảm trừ 4.4tr/tháng/người.")
                .relatedItems(List.of("POL-006", "POL-004")).author("Nguyễn Thị Hương").version("1.2")
                .createdDate(LocalDate.of(2024,6,10)).updatedDate(LocalDate.of(2025,1,5))
                .status("Published").rating(4.4).ratingCount(14).build());

            // 5 Checklists
            items.add(KnowledgeItem.builder().id("CHK-001").title("Onboarding Checklist – Ngày 1").type("Checklist")
                .tags(List.of("onboarding")).audience("New hires")
                .content("CHECKLIST NGÀY 1\n\n☐ Nhận thẻ NV + access card (8:30)\n☐ IT Setup: laptop, email, Slack, VPN (9:00)\n☐ HR Buddy tour văn phòng (10:00)\n☐ Ký NDA + HĐLĐ (10:30)\n☐ Ăn trưa team (12:00)\n☐ Orientation (13:30)\n☐ Gặp Manager: KPIs 30-60-90 (15:00)\n☐ Hoàn thành hồ sơ HRIS (16:00)")
                .relatedItems(List.of("CHK-002", "CHK-003")).author("Nguyễn Thị Hương").version("3.0")
                .createdDate(LocalDate.of(2024,1,1)).updatedDate(LocalDate.of(2025,2,1))
                .status("Published").rating(4.8).ratingCount(22).build());

            items.add(KnowledgeItem.builder().id("CHK-002").title("Onboarding Checklist – Ngày 2-3").type("Checklist")
                .tags(List.of("onboarding")).audience("New hires")
                .content("CHECKLIST NGÀY 2-3\n\n☐ E-learning: Security (45p)\n☐ E-learning: Code of Conduct (30p)\n☐ E-learning: Safety (20p)\n☐ Đọc Policy POL-001→006\n☐ Cài 2FA\n☐ Standup meeting đầu tiên\n☐ 1-on-1 HR Buddy\n☐ Đăng ký BH PVI + trợ cấp ăn")
                .relatedItems(List.of("CHK-001", "CHK-003")).author("Trần Minh Đức").version("2.0")
                .createdDate(LocalDate.of(2024,1,1)).updatedDate(LocalDate.of(2025,2,1))
                .status("Published").rating(4.5).ratingCount(16).build());

            items.add(KnowledgeItem.builder().id("CHK-003").title("Onboarding Checklist – Ngày 4-5").type("Checklist")
                .tags(List.of("onboarding")).audience("New hires")
                .content("CHECKLIST NGÀY 4-5\n\n☐ Nhận quyền tools (Jira, Figma...)\n☐ Shadow đồng nghiệp\n☐ Task đầu tiên\n☐ Team lunch cuối tuần\n☐ 1-on-1 Manager: feedback\n☐ Onboarding Survey\n☐ Xác nhận hoàn thành tuần 1")
                .relatedItems(List.of("CHK-001", "CHK-002")).author("Trần Minh Đức").version("2.0")
                .createdDate(LocalDate.of(2024,1,1)).updatedDate(LocalDate.of(2025,2,1))
                .status("Published").rating(4.6).ratingCount(14).build());

            items.add(KnowledgeItem.builder().id("CHK-004").title("IT Setup cho nhân viên mới").type("Checklist")
                .tags(List.of("onboarding")).audience("IT Support")
                .content("CHECKLIST IT SETUP\n\n☐ Tạo email @company.vn\n☐ Tạo Slack + channels\n☐ Tạo HRIS account\n☐ Cấu hình laptop (OS, Office, VPN, MDM)\n☐ VPN + 2FA token\n☐ Drive/SharePoint folder\n☐ Access card\n☐ Welcome Email (trước 1 ngày)")
                .relatedItems(List.of("CHK-001")).author("Trần Minh Đức").version("1.5")
                .createdDate(LocalDate.of(2024,2,1)).updatedDate(LocalDate.of(2025,1,15))
                .status("Published").rating(4.3).ratingCount(10).build());

            items.add(KnowledgeItem.builder().id("CHK-005").title("Checklist dành cho Line Manager").type("Checklist")
                .tags(List.of("onboarding")).audience("Line Managers")
                .content("CHECKLIST MANAGER\n\n☐ Xác nhận ngày start với HR\n☐ Chuẩn bị chỗ ngồi\n☐ Kế hoạch 30-60-90\n☐ Chỉ định Buddy\n☐ Thông báo team\n☐ Lịch 1-on-1 hàng tuần\n☐ Danh sách stakeholders\n☐ Confirm tools access với IT")
                .relatedItems(List.of("CHK-001", "CHK-004")).author("Nguyễn Thị Hương").version("1.0")
                .createdDate(LocalDate.of(2024,3,1)).updatedDate(LocalDate.of(2024,3,1))
                .status("Published").rating(4.4).ratingCount(8).build());

            itemRepo.saveAll(items);
            System.out.println("✅ Initialized " + items.size() + " knowledge items");
        };
    }
}
