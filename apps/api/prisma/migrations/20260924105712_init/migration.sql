-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_token_hash_idx`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `target_posisi` VARCHAR(150) NULL,
    `target_industri` VARCHAR(150) NULL,
    `lokasi_preferensi` VARCHAR(150) NULL,
    `ekspektasi_gaji_bawah` DECIMAL(15, 2) NULL,
    `ekspektasi_gaji_atas` DECIMAL(15, 2) NULL,
    `linkedin` VARCHAR(500) NULL,
    `email` VARCHAR(255) NULL,
    `no_hp` VARCHAR(50) NULL,
    `target_lamaran_per_minggu` INTEGER NOT NULL DEFAULT 10,
    `target_dapat_kerja` DATE NULL,
    `status_pencarian` VARCHAR(50) NOT NULL DEFAULT 'Aktif',
    `offer_weights` JSON NOT NULL,
    `onboarding_steps` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `option_lists` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `tipe` VARCHAR(20) NOT NULL,
    `label` VARCHAR(50) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `warna_token` VARCHAR(20) NOT NULL,
    `is_terminal` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `option_lists_user_id_tipe_label_key`(`user_id`, `tipe`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_portals` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `nama_portal` VARCHAR(100) NOT NULL,
    `fokus` VARCHAR(100) NULL,
    `tipe` VARCHAR(50) NULL,
    `link` VARCHAR(500) NULL,
    `cocok_untuk` VARCHAR(255) NULL,
    `catatan` TEXT NULL,
    `is_sample` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `job_portals_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_applications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `tgl_apply` DATE NULL,
    `perusahaan` VARCHAR(150) NOT NULL,
    `posisi` VARCHAR(150) NOT NULL,
    `portal_id` BIGINT NULL,
    `tipe_kerja` VARCHAR(50) NULL,
    `mode_kerja` VARCHAR(50) NULL,
    `lokasi` VARCHAR(150) NULL,
    `est_gaji_bawah` DECIMAL(15, 2) NULL,
    `est_gaji_atas` DECIMAL(15, 2) NULL,
    `est_gaji_teks` VARCHAR(100) NULL,
    `status` VARCHAR(50) NOT NULL,
    `prioritas` VARCHAR(50) NULL,
    `deadline` DATE NULL,
    `tgl_interview` DATE NULL,
    `next_action` VARCHAR(255) NULL,
    `link_lowongan` VARCHAR(500) NULL,
    `catatan` TEXT NULL,
    `status_changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `job_applications_user_id_status_idx`(`user_id`, `status`),
    INDEX `job_applications_user_id_deadline_idx`(`user_id`, `deadline`),
    INDEX `job_applications_user_id_tgl_apply_idx`(`user_id`, `tgl_apply`),
    INDEX `job_applications_portal_id_idx`(`portal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_status_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `job_application_id` BIGINT NOT NULL,
    `status_lama` VARCHAR(50) NULL,
    `status_baru` VARCHAR(50) NOT NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `application_status_logs_job_application_id_changed_at_idx`(`job_application_id`, `changed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `nama_dokumen` VARCHAR(150) NOT NULL,
    `jenis` VARCHAR(50) NULL,
    `versi` VARCHAR(50) NULL,
    `link_drive` VARCHAR(500) NULL,
    `update_terakhir` DATE NULL,
    `status` VARCHAR(50) NULL,
    `catatan` TEXT NULL,
    `is_sample` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `documents_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `perusahaan` VARCHAR(150) NULL,
    `posisi` VARCHAR(150) NULL,
    `hubungan` VARCHAR(50) NULL,
    `kontak` VARCHAR(255) NULL,
    `kontak_terakhir` DATE NULL,
    `status_follow_up` VARCHAR(50) NULL,
    `catatan` TEXT NULL,
    `is_sample` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `contacts_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upskills` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `skill` VARCHAR(150) NOT NULL,
    `kategori` VARCHAR(50) NULL,
    `platform` VARCHAR(100) NULL,
    `link_course` VARCHAR(500) NULL,
    `prioritas` VARCHAR(50) NULL,
    `status` VARCHAR(50) NULL,
    `target_selesai` DATE NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `link_sertifikat` VARCHAR(500) NULL,
    `is_sample` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `upskills_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interview_questions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `pertanyaan` TEXT NOT NULL,
    `kategori` VARCHAR(50) NULL,
    `untuk_role` VARCHAR(150) NULL,
    `star_situation` TEXT NULL,
    `star_task` TEXT NULL,
    `star_action` TEXT NULL,
    `star_result` TEXT NULL,
    `contoh_konkret` TEXT NULL,
    `prioritas` VARCHAR(50) NULL,
    `status` VARCHAR(50) NULL,
    `catatan` TEXT NULL,
    `terakhir_dilatih` DATETIME(3) NULL,
    `is_sample` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `interview_questions_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_benchmarks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `role` VARCHAR(150) NOT NULL,
    `level` VARCHAR(50) NULL,
    `industri` VARCHAR(100) NULL,
    `lokasi` VARCHAR(100) NULL,
    `gaji_bawah` DECIMAL(15, 2) NULL,
    `gaji_atas` DECIMAL(15, 2) NULL,
    `sumber` VARCHAR(255) NULL,
    `catatan` TEXT NULL,
    `is_sample` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `salary_benchmarks_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_offers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `job_application_id` BIGINT NULL,
    `perusahaan` VARCHAR(150) NOT NULL,
    `posisi` VARCHAR(150) NOT NULL,
    `gaji_pokok` DECIMAL(15, 2) NULL,
    `tunjangan` VARCHAR(500) NULL,
    `thp_estimasi` DECIMAL(15, 2) NULL,
    `wlb` INTEGER NOT NULL,
    `jenjang` INTEGER NOT NULL,
    `budaya` INTEGER NOT NULL,
    `catatan` TEXT NULL,
    `is_sample` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `job_offers_user_id_idx`(`user_id`),
    INDEX `job_offers_job_application_id_idx`(`job_application_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `option_lists` ADD CONSTRAINT `option_lists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_portals` ADD CONSTRAINT `job_portals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_portal_id_fkey` FOREIGN KEY (`portal_id`) REFERENCES `job_portals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_status_logs` ADD CONSTRAINT `application_status_logs_job_application_id_fkey` FOREIGN KEY (`job_application_id`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upskills` ADD CONSTRAINT `upskills_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interview_questions` ADD CONSTRAINT `interview_questions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_benchmarks` ADD CONSTRAINT `salary_benchmarks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_offers` ADD CONSTRAINT `job_offers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_offers` ADD CONSTRAINT `job_offers_job_application_id_fkey` FOREIGN KEY (`job_application_id`) REFERENCES `job_applications`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
