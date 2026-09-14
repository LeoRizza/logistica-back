-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MANAGER', 'DISPATCHER', 'DRIVER', 'ACCOUNTANT') NOT NULL DEFAULT 'DISPATCHER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `type` ENUM('PROPIO', 'CONTRATADO') NOT NULL DEFAULT 'CONTRATADO',
    `license_exp_date` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `license_number` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `document_number` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `drivers_license_number_key`(`license_number`),
    UNIQUE INDEX `drivers_document_number_key`(`document_number`),
    INDEX `drivers_user_id_idx`(`user_id`),
    INDEX `drivers_is_active_idx`(`is_active`),
    INDEX `drivers_type_idx`(`type`),
    INDEX `drivers_license_exp_date_idx`(`license_exp_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `is_owned` BOOLEAN NOT NULL DEFAULT true,
    `truck_rto_exp_date` DATETIME(3) NULL,
    `trailer_plate` VARCHAR(191) NULL,
    `trailer_rto_exp_date` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `vehicle_type` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `capacity_tons` DOUBLE NULL,
    `capacity_m3` DOUBLE NULL,
    `registration_number` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `vehicles_plate_key`(`plate`),
    UNIQUE INDEX `vehicles_trailer_plate_key`(`trailer_plate`),
    UNIQUE INDEX `vehicles_registration_number_key`(`registration_number`),
    INDEX `vehicles_plate_idx`(`plate`),
    INDEX `vehicles_is_active_idx`(`is_active`),
    INDEX `vehicles_truck_rto_exp_date_idx`(`truck_rto_exp_date`),
    INDEX `vehicles_trailer_rto_exp_date_idx`(`trailer_rto_exp_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `driver_vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `driver_id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,

    INDEX `driver_vehicles_driver_id_idx`(`driver_id`),
    INDEX `driver_vehicles_vehicle_id_idx`(`vehicle_id`),
    UNIQUE INDEX `driver_vehicles_driver_id_vehicle_id_key`(`driver_id`, `vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trips` (
    `id` VARCHAR(191) NOT NULL,
    `reference_number` VARCHAR(191) NOT NULL,
    `origin` VARCHAR(191) NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `scheduled_date` DATETIME(3) NOT NULL,
    `actual_start_date` DATETIME(3) NULL,
    `actual_end_date` DATETIME(3) NULL,
    `distance_km` DOUBLE NULL,
    `estimated_cost` DOUBLE NOT NULL,
    `actual_cost` DOUBLE NULL,
    `load_description` VARCHAR(191) NULL,
    `load_weight_tons` DOUBLE NULL,
    `load_volume_m3` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `driver_id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `created_by_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `trips_reference_number_key`(`reference_number`),
    INDEX `trips_driver_id_idx`(`driver_id`),
    INDEX `trips_vehicle_id_idx`(`vehicle_id`),
    INDEX `trips_created_by_id_idx`(`created_by_id`),
    INDEX `trips_status_idx`(`status`),
    INDEX `trips_scheduled_date_idx`(`scheduled_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_expenses` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `expense_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `due_date` DATETIME(3) NULL,
    `is_recurring` BOOLEAN NOT NULL DEFAULT false,
    `recurrence_period` VARCHAR(191) NULL,
    `payment_status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `payment_date` DATETIME(3) NULL,
    `invoice_number` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `company_expenses_invoice_number_key`(`invoice_number`),
    INDEX `company_expenses_created_by_id_idx`(`created_by_id`),
    INDEX `company_expenses_category_idx`(`category`),
    INDEX `company_expenses_payment_status_idx`(`payment_status`),
    INDEX `company_expenses_is_recurring_idx`(`is_recurring`),
    INDEX `company_expenses_expense_date_idx`(`expense_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_logs` (
    `id` VARCHAR(191) NOT NULL,
    `liters_loaded` DOUBLE NOT NULL,
    `liters_per_km` DOUBLE NULL,
    `previous_fuel_log_id` VARCHAR(191) NULL,
    `distance_km` DOUBLE NULL,
    `fuel_price_per_liter` DOUBLE NOT NULL,
    `total_cost` DOUBLE NOT NULL,
    `odometer_reading` DOUBLE NOT NULL,
    `fuel_type` VARCHAR(191) NOT NULL DEFAULT 'DIESEL',
    `station_name` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `created_by_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `fuel_logs_previous_fuel_log_id_key`(`previous_fuel_log_id`),
    INDEX `fuel_logs_vehicle_id_idx`(`vehicle_id`),
    INDEX `fuel_logs_created_by_id_idx`(`created_by_id`),
    INDEX `fuel_logs_fuel_type_idx`(`fuel_type`),
    INDEX `fuel_logs_created_at_idx`(`created_at`),
    INDEX `fuel_logs_previous_fuel_log_id_idx`(`previous_fuel_log_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_expenses` (
    `id` VARCHAR(191) NOT NULL,
    `category` ENUM('FUEL', 'TOLL', 'MAINTENANCE', 'ACCOMMODATION', 'MEALS', 'OTHER') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `description` VARCHAR(191) NULL,
    `receipt_number` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `payment_status` ENUM('PENDING', 'PARTIAL', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `payment_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `trip_id` VARCHAR(191) NOT NULL,
    `created_by_id` VARCHAR(191) NOT NULL,

    INDEX `trip_expenses_trip_id_idx`(`trip_id`),
    INDEX `trip_expenses_created_by_id_idx`(`created_by_id`),
    INDEX `trip_expenses_category_idx`(`category`),
    INDEX `trip_expenses_payment_status_idx`(`payment_status`),
    INDEX `trip_expenses_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_vehicles` ADD CONSTRAINT `driver_vehicles_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_vehicles` ADD CONSTRAINT `driver_vehicles_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_expenses` ADD CONSTRAINT `company_expenses_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_logs` ADD CONSTRAINT `fuel_logs_previous_fuel_log_id_fkey` FOREIGN KEY (`previous_fuel_log_id`) REFERENCES `fuel_logs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_logs` ADD CONSTRAINT `fuel_logs_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_logs` ADD CONSTRAINT `fuel_logs_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_expenses` ADD CONSTRAINT `trip_expenses_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_expenses` ADD CONSTRAINT `trip_expenses_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
